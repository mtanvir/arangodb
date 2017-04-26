'use strict';

// //////////////////////////////////////////////////////////////////////////////
// / @brief Foxx service manager
// /
// / @file
// /
// / DISCLAIMER
// /
// / Copyright 2013 triagens GmbH, Cologne, Germany
// /
// / Licensed under the Apache License, Version 2.0 (the "License")
// / you may not use this file except in compliance with the License.
// / You may obtain a copy of the License at
// /
// /     http://www.apache.org/licenses/LICENSE-2.0
// /
// / Unless required by applicable law or agreed to in writing, software
// / distributed under the License is distributed on an "AS IS" BASIS,
// / WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// / See the License for the specific language governing permissions and
// / limitations under the License.
// /
// / Copyright holder is triAGENS GmbH, Cologne, Germany
// /
// / @author Dr. Frank Celler
// / @author Michael Hackstein
// / @author Copyright 2013, triAGENS GmbH, Cologne, Germany
// //////////////////////////////////////////////////////////////////////////////

const fs = require('fs');
const path = require('path');
const querystringify = require('querystring').encode;
const dd = require('dedent');
const utils = require('@arangodb/foxx/manager-utils');
const store = require('@arangodb/foxx/store');
const FoxxService = require('@arangodb/foxx/service');
const generator = require('@arangodb/foxx/generator');
const ensureServiceExecuted = require('@arangodb/foxx/routing').routeService;
const arangodb = require('@arangodb');
const ArangoError = arangodb.ArangoError;
const errors = arangodb.errors;
const aql = arangodb.aql;
const db = arangodb.db;
const ArangoClusterControl = require('@arangodb/cluster');
const request = require('@arangodb/request');
const actions = require('@arangodb/actions');
const shuffle = require('lodash/shuffle');
const zip = require('lodash/zip');

const SYSTEM_SERVICE_MOUNTS = [
  '/_admin/aardvark', // Admin interface.
  '/_api/foxx', // Foxx management API.
  '/_api/gharial' // General_Graph API.
];

const GLOBAL_SERVICE_MAP = new Map();

function warn (e) {
  let err = e;
  while (err) {
    console.warnLines(
      err === e
      ? err.stack
      : `via ${err.stack}`
    );
    err = err.cause;
  }
}

// Cluster helpers

function getAllCoordinatorIds () {
  if (!ArangoClusterControl.isCluster()) {
    return [];
  }
  return global.ArangoClusterInfo.getCoordinators();
}

function getMyCoordinatorId () {
  if (!ArangoClusterControl.isCluster()) {
    return null;
  }
  return global.ArangoServerState.id();
}

function getFoxmasterCoordinatorId () {
  if (!ArangoClusterControl.isCluster()) {
    return null;
  }
  return global.ArangoServerState.getFoxxmaster();
}

function getPeerCoordinatorIds () {
  const myId = getMyCoordinatorId();
  return getAllCoordinatorIds().filter((id) => id !== myId);
}

function isFoxxmaster () {
  if (!ArangoClusterControl.isCluster()) {
    return true;
  }
  return global.ArangoServerState.isFoxxmaster();
}

function proxyToFoxxmaster (req, res) {
  const coordId = getFoxmasterCoordinatorId();
  const response = parallelClusterRequests([[
    coordId,
    req.method,
    req.url,
    req.rawBody,
    req.headers
  ]])[0];
  res.statusCode = response.statusCode;
  res.headers = response.headers;
  res.body = response.rawBody;
}

function isClusterReadyForBusiness () {
  const coordIds = getPeerCoordinatorIds();
  return parallelClusterRequests(function * () {
    for (const coordId of coordIds) {
      yield [coordId, 'GET', '/_api/foxx/_local/status'];
    }
  }()).every(response => response.statusCode === 200);
}

function parallelClusterRequests (requests) {
  let pending = 0;
  let options;
  for (const [coordId, method, url, body, headers] of requests) {
    if (!options) {
      options = {coordTransactionID: global.ArangoClusterComm.getId()};
    }
    options.clientTransactionID = global.ArangoClusterInfo.uniqid();
    global.ArangoClusterComm.asyncRequest(
      method,
      `server:${coordId}`,
      db._name(),
      url,
      body ? (
        typeof body === 'string'
        ? body
        : JSON.stringify(body)
      ) : undefined,
      headers || {},
      options
    );
    pending++;
  }
  if (!pending) {
    return [];
  }
  delete options.clientTransactionID;
  return ArangoClusterControl.wait(options, pending, true);
}

function isFoxxmasterReady () {
  if (!ArangoClusterControl.isCluster()) {
    return true;
  }
  const coordId = getFoxmasterCoordinatorId();
  const response = parallelClusterRequests([[
    coordId,
    'GET',
    '/_api/foxx/_local/status'
  ]])[0];
  if (response.statusCode >= 400) {
    return false;
  }
  return JSON.parse(response.body).ready;
}

function getChecksumsFromPeers (mounts) {
  const coordinatorIds = getPeerCoordinatorIds();
  const responses = parallelClusterRequests(function * () {
    for (const coordId of coordinatorIds) {
      yield [
        coordId,
        'GET',
        `/_api/foxx/_local/checksums?${querystringify({mount: mounts})}`
      ];
    }
  }());
  const peerChecksums = new Map();
  for (const [coordId, response] of zip(coordinatorIds, responses)) {
    const body = JSON.parse(response.body);
    const coordChecksums = new Map();
    for (const mount of Object.keys(body)) {
      coordChecksums.set(mount, body[mount]);
    }
    peerChecksums.set(coordId, coordChecksums);
  }
  return peerChecksums;
}

// Startup and self-heal

function startup (writeToDatabase) {
  const db = require('internal').db;
  const dbName = db._name();
  try {
    db._useDatabase('_system');
    const databases = db._databases();
    for (const name of databases) {
      try {
        db._useDatabase(name);
        rebuildAllServiceBundles(writeToDatabase);
        if (writeToDatabase) {
          upsertSystemServices();
        }
      } catch (e) {
        let err = e;
        while (err) {
          console.warnLines(
            err === e
            ? err.stack
            : `via ${err.stack}`
          );
          err = err.cause;
        }
      }
    }
  } finally {
    db._useDatabase(dbName);
  }
}

function upsertSystemServices () {
  const serviceDefinitions = new Map();
  for (const mount of SYSTEM_SERVICE_MOUNTS) {
    const serviceDefinition = utils.getServiceDefinition(mount) || {mount};
    const service = FoxxService.create(serviceDefinition);
    serviceDefinitions.set(mount, service.toJSON());
  }
  db._query(aql`
    FOR item IN ${Array.from(serviceDefinitions)}
    UPSERT {mount: item[0]}
    INSERT item[1]
    REPLACE item[1]
    IN ${utils.getStorage()}
  `);
}

function rebuildAllServiceBundles (updateDatabase, fixMissingChecksums) {
  const servicesMissingChecksums = [];
  const collection = utils.getStorage();
  for (const serviceDefinition of collection.all()) {
    const mount = serviceDefinition.mount;
    if (mount.startsWith('/_')) {
      continue;
    }
    createServiceBundle(mount);
    if (fixMissingChecksums && !serviceDefinition.checksum) {
      servicesMissingChecksums.push({
        checksum: FoxxService.checksum(mount),
        _key: serviceDefinition._key
      });
    }
  }
  if (!servicesMissingChecksums.length) {
    return;
  }
  db._query(aql`
    FOR service IN ${servicesMissingChecksums}
    UPDATE service._key
    WITH {checksum: service.checksum}
    IN ${collection}
  `);
}

function selfHeal (healTheWorld) {
  const db = require('internal').db;
  const dbName = db._name();
  try {
    db._useDatabase('_system');
    const databases = db._databases();
    const foxxIsReady = isFoxxmasterReady();
    for (const name of databases) {
      try {
        db._useDatabase(name);
        if (healTheWorld) {
          healMyselfAndCoords();
        } else if (foxxIsReady) {
          healMyself();
        }
      } catch (e) {
        let err = e;
        while (err) {
          console.warnLines(
            err === e
            ? err.stack
            : `via ${err.stack}`
          );
          err = err.cause;
        }
      }
    }
  } finally {
    db._useDatabase(dbName);
  }
}

function healMyself () {
  const servicesINeedToFix = new Map();

  const collection = utils.getStorage();
  for (const serviceDefinition of collection.all()) {
    const mount = serviceDefinition.mount;
    const checksum = serviceDefinition.checksum;
    if (mount.startsWith('/_')) {
      continue;
    }
    if (!checksum || checksum !== FoxxService.checksum(mount)) {
      servicesINeedToFix.set(mount, checksum);
    }
  }

  const coordinatorIds = getPeerCoordinatorIds();
  for (const [mount, checksum] of servicesINeedToFix) {
    const coordIdsToTry = shuffle(coordinatorIds);
    for (const coordId of coordIdsToTry) {
      const bundle = downloadServiceBundleFromCoordinator(coordId, mount, checksum);
      if (bundle) {
        replaceLocalServiceFromTempBundle(mount, bundle);
        break;
      }
    }
  }
}

function healMyselfAndCoords () {
  const checksumsINeedToFixLocally = [];
  const actualChecksums = new Map();
  const coordsKnownToBeGoodSources = new Map();
  const coordsKnownToBeBadSources = new Map();
  const allKnownMounts = [];

  const collection = utils.getStorage();
  for (const serviceDefinition of collection.all()) {
    const mount = serviceDefinition.mount;
    const checksum = serviceDefinition.checksum;
    if (mount.startsWith('/_')) {
      continue;
    }
    allKnownMounts.push(mount);
    actualChecksums.set(mount, checksum);
    coordsKnownToBeGoodSources.set(mount, []);
    coordsKnownToBeBadSources.set(mount, new Map());
    if (!checksum || checksum !== FoxxService.checksum(mount)) {
      checksumsINeedToFixLocally.push(mount);
    }
  }

  const serviceChecksumsByCoordinator = getChecksumsFromPeers(allKnownMounts);
  for (const [coordId, serviceChecksums] of serviceChecksumsByCoordinator) {
    for (const [mount, checksum] of serviceChecksums) {
      if (!checksum) {
        coordsKnownToBeBadSources.get(mount).set(coordId, null);
      } else if (!actualChecksums.get(mount)) {
        actualChecksums.set(mount, checksum);
        coordsKnownToBeGoodSources.get(mount).push(coordId);
      } else if (actualChecksums.get(mount) === checksum) {
        coordsKnownToBeGoodSources.get(mount).push(coordId);
      } else {
        coordsKnownToBeBadSources.get(mount).set(coordId, checksum);
      }
    }
  }

  const myId = getMyCoordinatorId();
  const serviceMountsToDeleteInCollection = [];
  const serviceChecksumsToUpdateInCollection = new Map();
  for (const mount of checksumsINeedToFixLocally) {
    const possibleSources = coordsKnownToBeGoodSources.get(mount);
    if (!possibleSources.length) {
      const myChecksum = FoxxService.checksum(mount);
      if (myChecksum) {
        serviceChecksumsToUpdateInCollection.set(mount, myChecksum);
        possibleSources.push(myId);
      } else {
        let found = false;
        for (const [coordId, coordChecksum] of coordsKnownToBeBadSources.get(mount)) {
          if (!coordChecksum) {
            continue;
          }
          serviceChecksumsToUpdateInCollection.set(mount, coordChecksum);
          possibleSources.push(coordId);
          const bundle = downloadServiceBundleFromCoordinator(coordId, mount, coordChecksum);
          replaceLocalServiceFromTempBundle(mount, bundle);
          found = true;
          break;
        }
        if (!found) {
          serviceMountsToDeleteInCollection.push(mount);
          coordsKnownToBeBadSources.delete(mount);
        }
      }
    } else {
      const checksum = actualChecksums.get(mount);
      for (const coordId of possibleSources) {
        const bundle = downloadServiceBundleFromCoordinator(coordId, mount, checksum);
        if (bundle) {
          replaceLocalServiceFromTempBundle(mount, bundle);
          break;
        }
      }
    }
  }

  for (const ids of coordsKnownToBeGoodSources.values()) {
    ids.push(myId);
  }

  db._query(aql`
    FOR service IN ${collection}
    FILTER service.mount IN ${serviceMountsToDeleteInCollection}
    REMOVE service
    IN ${collection}
  `);

  db._query(aql`
    FOR service IN ${collection}
    FOR item IN ${Array.from(serviceChecksumsToUpdateInCollection)}
    FILTER service.mount == item[0]
    UPDATE service
    WITH {checksum: item[1]}
    IN ${collection}
  `);

  parallelClusterRequests(function * () {
    for (const coordId of getPeerCoordinatorIds()) {
      const servicesYouNeedToUpdate = {};
      for (const [mount, badCoordinatorIds] of coordsKnownToBeBadSources) {
        if (!badCoordinatorIds.has(coordId)) {
          continue;
        }
        const goodCoordIds = coordsKnownToBeGoodSources.get(mount);
        servicesYouNeedToUpdate[mount] = shuffle(goodCoordIds);
      }
      if (!Object.keys(servicesYouNeedToUpdate).length) {
        continue;
      }
      yield [
        coordId,
        'POST',
        '/_api/foxx/_local',
        JSON.stringify(servicesYouNeedToUpdate),
        {'content-type': 'application/json'}
      ];
    }
  }());
}

// Change propagation

function reloadRouting () {
  require('internal').executeGlobalContextFunction('reloadRouting');
  actions.reloadRouting();
}

function propagateServiceDestroyed (service) { // okay-ish
  parallelClusterRequests(function * () {
    for (const coordId of getPeerCoordinatorIds()) {
      yield [coordId, 'DELETE', `/_api/foxx/_local/service?${querystringify({
        mount: service.mount
      })}`];
    }
  }());
  reloadRouting();
}

function propagateServiceReplaced (service) { // okay-ish
  const myId = getMyCoordinatorId();
  parallelClusterRequests(function * () {
    for (const coordId of getPeerCoordinatorIds()) {
      yield [
        coordId,
        'POST',
        '/_api/foxx/_local',
        JSON.stringify({[service.mount]: [myId]}),
        {'content-type': 'application/json'}
      ];
    }
  }());
  reloadRouting();
}

function propagateServiceReconfigured (service) { // okay-ish
  parallelClusterRequests(function * () {
    for (const coordId of getPeerCoordinatorIds()) {
      yield [coordId, 'POST', `/_api/foxx/_local/service?${querystringify({
        mount: service.mount
      })}`];
    }
  }());
  reloadRouting();
}

// GLOBAL_SERVICE_MAP manipulation

function initLocalServiceMap () {
  const localServiceMap = new Map();
  for (const mount of SYSTEM_SERVICE_MOUNTS) {
    const serviceDefinition = utils.getServiceDefinition(mount) || {mount};
    const service = FoxxService.create(serviceDefinition);
    localServiceMap.set(service.mount, service);
  }
  for (const serviceDefinition of utils.getStorage().all()) {
    const service = FoxxService.create(serviceDefinition);
    localServiceMap.set(service.mount, service);
  }
  GLOBAL_SERVICE_MAP.set(db._name(), localServiceMap);
}

function ensureFoxxInitialized () {
  if (!GLOBAL_SERVICE_MAP.has(db._name())) {
    initLocalServiceMap();
  }
}

function ensureServiceLoaded (mount) {
  const service = getServiceInstance(mount);
  return ensureServiceExecuted(service, false);
}

function getServiceInstance (mount) {
  ensureFoxxInitialized();
  const localServiceMap = GLOBAL_SERVICE_MAP.get(db._name());
  if (localServiceMap.has(mount)) {
    return localServiceMap.get(mount);
  }
  return reloadInstalledService(mount);
}

function reloadInstalledService (mount, runSetup) {
  const serviceDefinition = utils.getServiceDefinition(mount);
  if (!serviceDefinition) {
    throw new ArangoError({
      errorNum: errors.ERROR_SERVICE_NOT_FOUND.code,
      errorMessage: dd`
        ${errors.ERROR_SERVICE_NOT_FOUND.message}
        Mount path: "${mount}".
      `
    });
  }
  const service = FoxxService.create(serviceDefinition);
  if (runSetup) {
    service.executeScript('setup');
  }
  GLOBAL_SERVICE_MAP.get(db._name()).set(mount, service);
  return service;
}

// Misc?

function patchManifestFile (servicePath, patchData) {
  const filename = path.join(servicePath, 'manifest.json');
  let manifest;
  try {
    const rawManifest = fs.readFileSync(filename, 'utf-8');
    manifest = JSON.parse(rawManifest);
  } catch (e) {
    throw Object.assign(
      new ArangoError({
        errorNum: errors.ERROR_MALFORMED_MANIFEST_FILE.code,
        errorMessage: dd`
          ${errors.ERROR_MALFORMED_MANIFEST_FILE.message}
          File: ${filename}
        `
      }), {cause: e}
    );
  }
  Object.assign(manifest, patchData);
  fs.writeFileSync(filename, JSON.stringify(manifest, null, 2));
}

function _buildServiceInPath (serviceInfo, options = {}) { // okay-ish
  const destPath = fs.getTempFile('services', false);
  try {
    if (serviceInfo === 'EMPTY') {
      const generated = generator.generate(options);
      generator.write(destPath, generated.files, generated.folders);
    } else {
      if (/^GIT:/i.test(serviceInfo)) {
        const splitted = serviceInfo.split(':');
        const baseUrl = process.env.FOXX_BASE_URL || 'https://github.com';
        serviceInfo = `${baseUrl}${splitted[1]}/archive/${splitted[2] || 'master'}.zip`;
      } else if (/^uploads[/\\]tmp-/.test(serviceInfo)) {
        serviceInfo = path.join(fs.getTempPath(), serviceInfo);
      }
      if (/^https?:/i.test(serviceInfo)) {
        const tempFile = downloadServiceBundleFromRemote(serviceInfo);
        extractServiceBundle(tempFile, destPath, true);
      } else if (utils.pathRegex.test(serviceInfo)) {
        if (fs.isDirectory(serviceInfo)) {
          const tempFile = utils.zipDirectory(serviceInfo);
          extractServiceBundle(tempFile, destPath, true);
        } else if (!fs.exists(serviceInfo)) {
          throw new ArangoError({
            errorNum: errors.ERROR_SERVICE_SOURCE_NOT_FOUND.code,
            errorMessage: dd`
              ${errors.ERROR_SERVICE_SOURCE_NOT_FOUND.message}
              Path: ${serviceInfo}
            `
          });
        } else {
          extractServiceBundle(serviceInfo, destPath, false);
        }
      } else {
        if (options.refresh) {
          try {
            store.update();
          } catch (e) {
            warn(e);
          }
        }
        const info = store.installationInfo(serviceInfo);
        const tempFile = downloadServiceBundleFromRemote(info.url);
        extractServiceBundle(tempFile, destPath, true);
        patchManifestFile(destPath, info.manifest);
      }
    }
    if (options.legacy) {
      patchManifestFile(destPath, {engines: {arangodb: '^2.8.0'}});
    }
    return destPath;
  } catch (e) {
    fs.removeDirectoryRecursive(destPath, true);
    throw e;
  }
}

function _install (tempServicePath, mount, options = {}) {
  const servicePath = FoxxService.basePath(mount);
  fs.move(tempServicePath, servicePath);
  const collection = utils.getStorage();
  try {
    const service = FoxxService.create({
      mount,
      options,
      noisy: true
    });
    GLOBAL_SERVICE_MAP.get(db._name()).set(mount, service);
    if (options.setup !== false) {
      service.executeScript('setup');
    }
    createServiceBundle(mount);
    service.updateChecksum();
    const serviceDefinition = service.toJSON();
    db._query(aql`
      UPSERT {mount: ${mount}}
      INSERT ${serviceDefinition}
      REPLACE ${serviceDefinition}
      IN ${collection}
    `);
    ensureServiceExecuted(service, true);
    return service;
  } catch (e) {
    fs.removeDirectoryRecursive(servicePath, true);
    db._query(aql`
      FOR service IN ${collection}
      FILTER service.mount == ${mount}
      REMOVE service IN ${collection}
    `);
    throw e;
  }
}

function _uninstall (mount, options = {}) {
  let service;
  try {
    service = getServiceInstance(mount);
  } catch (e) {
    if (!options.force) {
      throw e;
    }
    warn(e);
  }
  if (service && options.teardown !== false) {
    try {
      service.executeScript('teardown');
    } catch (e) {
      if (!options.force) {
        throw e;
      }
      warn(e);
    }
  }
  const collection = utils.getStorage();
  db._query(aql`
    FOR service IN ${collection}
    FILTER service.mount == ${mount}
    REMOVE service IN ${collection}
  `);
  GLOBAL_SERVICE_MAP.get(db._name()).delete(mount);
  const servicePath = FoxxService.basePath(mount);
  if (fs.exists(servicePath)) {
    fs.removeDirectoryRecursive(servicePath, options.force);
  }
  const bundlePath = FoxxService.bundlePath(mount);
  if (fs.exists(bundlePath)) {
    try {
      fs.remove(bundlePath);
    } catch (e) {
      if (!options.force) {
        throw e;
      }
      warn(e);
    }
  }
  return service;
}

// Service bundle manipulation

function createServiceBundle (mount) {
  const servicePath = FoxxService.basePath(mount);
  const bundlePath = FoxxService.bundlePath(mount);
  if (fs.exists(bundlePath)) {
    fs.remove(bundlePath);
  }
  fs.makeDirectoryRecursive(path.dirname(bundlePath));
  utils.zipDirectory(servicePath, bundlePath);
}

function downloadServiceBundleFromRemote (url) {
  try {
    const res = request.get(url, {encoding: null});
    res.throw();
    const tempFile = fs.getTempFile('downloads', false);
    fs.writeFileSync(tempFile, res.body);
    return tempFile;
  } catch (e) {
    throw Object.assign(
      new ArangoError({
        errorNum: errors.ERROR_SERVICE_SOURCE_ERROR.code,
        errorMessage: dd`
          ${errors.ERROR_SERVICE_SOURCE_ERROR.message}
          URL: ${url}
        `
      }),
      {cause: e}
    );
  }
}

function downloadServiceBundleFromCoordinator (coordId, mount, checksum) {
  const response = parallelClusterRequests([[
    coordId,
    'GET',
    `/_api/foxx/bundle${querystringify({mount})}`,
    null,
    checksum ? {'if-match': `"${checksum}"`} : undefined
  ]])[0];
  if (response.headers['x-arango-response-code'].startsWith('404')) {
    return null;
  }
  const filename = fs.getTempFile('foxx-manager', true);
  fs.writeFileSync(filename, response.rawBody);
  return filename;
}

function extractServiceBundle (archive, targetPath, deleteArchive) {
  try {
    const tempFolder = fs.getTempFile('zip', false);
    fs.makeDirectory(tempFolder);
    fs.unzipFile(archive, tempFolder, false, true);

    let manifestPath;
    // find the manifest with the shortest path
    const filenames = fs.listTree(tempFolder).sort((a, b) => a.length - b.length);
    for (const filename of filenames) {
      if (filename === 'manifest.json' || filename.endsWith('/manifest.json')) {
        manifestPath = filename;
        break;
      }
    }

    if (!manifestPath) {
      throw new ArangoError({
        errorNum: errors.ERROR_SERVICE_MANIFEST_NOT_FOUND.code,
        errorMessage: dd`
          ${errors.ERROR_SERVICE_MANIFEST_NOT_FOUND.message}
          Source: ${tempFolder}
        `
      });
    }

    let basePath = path.dirname(path.resolve(tempFolder, manifestPath));
    if (fs.exists(targetPath)) {
      fs.removeDirectory(targetPath);
    }
    fs.move(basePath, targetPath);

    if (manifestPath.endsWith('/manifest.json')) {
      // service basePath is a subfolder of tempFolder
      // so tempFolder still exists and needs to be removed
      fs.removeDirectoryRecursive(tempFolder, true);
    }
  } finally {
    if (deleteArchive) {
      try {
        fs.remove(archive);
      } catch (e) {
        warn(Object.assign(
          new Error(`Cannot remove temporary file "${archive}"`),
          {cause: e}
        ));
      }
    }
  }
}

function replaceLocalServiceFromTempBundle (mount, tempFile) {
  const bundlePath = FoxxService.bundlePath(mount);
  fs.makeDirectoryRecursive(path.dirname(bundlePath));
  fs.move(tempFile, bundlePath);
  const servicePath = FoxxService.basePath(mount);
  fs.makeDirectoryRecursive(path.dirname(servicePath));
  extractServiceBundle(bundlePath, servicePath, true);
}

// Exported functions for manipulating services

function install (serviceInfo, mount, options = {}) {
  utils.validateMount(mount);
  ensureFoxxInitialized();
  if (utils.getServiceDefinition(mount)) {
    throw new ArangoError({
      errorNum: errors.ERROR_SERVICE_MOUNTPOINT_CONFLICT.code,
      errorMessage: dd`
        ${errors.ERROR_SERVICE_MOUNTPOINT_CONFLICT.message}
        Mount path: "${mount}".
      `
    });
  }
  const servicePath = FoxxService.basePath(mount);
  if (fs.exists(servicePath)) {
    fs.removeDirectoryRecursive(servicePath, true);
  }
  fs.makeDirectoryRecursive(path.dirname(servicePath));
  const tempServicePath = _buildServiceInPath(serviceInfo, options);
  const service = _install(tempServicePath, mount, options);
  propagateServiceReplaced(service);
  return service;
}

function installLocal (mount, coordIds) {
  for (const coordId of coordIds) {
    const filename = downloadServiceBundleFromCoordinator(coordId, mount);
    if (filename) {
      extractServiceBundle(filename, FoxxService.basePath(mount), true);
      reloadRouting();
      return true;
    }
  }
  return false;
}

function uninstall (mount, options = {}) {
  ensureFoxxInitialized();
  const service = _uninstall(mount, options);
  propagateServiceDestroyed(service);
  return service;
}

function replace (serviceInfo, mount, options = {}) {
  utils.validateMount(mount);
  ensureFoxxInitialized();
  const tempServicePath = _buildServiceInPath(serviceInfo, options);
  FoxxService.validatedManifest({
    mount,
    basePath: tempServicePath,
    noisy: true
  });
  _uninstall(mount, Object.assign({teardown: true}, options, {force: true}));
  const service = _install(tempServicePath, mount, Object.assign({}, options, {force: true}));
  propagateServiceReplaced(service);
  return service;
}

function upgrade (serviceInfo, mount, options = {}) {
  ensureFoxxInitialized();
  const oldService = getServiceInstance(mount);
  const serviceOptions = oldService.toJSON().options;
  Object.assign(serviceOptions.configuration, options.configuration);
  Object.assign(serviceOptions.dependencies, options.dependencies);
  serviceOptions.development = options.development;
  const tempServicePath = _buildServiceInPath(serviceInfo, options);
  FoxxService.validatedManifest({
    mount,
    basePath: tempServicePath,
    noisy: true
  });
  _uninstall(mount, Object.assign({teardown: false}, options, {force: true}));
  const service = _install(tempServicePath, mount, Object.assign({}, options, serviceOptions, {force: true}));
  propagateServiceReplaced(service);
  return service;
}

function runScript (scriptName, mount, options) {
  let service = getServiceInstance(mount);
  if (service.isDevelopment) {
    const runSetup = scriptName !== 'setup';
    service = reloadInstalledService(mount, runSetup);
  }
  ensureServiceLoaded(mount);
  const result = service.executeScript(scriptName, options);
  return result === undefined ? null : result;
}

function runTests (mount, options = {}) {
  let service = getServiceInstance(mount);
  if (service.isDevelopment) {
    service = reloadInstalledService(mount, true);
  }
  ensureServiceLoaded(mount);
  return require('@arangodb/foxx/mocha').run(service, options.reporter);
}

function setDevelopmentMode (mount, enabled = true) {
  const service = getServiceInstance(mount);
  service.development(enabled);
  utils.updateService(mount, service.toJSON());
  if (!enabled) {
    // Make sure setup changes from devmode are respected
    service.executeScript('setup');
  }
  propagateServiceReconfigured(service);
  return service;
}

function setConfiguration (mount, options = {}) {
  const service = getServiceInstance(mount);
  const warnings = service.applyConfiguration(options.configuration, options.replace);
  utils.updateService(mount, service.toJSON());
  propagateServiceReconfigured(service);
  return warnings;
}

function setDependencies (mount, options = {}) {
  const service = getServiceInstance(mount);
  const warnings = service.applyDependencies(options.dependencies, options.replace);
  utils.updateService(mount, service.toJSON());
  propagateServiceReconfigured(service);
  return warnings;
}

// Misc exported functions

function requireService (mount) {
  mount = '/' + mount.replace(/^\/+|\/+$/g, '');
  const service = getServiceInstance(mount);
  return ensureServiceExecuted(service, true).exports;
}

function getMountPoints () {
  ensureFoxxInitialized();
  return Array.from(GLOBAL_SERVICE_MAP.get(db._name()).keys());
}

function installedServices () {
  ensureFoxxInitialized();
  return Array.from(GLOBAL_SERVICE_MAP.get(db._name()).values());
}

function listJson () {
  ensureFoxxInitialized();
  const json = [];
  for (const service of GLOBAL_SERVICE_MAP.get(db._name()).values()) {
    json.push({
      mount: service.mount,
      name: service.manifest.name,
      description: service.manifest.description,
      author: service.manifest.author,
      system: service.isSystem,
      development: service.isDevelopment,
      contributors: service.manifest.contributors || false,
      license: service.manifest.license,
      version: service.manifest.version,
      path: service.basePath,
      config: service.getConfiguration(),
      deps: service.getDependencies(),
      scripts: service.getScripts()
    });
  }
  return json;
}

// Exports

exports.install = install;
exports._installLocal = installLocal;
exports.uninstall = uninstall;
exports.replace = replace;
exports.upgrade = upgrade;
exports.runTests = runTests;
exports.runScript = runScript;
exports.development = (mount) => setDevelopmentMode(mount, true);
exports.production = (mount) => setDevelopmentMode(mount, false);
exports.setConfiguration = setConfiguration;
exports.setDependencies = setDependencies;
exports.requireService = requireService;
exports.lookupService = getServiceInstance;
exports.installedServices = installedServices;

// -------------------------------------------------
// Exported internals
// -------------------------------------------------

exports.isFoxxmaster = isFoxxmaster;
exports.proxyToFoxxmaster = proxyToFoxxmaster;
exports._reloadRouting = reloadRouting;
exports.reloadInstalledService = reloadInstalledService;
exports.ensureRouted = ensureServiceLoaded;
exports.initializeFoxx = initLocalServiceMap;
exports.ensureFoxxInitialized = ensureFoxxInitialized;
exports._startup = startup;
exports._selfHeal = selfHeal;
exports._createServiceBundle = createServiceBundle;
exports._resetCache = () => GLOBAL_SERVICE_MAP.clear();
exports._mountPoints = getMountPoints;
exports._isClusterReady = isClusterReadyForBusiness;
exports.listJson = listJson;

// -------------------------------------------------
// Exports from foxx utils module
// -------------------------------------------------

exports.getServiceDefinition = utils.getServiceDefinition;
exports.list = utils.list;
exports.listDevelopment = utils.listDevelopment;
exports.listDevelopmentJson = utils.listDevelopmentJson;

// -------------------------------------------------
// Exports from foxx store module
// -------------------------------------------------

exports.available = store.available;
exports.availableJson = store.availableJson;
exports.getFishbowlStorage = store.getFishbowlStorage;
exports.search = store.search;
exports.searchJson = store.searchJson;
exports.update = store.update;
exports.info = store.info;
