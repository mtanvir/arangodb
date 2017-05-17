/* jshint unused: false */
/* global Blob, window, sigma, $, Tippy, document, _, arangoHelper, frontendConfig, arangoHelper, localStorage */

(function () {
  'use strict';
  var isCoordinator = null;

  window.isCoordinator = function (callback) {
    if (isCoordinator === null) {
      $.ajax(
        'cluster/amICoordinator',
        {
          async: true,
          success: function (d) {
            isCoordinator = d;
            callback(false, d);
          },
          error: function (d) {
            isCoordinator = d;
            callback(true, d);
          }
        }
      );
    } else {
      callback(false, isCoordinator);
    }
  };

  window.versionHelper = {
    fromString: function (s) {
      var parts = s.replace(/-[a-zA-Z0-9_-]*$/g, '').split('.');
      return {
        major: parseInt(parts[0], 10) || 0,
        minor: parseInt(parts[1], 10) || 0,
        patch: parseInt(parts[2], 10) || 0,
        toString: function () {
          return this.major + '.' + this.minor + '.' + this.patch;
        }
      };
    },
    toString: function (v) {
      return v.major + '.' + v.minor + '.' + v.patch;
    }
  };

  window.arangoHelper = {

    alphabetColors: {
      a: 'rgb(0,0,180)',
      b: 'rgb(175,13,102)',
      c: 'rgb(146,248,70)',
      d: 'rgb(255,200,47)',
      e: 'rgb(255,118,0)',
      f: 'rgb(185,185,185)',
      g: 'rgb(235,235,222)',
      h: 'rgb(100,100,100)',
      i: 'rgb(255,255,0)',
      j: 'rgb(55,19,112)',
      k: 'rgb(255,255,150)',
      l: 'rgb(202,62,94)',
      m: 'rgb(205,145,63)',
      n: 'rgb(12,75,100)',
      o: 'rgb(255,0,0)',
      p: 'rgb(175,155,50)',
      q: 'rgb(0,0,0)',
      r: 'rgb(37,70,25)',
      s: 'rgb(121,33,135)',
      t: 'rgb(83,140,208)',
      u: 'rgb(0,154,37)',
      v: 'rgb(178,220,205)',
      w: 'rgb(255,152,213)',
      x: 'rgb(0,0,74)',
      y: 'rgb(175,200,74)',
      z: 'rgb(63,25,12)'
    },

    statusColors: {
      fatal: '#ad5148',
      info: 'rgb(88, 214, 141)',
      error: 'rgb(236, 112, 99)',
      warning: '#ffb075',
      debug: 'rgb(64, 74, 83)'
    },

    getCurrentJwt: function () {
      return localStorage.getItem('jwt');
    },

    getCurrentJwtUsername: function () {
      return localStorage.getItem('jwtUser');
    },

    setCurrentJwt: function (jwt, username) {
      localStorage.setItem('jwt', jwt);
      localStorage.setItem('jwtUser', username);
    },

    getCoordinatorShortName: function (id) {
      var shortName;
      if (window.clusterHealth) {
        _.each(window.clusterHealth, function (value, key) {
          if (id === key) {
            shortName = value.ShortName;
          }
        });
      }
      return shortName;
    },

    getDatabaseShortName: function (id) {
      return this.getCoordinatorShortName(id);
    },

    getDatabaseServerId: function (shortname) {
      var id;
      if (window.clusterHealth) {
        _.each(window.clusterHealth, function (value, key) {
          if (shortname === value.ShortName) {
            id = key;
          }
        });
      }
      return id;
    },

    lastNotificationMessage: null,

    CollectionTypes: {},
    systemAttributes: function () {
      return {
        '_id': true,
        '_rev': true,
        '_key': true,
        '_bidirectional': true,
        '_vertices': true,
        '_from': true,
        '_to': true,
        '$id': true
      };
    },

    getCurrentSub: function () {
      return window.App.naviView.activeSubMenu;
    },

    parseError: function (title, err) {
      var msg;

      try {
        msg = JSON.parse(err.responseText).errorMessage;
      } catch (e) {
        msg = e;
      }

      this.arangoError(title, msg);
    },

    setCheckboxStatus: function (id) {
      _.each($(id).find('ul').find('li'), function (element) {
        if (!$(element).hasClass('nav-header')) {
          if ($(element).find('input').attr('checked')) {
            if ($(element).find('i').hasClass('css-round-label')) {
              $(element).find('i').addClass('fa-dot-circle-o');
            } else {
              $(element).find('i').addClass('fa-check-square-o');
            }
          } else {
            if ($(element).find('i').hasClass('css-round-label')) {
              $(element).find('i').addClass('fa-circle-o');
            } else {
              $(element).find('i').addClass('fa-square-o');
            }
          }
        }
      });
    },

    parseInput: function (element) {
      var parsed;
      var string = $(element).val();

      try {
        parsed = JSON.parse(string);
      } catch (e) {
        parsed = string;
      }

      return parsed;
    },

    calculateCenterDivHeight: function () {
      var navigation = $('.navbar').height();
      var footer = $('.footer').height();
      var windowHeight = $(window).height();

      return windowHeight - footer - navigation - 110;
    },

    createTooltips: function (selector, position) {
      var self = this;

      var settings = {
        arrow: true,
        animation: 'fade',
        animateFill: false,
        multiple: false,
        hideDuration: 1
      };

      if (position) {
        settings.position = position;
      }

      if (!selector) {
        selector = '.tippy';
      }

      if (typeof selector === 'object') {
        _.each(selector, function (elem) {
          self.lastTooltips = new Tippy(elem, settings);
        });
      } else {
        if (selector.indexOf(',') > -1) {
          var selectors = selector.split(',');
          _.each(selectors, function (elem) {
            self.lastTooltips = new Tippy(elem, settings);
          });
        }
        this.lastTooltips = new Tippy(selector, settings);
      }
    },

    fixTooltips: function (selector, placement) {
      arangoHelper.createTooltips(selector, placement);
      /*
      $(selector).tooltip({
        placement: placement,
        hide: false,
        show: false
      });
      */
    },

    currentDatabase: function (callback) {
      if (frontendConfig.db) {
        callback(false, frontendConfig.db);
      } else {
        callback(true, undefined);
      }
      return frontendConfig.db;
    },

    allHotkeys: {
      /*
      global: {
        name: "Site wide",
        content: [{
          label: "scroll up",
          letter: "j"
        },{
          label: "scroll down",
          letter: "k"
        }]
      },
      */
      jsoneditor: {
        name: 'AQL editor',
        content: [{
          label: 'Execute Query',
          letter: 'Ctrl/Cmd + Return'
        }, {
          label: 'Execute Selected Query',
          letter: 'Ctrl/Cmd + Alt + Return'
        }, {
          label: 'Explain Query',
          letter: 'Ctrl/Cmd + Shift + Return'
        }, {
          label: 'Save Query',
          letter: 'Ctrl/Cmd + Shift + S'
        }, {
          label: 'Open search',
          letter: 'Ctrl + Space'
        }, {
          label: 'Toggle comments',
          letter: 'Ctrl/Cmd + Shift + C'
        }, {
          label: 'Undo',
          letter: 'Ctrl/Cmd + Z'
        }, {
          label: 'Redo',
          letter: 'Ctrl/Cmd + Shift + Z'
        }, {
          label: 'Increase Font Size',
          letter: 'Shift + Alt + Up'
        }, {
          label: 'Decrease Font Size',
          letter: 'Shift + Alt + Down'
        }]
      },
      doceditor: {
        name: 'Document editor',
        content: [{
          label: 'Insert',
          letter: 'Ctrl + Insert'
        }, {
          label: 'Save',
          letter: 'Ctrl + Return, Cmd + Return'
        }, {
          label: 'Append',
          letter: 'Ctrl + Shift + Insert'
        }, {
          label: 'Duplicate',
          letter: 'Ctrl + D'
        }, {
          label: 'Remove',
          letter: 'Ctrl + Delete'
        }]
      },
      modals: {
        name: 'Modal',
        content: [{
          label: 'Submit',
          letter: 'Return'
        }, {
          label: 'Close',
          letter: 'Esc'
        }, {
          label: 'Navigate buttons',
          letter: 'Arrow keys'
        }, {
          label: 'Navigate content',
          letter: 'Tab'
        }]
      }
    },

    hotkeysFunctions: {
      scrollDown: function () {
        window.scrollBy(0, 180);
      },
      scrollUp: function () {
        window.scrollBy(0, -180);
      },
      showHotkeysModal: function () {
        var buttons = [];
        var content = window.arangoHelper.allHotkeys;

        window.modalView.show('modalHotkeys.ejs', 'Keyboard Shortcuts', buttons, content);
      }
    },

    // object: {"name": "Menu 1", func: function(), active: true/false }
    buildSubNavBar: function (menuItems) {
      $('#subNavigationBar .bottom').html('');
      var cssClass;

      _.each(menuItems, function (menu, name) {
        cssClass = '';

        if (menu.active) {
          cssClass += ' active';
        }
        if (menu.disabled) {
          cssClass += ' disabled';
        }

        $('#subNavigationBar .bottom').append(
          '<li class="subMenuEntry ' + cssClass + '"><a>' + name + '</a></li>'
        );
        if (!menu.disabled) {
          $('#subNavigationBar .bottom').children().last().bind('click', function () {
            window.App.navigate(menu.route, {trigger: true});
          });
        }
      });
    },

    buildUserSubNav: function (username, activeKey) {
      var menus = {
        General: {
          route: '#user/' + encodeURIComponent(username)
        },
        Permissions: {
          route: '#user/' + encodeURIComponent(username) + '/permission'
        }
      };

      menus[activeKey].active = true;
      this.buildSubNavBar(menus);
    },

    buildGraphSubNav: function (graph, activeKey) {
      var menus = {
        Content: {
          route: '#graph/' + encodeURIComponent(graph)
        },
        Settings: {
          route: '#graph/' + encodeURIComponent(graph) + '/settings'
        }
      };

      menus[activeKey].active = true;
      this.buildSubNavBar(menus);
    },

    buildNodeSubNav: function (node, activeKey, disabled) {
      var menus = {
        Dashboard: {
          route: '#node/' + encodeURIComponent(node)
        }
      /*
      Logs: {
        route: '#nLogs/' + encodeURIComponent(node),
        disabled: true
      }
         */
      };

      menus[activeKey].active = true;
      menus[disabled].disabled = true;
      this.buildSubNavBar(menus);
    },

    buildNodesSubNav: function (activeKey, disabled) {
      var menus = {
        Overview: {
          route: '#nodes'
        },
        Shards: {
          route: '#shards'
        }
      };

      menus[activeKey].active = true;
      if (disabled) {
        menus[disabled].disabled = true;
      }
      this.buildSubNavBar(menus);
    },

    scaleability: undefined,

    /*
    //nav for cluster/nodes view
    buildNodesSubNav: function(type) {

      //if nothing is set, set default to coordinator
      if (type === undefined) {
        type = 'coordinator'
      }

      if (this.scaleability === undefined) {
        var self = this

        $.ajax({
          type: "GET",
          cache: false,
          url: arangoHelper.databaseUrl("/_admin/cluster/numberOfServers"),
          contentType: "application/json",
          processData: false,
          success: function(data) {
            if (data.numberOfCoordinators !== null && data.numberOfDBServers !== null) {
              self.scaleability = true
              self.buildNodesSubNav(type)
            }
            else {
              self.scaleability = false
            }
          }
        })
      }

      var menus = {
        Coordinators: {
          route: '#cNodes'
        },
        DBServers: {
          route: '#dNodes'
        }
      }

      menus.Scale = {
        route: '#sNodes',
        disabled: true
      }

      if (type === 'coordinator') {
        menus.Coordinators.active = true
      }
      else if (type === 'scale') {
        if (this.scaleability === true) {
          menus.Scale.active = true
        }
        else {
          window.App.navigate('#nodes', {trigger: true})
        }
      }
      else {
        menus.DBServers.active = true
      }

      if (this.scaleability === true) {
        menus.Scale.disabled = false
      }

      this.buildSubNavBar(menus)
    },
    */

    // nav for collection view
    buildCollectionSubNav: function (collectionName, activeKey) {
      var defaultRoute = '#collection/' + encodeURIComponent(collectionName);

      var menus = {
        Content: {
          route: defaultRoute + '/documents/1'
        },
        Indexes: {
          route: '#cIndices/' + encodeURIComponent(collectionName)
        },
        Info: {
          route: '#cInfo/' + encodeURIComponent(collectionName)
        },
        Settings: {
          route: '#cSettings/' + encodeURIComponent(collectionName)
        }
      };

      menus[activeKey].active = true;
      this.buildSubNavBar(menus);
    },

    enableKeyboardHotkeys: function (enable) {
      var hotkeys = window.arangoHelper.hotkeysFunctions;
      if (enable === true) {
        $(document).on('keydown', null, 'j', hotkeys.scrollDown);
        $(document).on('keydown', null, 'k', hotkeys.scrollUp);
      }
    },

    databaseAllowed: function (callback) {
      var dbCallback = function (error, db) {
        if (error) {
          arangoHelper.arangoError('', '');
        } else {
          $.ajax({
            type: 'GET',
            cache: false,
            url: this.databaseUrl('/_api/database/', db),
            contentType: 'application/json',
            processData: false,
            success: function () {
              callback(false, true);
            },
            error: function () {
              callback(true, false);
            }
          });
        }
      }.bind(this);

      this.currentDatabase(dbCallback);
    },

    arangoNotification: function (title, content, info) {
      window.App.notificationList.add({title: title, content: content, info: info, type: 'success'});
    },

    arangoError: function (title, content, info) {
      if (!$('#offlinePlaceholder').is(':visible')) {
        window.App.notificationList.add({title: title, content: content, info: info, type: 'error'});
      }
    },

    arangoWarning: function (title, content, info) {
      window.App.notificationList.add({title: title, content: content, info: info, type: 'warning'});
    },

    arangoMessage: function (title, content, info) {
      window.App.notificationList.add({title: title, content: content, info: info, type: 'message'});
    },

    hideArangoNotifications: function () {
      $.noty.clearQueue();
      $.noty.closeAll();
    },

    openDocEditor: function (id, type, callback) {
      var ids = id.split('/');
      var self = this;

      var docFrameView = new window.DocumentView({
        collection: window.App.arangoDocumentStore
      });

      docFrameView.breadcrumb = function () {};

      docFrameView.colid = ids[0];
      docFrameView.docid = ids[1];

      docFrameView.el = '.arangoFrame .innerDiv';
      docFrameView.render();
      docFrameView.setType(type);

      /*
      if (docFrameView.collection.toJSON().length === 0) {
        this.closeDocEditor();
        return;
      }
      */

      // remove header
      $('.arangoFrame .headerBar').remove();
      // append close button
      $('.arangoFrame .outerDiv').prepend('<i class="fa fa-times"></i>');
      // add close events
      $('.arangoFrame .outerDiv').click(function () {
        self.closeDocEditor();
      });
      $('.arangoFrame .innerDiv').click(function (e) {
        e.stopPropagation();
      });
      $('.fa-times').click(function () {
        self.closeDocEditor();
      });

      $('.arangoFrame').show();

      docFrameView.customView = true;
      docFrameView.customDeleteFunction = function () {
        window.modalView.hide();
        $('.arangoFrame').hide();
      // callback()
      };

      $('.arangoFrame #deleteDocumentButton').click(function () {
        docFrameView.deleteDocumentModal();
      });
      $('.arangoFrame #saveDocumentButton').click(function () {
        docFrameView.saveDocument();
      });
      $('.arangoFrame #deleteDocumentButton').css('display', 'none');
    },

    closeDocEditor: function () {
      $('.arangoFrame .outerDiv .fa-times').remove();
      $('.arangoFrame').hide();
    },

    addAardvarkJob: function (object, callback) {
      $.ajax({
        cache: false,
        type: 'POST',
        url: this.databaseUrl('/_admin/aardvark/job'),
        data: JSON.stringify(object),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          if (callback) {
            callback(false, data);
          }
        },
        error: function (data) {
          if (callback) {
            callback(true, data);
          }
        }
      });
    },

    deleteAardvarkJob: function (id, callback) {
      $.ajax({
        cache: false,
        type: 'DELETE',
        url: this.databaseUrl('/_admin/aardvark/job/' + encodeURIComponent(id)),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          if (callback) {
            callback(false, data);
          }
        },
        error: function (data) {
          if (callback) {
            callback(true, data);
          }
        }
      });
    },

    deleteAllAardvarkJobs: function (callback) {
      $.ajax({
        cache: false,
        type: 'DELETE',
        url: this.databaseUrl('/_admin/aardvark/job'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          if (callback) {
            callback(false, data);
          }
        },
        error: function (data) {
          if (callback) {
            callback(true, data);
          }
        }
      });
    },

    getAardvarkJobs: function (callback) {
      $.ajax({
        cache: false,
        type: 'GET',
        url: this.databaseUrl('/_admin/aardvark/job'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          if (callback) {
            callback(false, data);
          }
        },
        error: function (data) {
          if (callback) {
            callback(true, data);
          }
        }
      });
    },

    getPendingJobs: function (callback) {
      $.ajax({
        cache: false,
        type: 'GET',
        url: this.databaseUrl('/_api/job/pending'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(false, data);
        },
        error: function (data) {
          callback(true, data);
        }
      });
    },

    syncAndReturnUninishedAardvarkJobs: function (type, callback) {
      var callbackInner = function (error, AaJobs) {
        if (error) {
          callback(true);
        } else {
          var callbackInner2 = function (error, pendingJobs) {
            if (error) {
              arangoHelper.arangoError('', '');
            } else {
              var array = [];
              if (pendingJobs.length > 0) {
                _.each(AaJobs, function (aardvark) {
                  if (aardvark.type === type || aardvark.type === undefined) {
                    var found = false;
                    _.each(pendingJobs, function (pending) {
                      if (aardvark.id === pending) {
                        found = true;
                      }
                    });

                    if (found) {
                      array.push({
                        collection: aardvark.collection,
                        id: aardvark.id,
                        type: aardvark.type,
                        desc: aardvark.desc
                      });
                    } else {
                      window.arangoHelper.deleteAardvarkJob(aardvark.id);
                    }
                  }
                });
              } else {
                if (AaJobs.length > 0) {
                  this.deleteAllAardvarkJobs();
                }
              }
              callback(false, array);
            }
          }.bind(this);

          this.getPendingJobs(callbackInner2);
        }
      }.bind(this);

      this.getAardvarkJobs(callbackInner);
    },

    getRandomToken: function () {
      return Math.round(new Date().getTime());
    },

    isSystemAttribute: function (val) {
      var a = this.systemAttributes();
      return a[val];
    },

    isSystemCollection: function (val) {
      return val.name.substr(0, 1) === '_';
    },

    setDocumentStore: function (a) {
      this.arangoDocumentStore = a;
    },

    collectionApiType: function (identifier, refresh, toRun) {
      // set "refresh" to disable caching collection type
      if (refresh || this.CollectionTypes[identifier] === undefined) {
        var callback = function (error, data, toRun) {
          if (error) {
            arangoHelper.arangoError('Error', 'Could not detect collection type');
          } else {
            this.CollectionTypes[identifier] = data.type;
            if (this.CollectionTypes[identifier] === 3) {
              toRun(false, 'edge');
            } else {
              toRun(false, 'document');
            }
          }
        }.bind(this);
        this.arangoDocumentStore.getCollectionInfo(identifier, callback, toRun);
      } else {
        toRun(false, this.CollectionTypes[identifier]);
      }
    },

    collectionType: function (val) {
      if (!val || val.name === '') {
        return '-';
      }
      var type;
      if (val.type === 2) {
        type = 'document';
      } else if (val.type === 3) {
        type = 'edge';
      } else {
        type = 'unknown';
      }

      if (this.isSystemCollection(val)) {
        type += ' (system)';
      }

      return type;
    },

    formatDT: function (dt) {
      var pad = function (n) {
        return n < 10 ? '0' + n : n;
      };

      return dt.getUTCFullYear() + '-' +
        pad(dt.getUTCMonth() + 1) + '-' +
        pad(dt.getUTCDate()) + ' ' +
        pad(dt.getUTCHours()) + ':' +
        pad(dt.getUTCMinutes()) + ':' +
        pad(dt.getUTCSeconds());
    },

    escapeHtml: function (val) {
      // HTML-escape a string
      return String(val).replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    backendUrl: function (url) {
      return frontendConfig.basePath + url;
    },

    databaseUrl: function (url, databaseName) {
      if (url.substr(0, 5) === '/_db/') {
        throw new Error('Calling databaseUrl with a databased url (' + url + ") doesn't make any sense");
      }

      if (!databaseName) {
        databaseName = '_system';
        if (frontendConfig.db) {
          databaseName = frontendConfig.db;
        }
      }
      return this.backendUrl('/_db/' + encodeURIComponent(databaseName) + url);
    },

    showAuthDialog: function () {
      var toShow = true;
      var show = localStorage.getItem('authenticationNotification');

      if (show === 'false') {
        toShow = false;
      }

      return toShow;
    },

    doNotShowAgain: function () {
      localStorage.setItem('authenticationNotification', false);
    },

    renderEmpty: function (string, iconClass) {
      if (!iconClass) {
        $('#content').html(
          '<div class="noContent"><p>' + string + '</p></div>'
        );
      } else {
        $('#content').html(
          '<div class="noContent"><p>' + string + '<i class="' + iconClass + '"></i></p></div>'
        );
      }
    },

    initSigma: function () {
      // init sigma
      try {
        sigma.classes.graph.addMethod('neighbors', function (nodeId) {
          var k;
          var neighbors = {};
          var index = this.allNeighborsIndex[nodeId] || {};

          for (k in index) {
            neighbors[k] = this.nodesIndex[k];
          }
          return neighbors;
        });

        sigma.classes.graph.addMethod('getNodeEdges', function (nodeId) {
          var edges = this.edges();
          var edgesToReturn = [];

          _.each(edges, function (edge) {
            if (edge.source === nodeId || edge.target === nodeId) {
              edgesToReturn.push(edge.id);
            }
          });
          return edgesToReturn;
        });

        sigma.classes.graph.addMethod('getNodeEdgesCount', function (id) {
          return this.allNeighborsCount[id];
        });

        sigma.classes.graph.addMethod('getNodesCount', function () {
          return this.nodesArray.length;
        });
      } catch (ignore) {}
    },

    download: function (url, callback) {
      $.ajax(url)
        .success(function (result, dummy, request) {
          if (callback) {
            callback(result);
            return;
          }

          var blob = new Blob([JSON.stringify(result)], {type: request.getResponseHeader('Content-Type') || 'application/octet-stream'});
          var blobUrl = window.URL.createObjectURL(blob);
          var a = document.createElement('a');
          document.body.appendChild(a);
          a.style = 'display: none';
          a.href = blobUrl;
          a.download = request.getResponseHeader('Content-Disposition').replace(/.* filename="([^")]*)"/, '$1');
          a.click();

          window.setTimeout(function () {
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
          }, 500);
        });
    }
  };
}());

/* jshint unused: false */
/* global  window, _, $ */
(function () {
  'use strict';
  // For tests the templates are loaded some where else.
  // We need to use a different engine there.
  if (!window.hasOwnProperty('TEST_BUILD')) {
    var TemplateEngine = function () {
      var exports = {};
      exports.createTemplate = function (id) {
        var template = $('#' + id.replace('.', '\\.')).html();
        return {
          render: function (params) {
            var tmp = _.template(template);
            tmp = tmp(params);

            return tmp;
          }
        };
      };
      return exports;
    };
    window.templateEngine = new TemplateEngine();
  }
}());

/*global _, Dygraph, window, document */

(function () {
  "use strict";
  window.dygraphConfig = {
    defaultFrame : 20 * 60 * 1000,

    zeropad: function (x) {
      if (x < 10) {
        return "0" + x;
      }
      return x;
    },

    xAxisFormat: function (d) {
      if (d === -1) {
        return "";
      }
      var date = new Date(d);
      return this.zeropad(date.getHours()) + ":"
        + this.zeropad(date.getMinutes()) + ":"
        + this.zeropad(date.getSeconds());
    },

    mergeObjects: function (o1, o2, mergeAttribList) {
      if (!mergeAttribList) {
        mergeAttribList = [];
      }
      var vals = {}, res;
      mergeAttribList.forEach(function (a) {
        var valO1 = o1[a],
        valO2 = o2[a];
        if (valO1 === undefined) {
          valO1 = {};
        }
        if (valO2 === undefined) {
          valO2 = {};
        }
        vals[a] = _.extend(valO1, valO2);
      });
      res = _.extend(o1, o2);
      Object.keys(vals).forEach(function (k) {
        res[k] = vals[k];
      });
      return res;
    },

    mapStatToFigure : {
      pageFaults : ["times", "majorPageFaultsPerSecond", "minorPageFaultsPerSecond"],
      systemUserTime : ["times", "systemTimePerSecond", "userTimePerSecond"],
      totalTime : ["times", "avgQueueTime", "avgRequestTime", "avgIoTime"],
      dataTransfer : ["times", "bytesSentPerSecond", "bytesReceivedPerSecond"],
      requests : ["times", "getsPerSecond", "putsPerSecond", "postsPerSecond",
                  "deletesPerSecond", "patchesPerSecond", "headsPerSecond",
                  "optionsPerSecond", "othersPerSecond"]
    },

    //colors for dygraphs
    colors: ["rgb(95, 194, 135)", "rgb(238, 190, 77)", "#81ccd8", "#7ca530", "#3c3c3c",
             "#aa90bd", "#e1811d", "#c7d4b2", "#d0b2d4"],


    // figure dependend options
    figureDependedOptions: {
      clusterRequestsPerSecond: {
        showLabelsOnHighlight: true,
        title: '',
        header : "Cluster Requests per Second",
        stackedGraph: true,
        div: "lineGraphLegend",
        labelsKMG2: false,
        axes: {
          y: {
            valueFormatter: function (y) {
              return parseFloat(y.toPrecision(3));
            },
            axisLabelFormatter: function (y) {
              if (y === 0) {
                return 0;
              }

              return parseFloat(y.toPrecision(3));
            }
          }
        }
      },

      pageFaults: {
        header : "Page Faults",
        visibility: [true, false],
        labels: ["datetime", "Major Page", "Minor Page"],
        div: "pageFaultsChart",
        labelsKMG2: false,
        axes: {
          y: {
            valueFormatter: function (y) {
              return parseFloat(y.toPrecision(3));
            },
            axisLabelFormatter: function (y) {
              if (y === 0) {
                return 0;
              }
              return parseFloat(y.toPrecision(3));
            }
          }
        }
      },

      systemUserTime: {
        div: "systemUserTimeChart",
        header: "System and User Time",
        labels: ["datetime", "System Time", "User Time"],
        stackedGraph: true,
        labelsKMG2: false,
        axes: {
          y: {
            valueFormatter: function (y) {
              return parseFloat(y.toPrecision(3));
            },
            axisLabelFormatter: function (y) {
              if (y === 0) {
                return 0;
              }
              return parseFloat(y.toPrecision(3));
            }
          }
        }
      },

      totalTime: {
        div: "totalTimeChart",
        header: "Total Time",
        labels: ["datetime", "Queue", "Computation", "I/O"],
        labelsKMG2: false,
        axes: {
          y: {
            valueFormatter: function (y) {
              return parseFloat(y.toPrecision(3));
            },
            axisLabelFormatter: function (y) {
              if (y === 0) {
                return 0;
              }
              return parseFloat(y.toPrecision(3));
            }
          }
        },
        stackedGraph: true
      },

      dataTransfer: {
        header: "Data Transfer",
        labels: ["datetime", "Bytes sent", "Bytes received"],
        stackedGraph: true,
        div: "dataTransferChart"
      },

      requests: {
        header: "Requests",
        labels: ["datetime", "Reads", "Writes"],
        stackedGraph: true,
        div: "requestsChart",
        axes: {
          y: {
            valueFormatter: function (y) {
              return parseFloat(y.toPrecision(3));
            },
            axisLabelFormatter: function (y) {
              if (y === 0) {
                return 0;
              }
              return parseFloat(y.toPrecision(3));
            }
          }
        }
      }
    },

    getDashBoardFigures : function (all) {
      var result = [], self = this;
      Object.keys(this.figureDependedOptions).forEach(function (k) {
        // ClusterRequestsPerSecond should not be ignored. Quick Fix
        if (k !== "clusterRequestsPerSecond" && (self.figureDependedOptions[k].div || all)) {
          result.push(k);
        }
      });
      return result;
    },

    //configuration for chart overview
    getDefaultConfig: function (figure) {
      var self = this;
      var result = {
        digitsAfterDecimal: 1,
        drawGapPoints: true,
        fillGraph: true,
        fillAlpha: 0.85,
        showLabelsOnHighlight: false,
        strokeWidth: 0.0,
        lineWidth: 0.0,
        strokeBorderWidth: 0.0,
        includeZero: true,
        highlightCircleSize: 2.5,
        labelsSeparateLines : true,
        strokeBorderColor: 'rgba(0,0,0,0)',
        interactionModel: {},
        maxNumberWidth : 10,
        colors: [this.colors[0]],
        xAxisLabelWidth: "50",
        rightGap: 15,
        showRangeSelector: false,
        rangeSelectorHeight: 50,
        rangeSelectorPlotStrokeColor: '#365300',
        rangeSelectorPlotFillColor: '',
        // rangeSelectorPlotFillColor: '#414a4c',
        pixelsPerLabel: 50,
        labelsKMG2: true,
        dateWindow: [
          new Date().getTime() -
            this.defaultFrame,
          new Date().getTime()
        ],
        axes: {
          x: {
            valueFormatter: function (d) {
              return self.xAxisFormat(d);
            }
          },
          y: {
            ticker: Dygraph.numericLinearTicks
          }
        }
      };
      if (this.figureDependedOptions[figure]) {
        result = this.mergeObjects(
          result, this.figureDependedOptions[figure], ["axes"]
        );
        if (result.div && result.labels) {
          result.colors = this.getColors(result.labels);
          result.labelsDiv = document.getElementById(result.div + "Legend");
          result.legend = "always";
          result.showLabelsOnHighlight = true;
        }
      }
      return result;

    },

    getDetailChartConfig: function (figure) {
      var result = _.extend(
        this.getDefaultConfig(figure),
        {
          showRangeSelector: true,
          interactionModel: null,
          showLabelsOnHighlight: true,
          highlightCircleSize: 2.5,
          legend: "always",
          labelsDiv: "div#detailLegend.dashboard-legend-inner"
        }
      );
      if (figure === "pageFaults") {
        result.visibility = [true, true];
      }
      if (!result.labels) {
        result.labels = ["datetime", result.header];
        result.colors = this.getColors(result.labels);
      }
      return result;
    },

    getColors: function (labels) {
      var colorList;
      colorList = this.colors.concat([]);
      return colorList.slice(0, labels.length - 1);
    }
  };
}());

/* global window, Backbone, $, arangoHelper */
(function () {
  'use strict';
  window.arangoCollectionModel = Backbone.Model.extend({
    idAttribute: 'name',

    urlRoot: arangoHelper.databaseUrl('/_api/collection'),
    defaults: {
      id: '',
      name: '',
      status: '',
      type: '',
      isSystem: false,
      picture: '',
      locked: false,
      desc: undefined
    },

    getProperties: function (callback) {
      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_api/collection/' + encodeURIComponent(this.get('id')) + '/properties'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(false, data);
        },
        error: function (data) {
          callback(true, data);
        }
      });
    },
    getFigures: function (callback) {
      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_api/collection/' + this.get('id') + '/figures'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(false, data);
        },
        error: function () {
          callback(true);
        }
      });
    },
    getRevision: function (callback, figures) {
      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_api/collection/' + this.get('id') + '/revision'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(false, data, figures);
        },
        error: function () {
          callback(true);
        }
      });
    },

    getIndex: function (callback) {
      var self = this;

      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_api/index/?collection=' + this.get('id')),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(false, data, self.get('id'));
        },
        error: function (data) {
          callback(true, data, self.get('id'));
        }
      });
    },

    createIndex: function (postParameter, callback) {
      var self = this;

      $.ajax({
        cache: false,
        type: 'POST',
        url: arangoHelper.databaseUrl('/_api/index?collection=' + self.get('id')),
        headers: {
          'x-arango-async': 'store'
        },
        data: JSON.stringify(postParameter),
        contentType: 'application/json',
        processData: false,
        success: function (data, textStatus, xhr) {
          if (xhr.getResponseHeader('x-arango-async-id')) {
            window.arangoHelper.addAardvarkJob({
              id: xhr.getResponseHeader('x-arango-async-id'),
              type: 'index',
              desc: 'Creating Index',
              collection: self.get('id')
            });
            callback(false, data);
          } else {
            callback(true, data);
          }
        },
        error: function (data) {
          callback(true, data);
        }
      });
    },

    deleteIndex: function (id, callback) {
      var self = this;

      $.ajax({
        cache: false,
        type: 'DELETE',
        url: arangoHelper.databaseUrl('/_api/index/' + this.get('name') + '/' + encodeURIComponent(id)),
        headers: {
          'x-arango-async': 'store'
        },
        success: function (data, textStatus, xhr) {
          if (xhr.getResponseHeader('x-arango-async-id')) {
            window.arangoHelper.addAardvarkJob({
              id: xhr.getResponseHeader('x-arango-async-id'),
              type: 'index',
              desc: 'Removing Index',
              collection: self.get('id')
            });
            callback(false, data);
          } else {
            callback(true, data);
          }
        },
        error: function (data) {
          callback(true, data);
        }
      });
      callback();
    },

    truncateCollection: function () {
      $.ajax({
        cache: false,
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_api/collection/' + this.get('id') + '/truncate'),
        success: function () {
          arangoHelper.arangoNotification('Collection truncated.');
        },
        error: function () {
          arangoHelper.arangoError('Collection error.');
        }
      });
    },

    loadCollection: function (callback) {
      $.ajax({
        cache: false,
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_api/collection/' + this.get('id') + '/load'),
        success: function () {
          callback(false);
        },
        error: function () {
          callback(true);
        }
      });
      callback();
    },

    unloadCollection: function (callback) {
      $.ajax({
        cache: false,
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_api/collection/' + this.get('id') + '/unload?flush=true'),
        success: function () {
          callback(false);
        },
        error: function () {
          callback(true);
        }
      });
      callback();
    },

    renameCollection: function (name, callback) {
      var self = this;

      $.ajax({
        cache: false,
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_api/collection/' + this.get('id') + '/rename'),
        data: JSON.stringify({ name: name }),
        contentType: 'application/json',
        processData: false,
        success: function () {
          self.set('name', name);
          callback(false);
        },
        error: function (data) {
          callback(true, data);
        }
      });
    },

    changeCollection: function (wfs, journalSize, indexBuckets, callback) {
      var result = false;
      if (wfs === 'true') {
        wfs = true;
      } else if (wfs === 'false') {
        wfs = false;
      }
      var data = {
        waitForSync: wfs,
        journalSize: parseInt(journalSize, 10),
        indexBuckets: parseInt(indexBuckets, 10)
      };

      $.ajax({
        cache: false,
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_api/collection/' + this.get('id') + '/properties'),
        data: JSON.stringify(data),
        contentType: 'application/json',
        processData: false,
        success: function () {
          callback(false);
        },
        error: function (data) {
          callback(false, data);
        }
      });
      return result;
    }

  });
}());

/* global window, Backbone, arangoHelper */

window.DatabaseModel = Backbone.Model.extend({
  idAttribute: 'name',

  initialize: function () {
    'use strict';
  },

  isNew: function () {
    'use strict';
    return false;
  },
  sync: function (method, model, options) {
    'use strict';
    if (method === 'update') {
      method = 'create';
    }
    return Backbone.sync(method, model, options);
  },

  url: arangoHelper.databaseUrl('/_api/database'),

  defaults: {
  }

});

/* global window, Backbone, arangoHelper, _ */

window.arangoDocumentModel = Backbone.Model.extend({
  initialize: function () {
    'use strict';
  },
  urlRoot: arangoHelper.databaseUrl('/_api/document'),
  defaults: {
    _id: '',
    _rev: '',
    _key: ''
  },
  getSorted: function () {
    'use strict';
    var self = this;
    var keys = Object.keys(self.attributes).sort(function (l, r) {
      var l1 = arangoHelper.isSystemAttribute(l);
      var r1 = arangoHelper.isSystemAttribute(r);

      if (l1 !== r1) {
        if (l1) {
          return -1;
        }
        return 1;
      }

      return l < r ? -1 : 1;
    });

    var sorted = {};
    _.each(keys, function (k) {
      sorted[k] = self.attributes[k];
    });
    return sorted;
  }
});

/* global window, Backbone, arangoHelper */
(function () {
  'use strict';
  window.ArangoQuery = Backbone.Model.extend({
    urlRoot: arangoHelper.databaseUrl('/_api/user'),

    defaults: {
      name: '',
      type: 'custom',
      value: ''
    }

  });
}());

/* global Backbone, window */

window.Replication = Backbone.Model.extend({
  defaults: {
    state: {},
    server: {}
  },

  initialize: function () {}

});

// obsolete file

/* global window, Backbone */

window.Statistics = Backbone.Model.extend({
  defaults: {
  },

  url: function () {
    'use strict';
    return '/_admin/statistics';
  }
});

/* global window, Backbone */

window.StatisticsDescription = Backbone.Model.extend({
  defaults: {
    'figures': '',
    'groups': ''
  },
  url: function () {
    'use strict';

    return '/_admin/statistics-description';
  }

});

/* jshint strict: false */
/* global Backbone, $, window, arangoHelper */
window.Users = Backbone.Model.extend({
  defaults: {
    user: '',
    active: false,
    extra: {}
  },

  idAttribute: 'user',

  parse: function (d) {
    this.isNotNew = true;
    return d;
  },

  isNew: function () {
    return !this.isNotNew;
  },

  url: function () {
    if (this.isNew()) {
      return arangoHelper.databaseUrl('/_api/user');
    }
    if (this.get('user') !== '') {
      return arangoHelper.databaseUrl('/_api/user/' + this.get('user'));
    }
    return arangoHelper.databaseUrl('/_api/user');
  },

  checkPassword: function (passwd, callback) {
    $.ajax({
      cache: false,
      type: 'POST',
      url: arangoHelper.databaseUrl('/_api/user/' + this.get('user')),
      data: JSON.stringify({ passwd: passwd }),
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        callback(false, data);
      },
      error: function (data) {
        callback(true, data);
      }
    });
  },

  setPassword: function (passwd) {
    $.ajax({
      cache: false,
      type: 'PATCH',
      url: arangoHelper.databaseUrl('/_api/user/' + this.get('user')),
      data: JSON.stringify({ passwd: passwd }),
      contentType: 'application/json',
      processData: false
    });
  },

  setExtras: function (name, img, callback) {
    $.ajax({
      cache: false,
      type: 'PATCH',
      url: arangoHelper.databaseUrl('/_api/user/' + this.get('user')),
      data: JSON.stringify({'extra': {'name': name, 'img': img}}),
      contentType: 'application/json',
      processData: false,
      success: function () {
        callback(false);
      },
      error: function () {
        callback(true);
      }
    });
  }

});

/* global window, Backbone */
(function () {
  'use strict';

  window.ClusterCoordinator = Backbone.Model.extend({
    defaults: {
      'name': '',
      'status': 'ok',
      'address': '',
      'protocol': ''
    },

    idAttribute: 'name',
    /*
    url: "/_admin/aardvark/cluster/Coordinators"

    updateUrl: function() {
      this.url = window.getNewRoute("Coordinators")
    },
    */
    forList: function () {
      return {
        name: this.get('name'),
        status: this.get('status'),
        url: this.get('url')
      };
    }

  });
}());

/* global window, Backbone */
(function () {
  'use strict';

  window.ClusterServer = Backbone.Model.extend({
    defaults: {
      name: '',
      address: '',
      role: '',
      status: 'ok'
    },

    idAttribute: 'name',
    /*
    url: "/_admin/aardvark/cluster/DBServers"

    updateUrl: function() {
      this.url = window.getNewRoute("DBServers")
    },
    */
    forList: function () {
      return {
        name: this.get('name'),
        address: this.get('address'),
        status: this.get('status')
      };
    }

  });
}());

/* global window, Backbone */
(function () {
  'use strict';

  window.Coordinator = Backbone.Model.extend({
    defaults: {
      address: '',
      protocol: '',
      name: '',
      status: ''
    }

  });
}());

/* global Backbone, window, arangoHelper, frontendConfig */

(function () {
  'use strict';

  window.CurrentDatabase = Backbone.Model.extend({
    url: arangoHelper.databaseUrl('/_api/database/current', frontendConfig.db),

    parse: function (data) {
      return data.result;
    }
  });
}());

/* jshint browser: true */
/* eslint-env browser */
/* global Backbone, $, _, arangoHelper, window */
(function () {
  'use strict';

  var sendRequest = function (foxx, callback, method, part, body, args) {
    var req = {
      contentType: 'application/json',
      processData: false,
      type: method
    };
    callback = callback || function () {};
    args = _.extend({mount: foxx.encodedMount()}, args);
    var qs = _.reduce(args, function (base, value, key) {
      return base + encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
    }, '?');
    req.url = arangoHelper.databaseUrl('/_admin/aardvark/foxxes' + (part ? '/' + part : '') + qs.slice(0, qs.length - 1));
    if (body !== undefined) {
      req.data = JSON.stringify(body);
    }
    $.ajax(req).then(
      function (data) {
        callback(null, data);
      },
      function (xhr) {
        window.xhr = xhr;
        callback(_.extend(
          xhr.status
            ? new Error(xhr.responseJSON ? xhr.responseJSON.errorMessage : xhr.responseText)
            : new Error('Network Error'),
          {statusCode: xhr.status}
        ));
      }
    );
  };

  window.Foxx = Backbone.Model.extend({
    idAttribute: 'mount',

    defaults: {
      'author': 'Unknown Author',
      'name': '',
      'version': 'Unknown Version',
      'description': 'No description',
      'license': 'Unknown License',
      'contributors': [],
      'scripts': {},
      'config': {},
      'deps': {},
      'git': '',
      'system': false,
      'development': false
    },

    isNew: function () {
      return false;
    },

    encodedMount: function () {
      return encodeURIComponent(this.get('mount'));
    },

    destroy: function (options, callback) {
      sendRequest(this, callback, 'DELETE', undefined, undefined, options);
    },

    isBroken: function () {
      return false;
    },

    needsAttention: function () {
      return this.isBroken() || this.needsConfiguration() || this.hasUnconfiguredDependencies();
    },

    needsConfiguration: function () {
      return _.any(this.get('config'), function (cfg) {
        return cfg.current === undefined && cfg.required !== false;
      });
    },

    hasUnconfiguredDependencies: function () {
      return _.any(this.get('deps'), function (dep) {
        return dep.current === undefined && dep.definition.required !== false;
      });
    },

    getConfiguration: function (callback) {
      sendRequest(this, function (err, data) {
        if (!err) {
          this.set('config', data);
        }
        if (typeof callback === 'function') {
          callback(err, data);
        }
      }.bind(this), 'GET', 'config');
    },

    setConfiguration: function (data, callback) {
      sendRequest(this, callback, 'PATCH', 'config', data);
    },

    getDependencies: function (callback) {
      sendRequest(this, function (err, data) {
        if (!err) {
          this.set('deps', data);
        }
        if (typeof callback === 'function') {
          callback(err, data);
        }
      }.bind(this), 'GET', 'deps');
    },

    setDependencies: function (data, callback) {
      sendRequest(this, callback, 'PATCH', 'deps', data);
    },

    toggleDevelopment: function (activate, callback) {
      sendRequest(this, function (err, data) {
        if (!err) {
          this.set('development', activate);
        }
        if (typeof callback === 'function') {
          callback(err, data);
        }
      }.bind(this), 'PATCH', 'devel', activate);
    },

    runScript: function (name, options, callback) {
      sendRequest(this, callback, 'POST', 'scripts/' + name, options);
    },

    runTests: function (options, callback) {
      sendRequest(this, function (err, data) {
        if (typeof callback === 'function') {
          callback(err ? err.responseJSON : err, data);
        }
      }, 'POST', 'tests', options);
    },

    isSystem: function () {
      return this.get('system');
    },

    isDevelopment: function () {
      return this.get('development');
    },

    download: function () {
      sendRequest(this, function (err, data) {
        if (err) {
          console.error(err.responseJSON);
          return;
        }
        window.location.href = arangoHelper.databaseUrl('/_admin/aardvark/foxxes/download/zip?mount=' + this.encodedMount() + '&nonce=' + data.nonce);
      }.bind(this), 'POST', 'download/nonce');
    },

    fetchThumbnail: function (cb) {
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = function () {
        this.thumbnailUrl = URL.createObjectURL(xhr.response);
        cb();
      }.bind(this);
      xhr.onerror = cb;
      xhr.open('GET', 'foxxes/thumbnail?mount=' + this.encodedMount());
      if (window.arangoHelper.getCurrentJwt()) {
        xhr.setRequestHeader('Authorization', 'bearer ' + window.arangoHelper.getCurrentJwt());
      }
      xhr.send();
    }
  });
}());

/* global window, Backbone, $, arangoHelper */
(function () {
  'use strict';

  window.Graph = Backbone.Model.extend({
    idAttribute: '_key',

    urlRoot: arangoHelper.databaseUrl('/_api/gharial'),

    isNew: function () {
      return !this.get('_id');
    },

    parse: function (raw) {
      return raw.graph || raw;
    },

    addEdgeDefinition: function (edgeDefinition) {
      $.ajax(
        {
          async: false,
          type: 'POST',
          url: this.urlRoot + '/' + this.get('_key') + '/edge',
          data: JSON.stringify(edgeDefinition),
          error: function (err) {
            arangoHelper.arangoError(err.responseJSON.errorMessage);
          }
        }
      );
    },

    deleteEdgeDefinition: function (edgeCollection) {
      $.ajax(
        {
          async: false,
          type: 'DELETE',
          url: this.urlRoot + '/' + this.get('_key') + '/edge/' + edgeCollection,
          error: function (err) {
            arangoHelper.arangoError(err.responseJSON.errorMessage);
          }
        }
      );
    },

    modifyEdgeDefinition: function (edgeDefinition) {
      $.ajax(
        {
          async: false,
          type: 'PUT',
          url: this.urlRoot + '/' + this.get('_key') + '/edge/' + edgeDefinition.collection,
          data: JSON.stringify(edgeDefinition),
          error: function (err) {
            arangoHelper.arangoError(err.responseJSON.errorMessage);
          }
        }
      );
    },

    addVertexCollection: function (vertexCollectionName) {
      $.ajax(
        {
          async: false,
          type: 'POST',
          url: this.urlRoot + '/' + this.get('_key') + '/vertex',
          data: JSON.stringify({collection: vertexCollectionName}),
          error: function (err) {
            arangoHelper.arangoError(err.responseJSON.errorMessage);
          }
        }
      );
    },

    deleteVertexCollection: function (vertexCollectionName) {
      $.ajax(
        {
          async: false,
          type: 'DELETE',
          url: this.urlRoot + '/' + this.get('_key') + '/vertex/' + vertexCollectionName,
          error: function (err) {
            arangoHelper.arangoError(err.responseJSON.errorMessage);
          }
        }
      );
    },

    defaults: {
      name: '',
      edgeDefinitions: [],
      orphanCollections: []
    }
  });
}());

/* global window, Backbone */
(function () {
  'use strict';

  window.newArangoLog = Backbone.Model.extend({
    defaults: {
      lid: '',
      level: '',
      timestamp: '',
      text: '',
      totalAmount: ''
    },

    getLogStatus: function () {
      switch (this.get('level')) {
        case 1:
          return 'Error';
        case 2:
          return 'Warning';
        case 3:
          return 'Info';
        case 4:
          return 'Debug';
        default:
          return 'Unknown';
      }
    }
  });
}());

/* global window, Backbone */
(function () {
  'use strict';

  window.Notification = Backbone.Model.extend({
    defaults: {
      'title': '',
      'date': 0,
      'content': '',
      'priority': '',
      'tags': '',
      'seen': false
    }

  });
}());

/* global window, Backbone */
(function () {
  'use strict';

  window.queryManagementModel = Backbone.Model.extend({
    defaults: {
      id: '',
      query: '',
      started: '',
      runTime: ''
    }

  });
}());

/* jshint strict: false */
/* global Backbone, window, arangoHelper, $ */
window.UserConfig = Backbone.Model.extend({
  defaults: {
    graphs: '',
    queries: []
  },

  model: window.UserConfigModel,

  parse: function (response) {
    return response.result;
  },

  url: function () {
    if (window.App.currentUser) {
      this.username = window.App.currentUser;
    } else {
      this.username = 'root';
    }

    return arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(this.username) + '/config');
  },

  setItem: function (keyName, keyValue, callback) {
    // url PUT /_api/user/<username>/config/<key>
    var self = this;

    $.ajax({
      type: 'PUT',
      cache: false,
      url: arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(this.username) + '/config/' + encodeURIComponent(keyName)),
      contentType: 'application/json',
      processData: false,
      data: JSON.stringify({value: keyValue}),
      async: true,
      success: function () {
        self.set(keyName, keyValue);

        if (callback) {
          callback();
        }
      },
      error: function () {
        arangoHelper.arangoError('User configuration', 'Could not update user configuration for key: ' + keyName);
      }
    });
  },

  getItem: function (keyName, callback) {
    // url GET /_api/user/<username>/config/<key>

    $.ajax({
      type: 'GET',
      cache: false,
      url: arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(this.username) + '/config/' + encodeURIComponent(keyName)),
      contentType: 'application/json',
      processData: false,
      async: true,
      success: function (keyValue) {
        callback(keyValue);
      },
      error: function () {
        arangoHelper.arangoError('User configuration', 'Could not fetch user configuration for key: ' + keyName);
      }
    });
  }

});

/* global window, Backbone */
(function () {
  'use strict';

  window.workMonitorModel = Backbone.Model.extend({
    defaults: {
      name: '',
      number: '',
      status: '',
      type: ''
    }

  });
}());

/* global window, Backbone */
(function () {
  'use strict';

  window.AutomaticRetryCollection = Backbone.Collection.extend({
    _retryCount: 0,

    checkRetries: function () {
      var self = this;
      this.updateUrl();
      if (this._retryCount > 10) {
        window.setTimeout(function () {
          self._retryCount = 0;
        }, 10000);
        window.App.clusterUnreachable();
        return false;
      }
      return true;
    },

    successFullTry: function () {
      this._retryCount = 0;
    },

    failureTry: function (retry, ignore, err) {
      if (err.status === 401) {
        window.App.requestAuth();
      } else {
        window.App.clusterPlan.rotateCoordinator();
        this._retryCount++;
        retry();
      }
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, window */
(function () {
  'use strict';

  window.PaginatedCollection = Backbone.Collection.extend({
    page: 0,
    pagesize: 10,
    totalAmount: 0,

    getPage: function () {
      return this.page + 1;
    },

    setPage: function (counter) {
      if (counter >= this.getLastPageNumber()) {
        this.page = this.getLastPageNumber() - 1;
        return;
      }
      if (counter < 1) {
        this.page = 0;
        return;
      }
      this.page = counter - 1;
    },

    getLastPageNumber: function () {
      return Math.max(Math.ceil(this.totalAmount / this.pagesize), 1);
    },

    getOffset: function () {
      return this.page * this.pagesize;
    },

    getPageSize: function () {
      return this.pagesize;
    },

    setPageSize: function (newPagesize) {
      if (newPagesize === 'all') {
        this.pagesize = 'all';
      } else {
        try {
          newPagesize = parseInt(newPagesize, 10);
          this.pagesize = newPagesize;
        } catch (ignore) {}
      }
    },

    setToFirst: function () {
      this.page = 0;
    },

    setToLast: function () {
      this.setPage(this.getLastPageNumber());
    },

    setToPrev: function () {
      this.setPage(this.getPage() - 1);
    },

    setToNext: function () {
      this.setPage(this.getPage() + 1);
    },

    setTotal: function (total) {
      this.totalAmount = total;
    },

    getTotal: function () {
      return this.totalAmount;
    },

    setTotalMinusOne: function () {
      this.totalAmount--;
    }

  });
}());

/* global Backbone, window */
/* jshint strict: false */

window.ClusterStatisticsCollection = Backbone.Collection.extend({
  model: window.Statistics,

  url: '/_admin/statistics',

  updateUrl: function () {
    this.url = window.App.getNewRoute(this.host) + this.url;
  },

  initialize: function (models, options) {
    this.host = options.host;
    window.App.registerForUpdate(this);
  }

// The callback has to be invokeable for each result individually
// TODO RE-ADD Auth
/* fetch: function(callback, errCB) {
  this.forEach(function (m) {
    m.fetch({
      beforeSend: window.App.addAuth.bind(window.App),
      error: function() {
        errCB(m)
      }
    }).done(function() {
      callback(m)
    })
  })
} */
});

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, window, arangoCollectionModel, $, arangoHelper, _ */
(function () {
  'use strict';

  window.ArangoCollections = Backbone.Collection.extend({
    url: arangoHelper.databaseUrl('/_api/collection'),

    model: arangoCollectionModel,

    searchOptions: {
      searchPhrase: null,
      includeSystem: false,
      includeDocument: true,
      includeEdge: true,
      includeLoaded: true,
      includeUnloaded: true,
      sortBy: 'name',
      sortOrder: 1
    },

    translateStatus: function (status) {
      switch (status) {
        case 0:
          return 'corrupted';
        case 1:
          return 'new born collection';
        case 2:
          return 'unloaded';
        case 3:
          return 'loaded';
        case 4:
          return 'unloading';
        case 5:
          return 'deleted';
        case 6:
          return 'loading';
        default:
          return;
      }
    },

    translateTypePicture: function (type) {
      var returnString = '';
      switch (type) {
        case 'document':
          returnString += 'fa-file-text-o';
          break;
        case 'edge':
          returnString += 'fa-share-alt';
          break;
        case 'unknown':
          returnString += 'fa-question';
          break;
        default:
          returnString += 'fa-cogs';
      }
      return returnString;
    },

    parse: function (response) {
      var self = this;
      _.each(response.result, function (val) {
        val.isSystem = arangoHelper.isSystemCollection(val);
        val.type = arangoHelper.collectionType(val);
        val.status = self.translateStatus(val.status);
        val.picture = self.translateTypePicture(val.type);
      });
      return response.result;
    },

    getPosition: function (name) {
      var list = this.getFiltered(this.searchOptions); var i;
      var prev = null;
      var next = null;

      for (i = 0; i < list.length; ++i) {
        if (list[i].get('name') === name) {
          if (i > 0) {
            prev = list[i - 1];
          }
          if (i < list.length - 1) {
            next = list[i + 1];
          }
        }
      }

      return { prev: prev, next: next };
    },

    getFiltered: function (options) {
      var result = [];
      var searchPhrases = [];

      if (options.searchPhrase !== null) {
        var searchPhrase = options.searchPhrase.toLowerCase();
        // kick out whitespace
        searchPhrase = searchPhrase.replace(/\s+/g, ' ').replace(/(^\s+|\s+$)/g, '');
        searchPhrases = searchPhrase.split(' ');
      }

      this.models.forEach(function (model) {
        // search for name(s) entered
        if (searchPhrases.length > 0) {
          var lowerName = model.get('name').toLowerCase(); var i;
          // all phrases must match!
          for (i = 0; i < searchPhrases.length; ++i) {
            if (lowerName.indexOf(searchPhrases[i]) === -1) {
              // search phrase entered but current collection does not match?
              return;
            }
          }
        }

        if (options.includeSystem === false && model.get('isSystem')) {
          // system collection?
          return;
        }
        if (options.includeEdge === false && model.get('type') === 'edge') {
          return;
        }
        if (options.includeDocument === false && model.get('type') === 'document') {
          return;
        }
        if (options.includeLoaded === false && model.get('status') === 'loaded') {
          return;
        }
        if (options.includeUnloaded === false && model.get('status') === 'unloaded') {
          return;
        }

        result.push(model);
      });

      result.sort(function (l, r) {
        var lValue, rValue;
        if (options.sortBy === 'type') {
          // we'll use first type, then name as the sort criteria
          // this is because when sorting by type, we need a 2nd criterion (type is not unique)
          lValue = l.get('type') + ' ' + l.get('name').toLowerCase();
          rValue = r.get('type') + ' ' + r.get('name').toLowerCase();
        } else {
          lValue = l.get('name').toLowerCase();
          rValue = r.get('name').toLowerCase();
        }
        if (lValue !== rValue) {
          return options.sortOrder * (lValue < rValue ? -1 : 1);
        }
        return 0;
      });

      return result;
    },

    newCollection: function (object, callback) {
      var data = {};
      data.name = object.collName;
      data.waitForSync = object.wfs;
      if (object.journalSize > 0) {
        data.journalSize = object.journalSize;
      }
      data.isSystem = object.isSystem;
      data.type = parseInt(object.collType, 10);
      if (object.shards) {
        data.numberOfShards = object.shards;
        data.shardKeys = object.shardBy;
      }
      if (object.replicationFactor) {
        data.replicationFactor = JSON.parse(object.replicationFactor);
      }

      $.ajax({
        cache: false,
        type: 'POST',
        url: arangoHelper.databaseUrl('/_api/collection'),
        data: JSON.stringify(data),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(false, data);
        },
        error: function (data) {
          callback(true, data);
        }
      });
    }
  });
}());

/* jshint browser: true */
/* global window, arangoHelper, Backbone, $, window, _ */

(function () {
  'use strict';
  window.ArangoDatabase = Backbone.Collection.extend({
    model: window.DatabaseModel,

    sortOptions: {
      desc: false
    },

    url: arangoHelper.databaseUrl('/_api/database'),

    comparator: function (item, item2) {
      var a = item.get('name').toLowerCase();
      var b = item2.get('name').toLowerCase();
      if (this.sortOptions.desc === true) {
        return a < b ? 1 : a > b ? -1 : 0;
      }
      return a > b ? 1 : a < b ? -1 : 0;
    },

    parse: function (response) {
      if (!response) {
        return;
      }
      return _.map(response.result, function (v) {
        return {name: v};
      });
    },

    initialize: function () {
      var self = this;
      this.fetch().done(function () {
        self.sort();
      });
    },

    setSortingDesc: function (yesno) {
      this.sortOptions.desc = yesno;
    },

    getDatabases: function () {
      var self = this;
      this.fetch().done(function () {
        self.sort();
      });
      return this.models;
    },

    getDatabasesForUser: function (callback) {
      $.ajax({
        type: 'GET',
        cache: false,
        url: this.url + '/user',
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(false, (data.result).sort());
        },
        error: function () {
          callback(true, []);
        }
      });
    },

    createDatabaseURL: function (name, protocol, port) {
      var loc = window.location;
      var hash = window.location.hash;
      if (protocol) {
        if (protocol === 'SSL' || protocol === 'https:') {
          protocol = 'https:';
        } else {
          protocol = 'http:';
        }
      } else {
        protocol = loc.protocol;
      }
      port = port || loc.port;

      var url = protocol +
        '//' +
        window.location.hostname +
        ':' +
        port +
        '/_db/' +
        encodeURIComponent(name) +
        '/_admin/aardvark/standalone.html';
      if (hash) {
        var base = hash.split('/')[0];
        if (base.indexOf('#collection') === 0) {
          base = '#collections';
        }
        if (base.indexOf('#service') === 0) {
          base = '#services';
        }
        url += base;
      }
      return url;
    },

    getCurrentDatabase: function (callback) {
      $.ajax({
        type: 'GET',
        cache: false,
        url: this.url + '/current',
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          if (data.code === 200) {
            callback(false, data.result.name);
          } else {
            callback(false, data);
          }
        },
        error: function (data) {
          callback(true, data);
        }
      });
    },

    hasSystemAccess: function (callback) {
      var callback2 = function (error, list) {
        if (error) {
          arangoHelper.arangoError('DB', 'Could not fetch databases');
        } else {
          callback(false, _.includes(list, '_system'));
        }
      };

      this.getDatabasesForUser(callback2);
    }
  });
}());

/* jshint browser: true */
/* jshint strict: false, unused: false */
/* global Backbone, window, arangoDocumentModel, $, arangoHelper */

window.ArangoDocument = Backbone.Collection.extend({
  url: '/_api/document/',
  model: arangoDocumentModel,
  collectionInfo: {},

  deleteEdge: function (colid, dockey, callback) {
    this.deleteDocument(colid, dockey, callback);
  },

  deleteDocument: function (colid, dockey, callback) {
    var data = {
      keys: [dockey],
      collection: colid
    };

    $.ajax({
      cache: false,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      url: arangoHelper.databaseUrl('/_api/simple/remove-by-keys'),
      success: function () {
        callback(false);
      },
      error: function () {
        callback(true);
      }
    });
  },

  addDocument: function (collectionID, key) {
    var self = this;
    self.createTypeDocument(collectionID, key);
  },

  createTypeEdge: function (collectionID, from, to, key, callback) {
    var newEdge;

    if (key) {
      newEdge = JSON.stringify({
        _key: key,
        _from: from,
        _to: to
      });
    } else {
      newEdge = JSON.stringify({
        _from: from,
        _to: to
      });
    }

    $.ajax({
      cache: false,
      type: 'POST',
      url: arangoHelper.databaseUrl('/_api/document?collection=' + encodeURIComponent(collectionID)),
      data: newEdge,
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        callback(false, data);
      },
      error: function (data) {
        callback(true, data._id, data.responseJSON);
      }
    });
  },

  createTypeDocument: function (collectionID, key, callback, returnNew) {
    var newDocument;

    if (key) {
      newDocument = JSON.stringify({
        _key: key
      });
    } else {
      newDocument = JSON.stringify({});
    }

    var url = arangoHelper.databaseUrl('/_api/document?collection=' + encodeURIComponent(collectionID));

    if (returnNew) {
      url = url + '?returnNew=true';
    }

    $.ajax({
      cache: false,
      type: 'POST',
      url: url,
      data: newDocument,
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        if (returnNew) {
          callback(false, data);
        } else {
          callback(false, data._id);
        }
      },
      error: function (data) {
        callback(true, data._id, data.responseJSON);
      }
    });
  },

  getCollectionInfo: function (identifier, callback, toRun) {
    var self = this;

    $.ajax({
      cache: false,
      type: 'GET',
      url: arangoHelper.databaseUrl('/_api/collection/' + identifier + '?' + arangoHelper.getRandomToken()),
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        self.collectionInfo = data;
        callback(false, data, toRun);
      },
      error: function (data) {
        callback(true, data, toRun);
      }
    });
  },

  getEdge: function (colid, dockey, callback) {
    this.getDocument(colid, dockey, callback);
  },

  getDocument: function (colid, dockey, callback) {
    var self = this;
    this.clearDocument();

    var data = {
      keys: [dockey],
      collection: colid
    };

    $.ajax({
      cache: false,
      type: 'PUT',
      url: arangoHelper.databaseUrl('/_api/simple/lookup-by-keys'),
      contentType: 'application/json',
      data: JSON.stringify(data),
      processData: false,
      success: function (data) {
        self.add(data.documents[0]);
        if (data.documents[0]._from && data.documents[0]._to) {
          callback(false, data, 'edge');
        } else {
          callback(false, data, 'document');
        }
      },
      error: function (data) {
        arangoHelper.arangoError('Error', data.responseJSON.errorMessage + ' - error number: ' + data.responseJSON.errorNum);
        callback(true, data, colid + '/' + dockey);
        self.add(true, data);
      }
    });
  },

  saveEdge: function (colid, dockey, from, to, model, callback) {
    this.saveDocument(colid, dockey, model, callback, from, to);
  },

  saveDocument: function (colid, dockey, model, callback, from, to) {
    if (typeof model === 'string') {
      try {
        model = JSON.parse(model);
      } catch (e) {
        arangoHelper.arangoError('Could not parse document: ' + model);
      }
    }
    model._key = dockey;
    model._id = colid + '/' + dockey;

    if (from && to) {
      model._from = from;
      model._to = to;
    }

    $.ajax({
      cache: false,
      type: 'PUT',
      url: arangoHelper.databaseUrl('/_api/document/' + encodeURIComponent(colid)),
      data: JSON.stringify([model]),
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        callback(false, data);
      },
      error: function (data) {
        callback(true, data);
      }
    });
  },

  updateLocalDocument: function (data) {
    this.clearDocument();
    this.add(data);
  },
  clearDocument: function () {
    this.reset();
  }

});

/* jshint browser: true */
/* jshint unused: false */
/* global window, _, arangoHelper, $ */
(function () {
  'use strict';

  window.ArangoDocuments = window.PaginatedCollection.extend({
    collectionID: 1,

    filters: [],
    checkCursorTimer: undefined,

    MAX_SORT: 12000,

    lastQuery: {},
    sortAttribute: '',

    url: arangoHelper.databaseUrl('/_api/documents'),
    model: window.arangoDocumentModel,

    loadTotal: function (callback) {
      var self = this;
      $.ajax({
        cache: false,
        type: 'GET',
        url: arangoHelper.databaseUrl('/_api/collection/' + this.collectionID + '/count'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          self.setTotal(data.count);
          callback(false);
        },
        error: function () {
          callback(true);
        }
      });
    },

    setCollection: function (id) {
      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('Documents', 'Could not fetch documents count');
        }
      };
      this.resetFilter();
      this.collectionID = id;
      this.setPage(1);
      this.loadTotal(callback);
    },

    setSort: function (key) {
      this.sortAttribute = key;
    },

    getSort: function () {
      return this.sortAttribute;
    },

    addFilter: function (attr, op, val) {
      this.filters.push({
        attr: attr,
        op: op,
        val: val
      });
    },

    setFiltersForQuery: function (bindVars) {
      if (this.filters.length === 0) {
        return '';
      }
      var parts = _.map(this.filters, function (f, i) {
        var res = 'x.@attr' + i + ' ' + f.op + ' @param' + i;

        if (f.op === 'LIKE') {
          bindVars['param' + i] = '%' + f.val + '%';
        } else if (f.op === 'IN' || f.op === 'NOT IN ') {
          if (f.val.indexOf(',') !== -1) {
            bindVars['param' + i] = f.val.split(',').map(function (v) { return v.replace(/(^ +| +$)/g, ''); });
          } else {
            bindVars['param' + i] = [ f.val ];
          }
        } else {
          bindVars['param' + i] = f.val;
        }

        if (f.attr.indexOf('.') !== -1) {
          bindVars['attr' + i] = f.attr.split('.');
        } else {
          bindVars['attr' + i] = f.attr;
        }

        return res;
      });
      return ' FILTER ' + parts.join(' && ');
    },

    setPagesize: function (size) {
      this.setPageSize(size);
    },

    resetFilter: function () {
      this.filters = [];
    },

    moveDocument: function (key, fromCollection, toCollection, callback) {
      var querySave;
      var queryRemove;
      var bindVars = {
        '@collection': fromCollection,
        'filterid': key
      };
      var queryObj1;
      var queryObj2;

      querySave = 'FOR x IN @@collection';
      querySave += ' FILTER x._key == @filterid';
      querySave += ' INSERT x IN ';
      querySave += toCollection;

      queryRemove = 'FOR x in @@collection';
      queryRemove += ' FILTER x._key == @filterid';
      queryRemove += ' REMOVE x IN @@collection';

      queryObj1 = {
        query: querySave,
        bindVars: bindVars
      };

      queryObj2 = {
        query: queryRemove,
        bindVars: bindVars
      };

      window.progressView.show();
      // first insert docs in toCollection
      $.ajax({
        cache: false,
        type: 'POST',
        url: arangoHelper.databaseUrl('/_api/cursor'),
        data: JSON.stringify(queryObj1),
        contentType: 'application/json',
        success: function () {
          // if successful remove unwanted docs
          $.ajax({
            cache: false,
            type: 'POST',
            url: arangoHelper.databaseUrl('/_api/cursor'),
            data: JSON.stringify(queryObj2),
            contentType: 'application/json',
            success: function () {
              if (callback) {
                callback();
              }
              window.progressView.hide();
            },
            error: function () {
              window.progressView.hide();
              arangoHelper.arangoError(
                'Document error', 'Documents inserted, but could not be removed.'
              );
            }
          });
        },
        error: function () {
          window.progressView.hide();
          arangoHelper.arangoError('Document error', 'Could not move selected documents.');
        }
      });
    },

    getDocuments: function (callback) {
      var self = this;
      var query;
      var bindVars;
      var tmp;
      var queryObj;
      bindVars = {
        '@collection': this.collectionID,
        'offset': this.getOffset(),
        'count': this.getPageSize()
      };

      // fetch just the first 25 attributes of the document
      // this number is arbitrary, but may reduce HTTP traffic a bit
      query = 'FOR x IN @@collection LET att = APPEND(SLICE(ATTRIBUTES(x), 0, 25), "_key", true)';
      query += this.setFiltersForQuery(bindVars);
      // Sort result, only useful for a small number of docs
      if (this.getTotal() < this.MAX_SORT) {
        if (this.getSort() === '_key') {
          query += ' SORT TO_NUMBER(x.' + this.getSort() + ') == 0 ? x.' +
            this.getSort() + ' : TO_NUMBER(x.' + this.getSort() + ')';
        } else if (this.getSort() !== '') {
          query += ' SORT x.' + this.getSort();
        }
      }

      if (bindVars.count !== 'all') {
        query += ' LIMIT @offset, @count RETURN KEEP(x, att)';
      } else {
        tmp = {
          '@collection': this.collectionID
        };
        bindVars = tmp;
        query += ' RETURN KEEP(x, att)';
      }

      queryObj = {
        query: query,
        bindVars: bindVars
      };

      var checkCursorStatus = function (jobid) {
        $.ajax({
          cache: false,
          type: 'PUT',
          url: arangoHelper.databaseUrl('/_api/job/' + encodeURIComponent(jobid)),
          contentType: 'application/json',
          success: function (data, textStatus, xhr) {
            if (xhr.status === 201) {
              window.progressView.toShow = false;
              self.clearDocuments();
              if (data.extra && data.extra.stats && data.extra.stats.fullCount !== undefined) {
                self.setTotal(data.extra.stats.fullCount);
              }
              if (self.getTotal() !== 0) {
                _.each(data.result, function (v) {
                  self.add({
                    'id': v._id,
                    'rev': v._rev,
                    'key': v._key,
                    'content': v
                  });
                });
              }
              self.lastQuery = queryObj;

              callback(false, data);
            } else if (xhr.status === 204) {
              self.checkCursorTimer = window.setTimeout(function () {
                checkCursorStatus(jobid);
              }, 500);
            }
          },
          error: function (data) {
            callback(false, data);
          }
        });
      };

      $.ajax({
        cache: false,
        type: 'POST',
        url: arangoHelper.databaseUrl('/_api/cursor'),
        data: JSON.stringify(queryObj),
        headers: {
          'x-arango-async': 'store'
        },
        contentType: 'application/json',
        success: function (data, textStatus, xhr) {
          if (xhr.getResponseHeader('x-arango-async-id')) {
            var jobid = xhr.getResponseHeader('x-arango-async-id');

            var cancelRunningCursor = function () {
              $.ajax({
                url: arangoHelper.databaseUrl('/_api/job/' + encodeURIComponent(jobid) + '/cancel'),
                type: 'PUT',
                success: function () {
                  window.clearTimeout(self.checkCursorTimer);
                  arangoHelper.arangoNotification('Documents', 'Canceled operation.');
                  $('.dataTables_empty').text('Canceled.');
                  window.progressView.hide();
                }
              });
            };

            window.progressView.showWithDelay(1000, 'Fetching documents...', cancelRunningCursor);

            checkCursorStatus(jobid);
          } else {
            callback(true, data);
          }
        },
        error: function (data) {
          callback(false, data);
        }
      });
    },

    clearDocuments: function () {
      this.reset();
    },

    buildDownloadDocumentQuery: function () {
      var query, queryObj, bindVars;

      bindVars = {
        '@collection': this.collectionID
      };

      query = 'FOR x in @@collection';
      query += this.setFiltersForQuery(bindVars);
      // Sort result, only useful for a small number of docs
      if (this.getTotal() < this.MAX_SORT && this.getSort().length > 0) {
        query += ' SORT x.' + this.getSort();
      }

      query += ' RETURN x';

      queryObj = {
        query: query,
        bindVars: bindVars
      };

      return queryObj;
    },

    uploadDocuments: function (file, callback) {
      $.ajax({
        type: 'POST',
        url: arangoHelper.databaseUrl('/_api/import?type=auto&collection=' +
          encodeURIComponent(this.collectionID) +
          '&createCollection=false'),
        data: file,
        processData: false,
        contentType: 'json',
        dataType: 'json',
        complete: function (xhr) {
          if (xhr.readyState === 4 && xhr.status === 201) {
            callback(false);
          } else {
            try {
              var data = JSON.parse(xhr.responseText);
              if (data.errors > 0) {
                var result = 'At least one error occurred during upload';
                callback(false, result);
              }
            } catch (err) {
              console.log(err);
            }
          }
        },
        error: function (msg) {
          callback(true, msg.responseJSON.errorMessage);
        }
      });
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, _, arangoHelper */
(function () {
  'use strict';

  window.ArangoLogs = window.PaginatedCollection.extend({
    upto: false,
    loglevel: 0,
    totalPages: 0,

    parse: function (response) {
      var myResponse = [];
      _.each(response.lid, function (val, i) {
        myResponse.push({
          level: response.level[i],
          lid: val,
          topic: response.topic[i],
          text: response.text[i],
          timestamp: response.timestamp[i],
          totalAmount: response.totalAmount
        });
      });
      this.totalAmount = response.totalAmount;
      this.totalPages = Math.ceil(this.totalAmount / this.pagesize);
      return myResponse;
    },

    initialize: function (options) {
      if (options.upto === true) {
        this.upto = true;
      }
      this.loglevel = options.loglevel;
    },

    model: window.newArangoLog,

    url: function () {
      var type; var rtnStr; var size;

      var inverseOffset = this.totalAmount - ((this.page + 1) * this.pagesize);
      if (inverseOffset < 0 && this.page === (this.totalPages - 1)) {
        inverseOffset = 0;
        size = (this.totalAmount % this.pagesize);
      } else {
        size = this.pagesize;
      }

      // if totalAmount (first fetch) = 0, then set size to 1 (reduce traffic)
      if (this.totalAmount === 0) {
        size = 1;
      }

      if (this.upto) {
        type = 'upto';
      } else {
        type = 'level';
      }
      rtnStr = '/_admin/log?' + type + '=' + this.loglevel + '&size=' + size + '&offset=' + inverseOffset;
      this.lastInverseOffset = inverseOffset;
      return arangoHelper.databaseUrl(rtnStr);
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, window, ArangoQuery, $, _, arangoHelper */
(function () {
  'use strict';

  window.ArangoQueries = Backbone.Collection.extend({
    initialize: function (models, options) {
      var self = this;

      $.ajax('whoAmI?_=' + Date.now(), {async: true}).done(
        function (data) {
          if (this.activeUser === false || this.activeUser === null) {
            self.activeUser = 'root';
          } else {
            self.activeUser = data.user;
          }
        }
      );
    },

    url: arangoHelper.databaseUrl('/_api/user/'),

    model: ArangoQuery,

    activeUser: null,

    parse: function (response) {
      var self = this; var toReturn;
      if (this.activeUser === false || this.activeUser === null) {
        this.activeUser = 'root';
      }

      _.each(response.result, function (val) {
        if (val.user === self.activeUser) {
          try {
            if (val.extra.queries) {
              toReturn = val.extra.queries;
            }
          } catch (e) {}
        }
      });
      return toReturn;
    },

    saveCollectionQueries: function (callback) {
      if (this.activeUser === false || this.activeUser === null) {
        this.activeUser = 'root';
      }

      var queries = [];

      this.each(function (query) {
        queries.push({
          value: query.attributes.value,
          parameter: query.attributes.parameter,
          name: query.attributes.name
        });
      });

      // save current collection
      $.ajax({
        cache: false,
        type: 'PATCH',
        url: arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(this.activeUser)),
        data: JSON.stringify({
          extra: {
            queries: queries
          }
        }),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(false, data);
        },
        error: function () {
          callback(true);
        }
      });
    },

    saveImportQueries: function (file, callback) {
      if (this.activeUser === 0) {
        return false;
      }

      window.progressView.show('Fetching documents...');
      $.ajax({
        cache: false,
        type: 'POST',
        url: 'query/upload/' + encodeURIComponent(this.activeUser),
        data: file,
        contentType: 'application/json',
        processData: false,
        success: function () {
          window.progressView.hide();
          arangoHelper.arangoNotification('Queries successfully imported.');
          callback();
        },
        error: function () {
          window.progressView.hide();
          arangoHelper.arangoError('Query error', 'queries could not be imported');
        }
      });
    }

  });
}());

/* jshint browser: true */
/* jshint strict: false, unused: false */
/* global window, Backbone, $, window, arangoHelper */

window.ArangoReplication = Backbone.Collection.extend({
  model: window.Replication,

  url: '../api/user',

  getLogState: function (callback) {
    $.ajax({
      type: 'GET',
      cache: false,
      url: arangoHelper.databaseUrl('/_api/replication/logger-state'),
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        callback(false, data);
      },
      error: function (data) {
        callback(true, data);
      }
    });
  },
  getApplyState: function (callback) {
    $.ajax({
      type: 'GET',
      cache: false,
      url: arangoHelper.databaseUrl('/_api/replication/applier-state'),
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        callback(false, data);
      },
      error: function (data) {
        callback(true, data);
      }
    });
  }

});

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, window */
window.StatisticsCollection = Backbone.Collection.extend({
  model: window.Statistics,
  url: '/_admin/statistics'
});

/* jshint browser: true */
/* jshint strict: false, unused: false */
/* global Backbone, window */
window.StatisticsDescriptionCollection = Backbone.Collection.extend({
  model: window.StatisticsDescription,
  url: '/_admin/statistics-description',
  parse: function (response) {
    return response;
  }
});

/* jshint browser: true */
/* jshint strict: false, unused: false */
/* global window, atob, Backbone, $,_, window, frontendConfig, arangoHelper */

window.ArangoUsers = Backbone.Collection.extend({
  model: window.Users,

  activeUser: null,
  activeUserSettings: {
    'query': {},
    'shell': {},
    'testing': true
  },

  sortOptions: {
    desc: false
  },

  fetch: function (options) {
    if (window.App.currentUser && window.App.currentDB.get('name') !== '_system') {
      this.url = frontendConfig.basePath + '/_api/user/' + encodeURIComponent(window.App.currentUser);
    }
    return Backbone.Collection.prototype.fetch.call(this, options);
  },

  url: frontendConfig.basePath + '/_api/user',

  // comparator : function(obj) {
  //  return obj.get("user").toLowerCase()
  // },

  comparator: function (item, item2) {
    var a = item.get('user').toLowerCase();
    var b = item2.get('user').toLowerCase();
    if (this.sortOptions.desc === true) {
      return a < b ? 1 : a > b ? -1 : 0;
    }
    return a > b ? 1 : a < b ? -1 : 0;
  },

  login: function (username, password, callback) {
    var self = this;

    $.ajax({
      url: arangoHelper.databaseUrl('/_open/auth'),
      method: 'POST',
      data: JSON.stringify({
        username: username,
        password: password
      }),
      dataType: 'json'
    }).success(
      function (data) {
        var jwtParts = data.jwt.split('.');

        if (!jwtParts[1]) {
          throw new Error('Invalid JWT');
        }

        if (!window.atob) {
          throw new Error('base64 support missing in browser');
        }

        var payload = JSON.parse(atob(jwtParts[1]));
        self.activeUser = payload.preferred_username;

        if (self.activeUser === undefined) {
          arangoHelper.setCurrentJwt(data.jwt, null);
        } else {
          arangoHelper.setCurrentJwt(data.jwt, self.activeUser);
        }

        callback(false, self.activeUser);
      }
    ).error(
      function () {
        arangoHelper.setCurrentJwt(null, null);
        self.activeUser = null;
        callback(true, null);
      }
    );
  },

  setSortingDesc: function (yesno) {
    this.sortOptions.desc = yesno;
  },

  logout: function () {
    arangoHelper.setCurrentJwt(null);
    this.activeUser = null;
    this.reset();
    window.App.navigate('');
    window.location.reload();
  },

  setUserSettings: function (identifier, content) {
    this.activeUserSettings.identifier = content;
  },

  loadUserSettings: function (callback) {
    var self = this;

    $.ajax({
      type: 'GET',
      cache: false,
      // url: frontendConfig.basePath + "/_api/user/" + encodeURIComponent(self.activeUser),
      url: arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(self.activeUser)),
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        self.activeUserSettings = data.extra;
        callback(false, data);
      },
      error: function (data) {
        callback(true, data);
      }
    });
  },

  saveUserSettings: function (callback) {
    var self = this;
    $.ajax({
      cache: false,
      type: 'PUT',
      url: frontendConfig.basePath + '/_api/user/' + encodeURIComponent(self.activeUser),
      data: JSON.stringify({ extra: self.activeUserSettings }),
      contentType: 'application/json',
      processData: false,
      success: function (data) {
        callback(false, data);
      },
      error: function (data) {
        callback(true, data);
      }
    });
  },

  parse: function (response) {
    var result = [];
    if (response.result) {
      _.each(response.result, function (object) {
        result.push(object);
      });
    } else {
      result.push({
        user: response.user,
        active: response.active,
        extra: response.extra,
        changePassword: response.changePassword
      });
    }
    return result;
  },

  whoAmI: function (callback) {
    if (this.activeUser) {
      callback(false, this.activeUser);
      return;
    }
    $.ajax('whoAmI?_=' + Date.now())
      .success(
        function (data) {
          callback(false, data.user);
        }
    ).error(
      function () {
        callback(true, null);
      }
    );
  }

});

/* global window, arangoHelper */
(function () {
  'use strict';
  window.ClusterCoordinators = window.AutomaticRetryCollection.extend({
    model: window.ClusterCoordinator,

    url: arangoHelper.databaseUrl('/_admin/aardvark/cluster/Coordinators'),

    updateUrl: function () {
      this.url = window.App.getNewRoute('Coordinators');
    },

    initialize: function () {
      // window.App.registerForUpdate(this)
    },

    statusClass: function (s) {
      switch (s) {
        case 'ok':
          return 'success';
        case 'warning':
          return 'warning';
        case 'critical':
          return 'danger';
        case 'missing':
          return 'inactive';
        default:
          return 'danger';
      }
    },

    getStatuses: function (cb, nextStep) {
      if (!this.checkRetries()) {
        return;
      }
      var self = this;
      this.fetch({
        beforeSend: window.App.addAuth.bind(window.App),
        error: self.failureTry.bind(self, self.getStatuses.bind(self, cb, nextStep))
      }).done(function () {
        self.successFullTry();
        self.forEach(function (m) {
          cb(self.statusClass(m.get('status')), m.get('address'));
        });
        nextStep();
      });
    },

    byAddress: function (res, callback) {
      if (!this.checkRetries()) {
        return;
      }
      var self = this;
      this.fetch({
        beforeSend: window.App.addAuth.bind(window.App),
        error: self.failureTry.bind(self, self.byAddress.bind(self, res, callback))
      }).done(function () {
        self.successFullTry();
        res = res || {};
        self.forEach(function (m) {
          var addr = m.get('address');
          addr = addr.split(':')[0];
          res[addr] = res[addr] || {};
          res[addr].coords = res[addr].coords || [];
          res[addr].coords.push(m);
        });
        callback(res);
      });
    },

    checkConnection: function (callback) {
      var self = this;
      if (!this.checkRetries()) {
        return;
      }
      this.fetch({
        beforeSend: window.App.addAuth.bind(window.App),
        error: self.failureTry.bind(self, self.checkConnection.bind(self, callback))
      }).done(function () {
        self.successFullTry();
        callback();
      });
    }

  });
}());

/* global window, arangoHelper */
(function () {
  'use strict';

  window.ClusterServers = window.AutomaticRetryCollection.extend({
    model: window.ClusterServer,
    host: '',

    url: arangoHelper.databaseUrl('/_admin/aardvark/cluster/DBServers'),

    updateUrl: function () {
      // this.url = window.App.getNewRoute("DBServers")
      this.url = window.App.getNewRoute(this.host) + this.url;
    },

    initialize: function (models, options) {
      this.host = options.host;
    // window.App.registerForUpdate(this)
    },

    statusClass: function (s) {
      switch (s) {
        case 'ok':
          return 'success';
        case 'warning':
          return 'warning';
        case 'critical':
          return 'danger';
        case 'missing':
          return 'inactive';
        default:
          return 'danger';
      }
    },

    getStatuses: function (cb) {
      if (!this.checkRetries()) {
        return;
      }
      var self = this;
      var completed = function () {
        self.successFullTry();
        self._retryCount = 0;
        self.forEach(function (m) {
          cb(self.statusClass(m.get('status')), m.get('address'));
        });
      };
      // This is the first function called in
      // Each update loop
      this.fetch({
        beforeSend: window.App.addAuth.bind(window.App),
        error: self.failureTry.bind(self, self.getStatuses.bind(self, cb))
      }).done(completed);
    },

    byAddress: function (res, callback) {
      if (!this.checkRetries()) {
        return;
      }
      var self = this;
      this.fetch({
        beforeSend: window.App.addAuth.bind(window.App),
        error: self.failureTry.bind(self, self.byAddress.bind(self, res, callback))
      }).done(function () {
        self.successFullTry();
        res = res || {};
        self.forEach(function (m) {
          var addr = m.get('address');
          addr = addr.split(':')[0];
          res[addr] = res[addr] || {};
          res[addr].dbs = res[addr].dbs || [];
          res[addr].dbs.push(m);
        });
        callback(res);
      }).error(function (e) {
        console.log('error');
        console.log(e);
      });
    },

    getList: function () {
      throw new Error('Do not use');
    },

    getOverview: function () {
      throw new Error('Do not use DbServer.getOverview');
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, Backbone, arangoHelper */
(function () {
  'use strict';
  window.CoordinatorCollection = Backbone.Collection.extend({
    model: window.Coordinator,

    url: arangoHelper.databaseUrl('/_admin/aardvark/cluster/Coordinators')

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, Backbone, $, arangoHelper */
(function () {
  'use strict';
  window.FoxxCollection = Backbone.Collection.extend({
    model: window.Foxx,

    sortOptions: {
      desc: false
    },

    url: arangoHelper.databaseUrl('/_admin/aardvark/foxxes'),

    comparator: function (item, item2) {
      var a, b;
      if (this.sortOptions.desc === true) {
        a = item.get('mount');
        b = item2.get('mount');
        return a < b ? 1 : a > b ? -1 : 0;
      }
      a = item.get('mount');
      b = item2.get('mount');
      return a > b ? 1 : a < b ? -1 : 0;
    },

    setSortingDesc: function (val) {
      this.sortOptions.desc = val;
    },

    // Install Foxx from github repo
    // info is expected to contain: "url" and "version"
    installFromGithub: function (info, mount, callback, isLegacy, flag) {
      var url = arangoHelper.databaseUrl('/_admin/aardvark/foxxes/git?mount=' + encodeURIComponent(mount));
      if (isLegacy) {
        url += '&legacy=true';
      }
      if (flag !== undefined) {
        if (flag) {
          url += '&replace=true';
        } else {
          url += '&upgrade=true';
        }
      }
      $.ajax({
        cache: false,
        type: 'PUT',
        url: url,
        data: JSON.stringify(info),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(data);
        },
        error: function (err) {
          callback(err);
        }
      });
    },

    // Install Foxx from arango store
    // info is expected to contain: "name" and "version"
    installFromStore: function (info, mount, callback, flag) {
      var url = arangoHelper.databaseUrl('/_admin/aardvark/foxxes/store?mount=' + encodeURIComponent(mount));
      if (flag !== undefined) {
        if (flag) {
          url += '&replace=true';
        } else {
          url += '&upgrade=true';
        }
      }
      $.ajax({
        cache: false,
        type: 'PUT',
        url: url,
        data: JSON.stringify(info),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(data);
        },
        error: function (err) {
          callback(err);
        }
      });
    },

    installFromZip: function (fileName, mount, callback, isLegacy, flag) {
      var url = arangoHelper.databaseUrl('/_admin/aardvark/foxxes/zip?mount=' + encodeURIComponent(mount));
      if (isLegacy) {
        url += '&legacy=true';
      }
      if (flag !== undefined) {
        if (flag) {
          url += '&replace=true';
        } else {
          url += '&upgrade=true';
        }
      }
      $.ajax({
        cache: false,
        type: 'PUT',
        url: url,
        data: JSON.stringify({zipFile: fileName}),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(data);
        },
        error: function (err) {
          callback(err);
        }
      });
    },

    generate: function (info, mount, callback, flag) {
      var url = arangoHelper.databaseUrl('/_admin/aardvark/foxxes/generate?mount=' + encodeURIComponent(mount));
      if (flag !== undefined) {
        if (flag) {
          url += '&replace=true';
        } else {
          url += '&upgrade=true';
        }
      }
      $.ajax({
        cache: false,
        type: 'PUT',
        url: url,
        data: JSON.stringify(info),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callback(data);
        },
        error: function (err) {
          callback(err);
        }
      });
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, Backbone, $, arangoHelper */
(function () {
  'use strict';

  window.GraphCollection = Backbone.Collection.extend({
    model: window.Graph,

    sortOptions: {
      desc: false
    },

    // url: frontendConfig.basePath + "/_api/gharial",
    url: arangoHelper.databaseUrl('/_api/gharial'),

    dropAndDeleteGraph: function (name, callback) {
      $.ajax({
        type: 'DELETE',
        url: arangoHelper.databaseUrl('/_api/gharial/') + encodeURIComponent(name) + '?dropCollections=true',
        contentType: 'application/json',
        processData: true,
        success: function () {
          callback(true);
        },
        error: function () {
          callback(false);
        }
      });
    },

    createNode: function (gName, gCollection, data, callback) {
      $.ajax({
        type: 'POST',
        url: arangoHelper.databaseUrl('/_api/gharial/') + encodeURIComponent(gName) + '/vertex/' + encodeURIComponent(gCollection),
        contentType: 'application/json',
        data: JSON.stringify(data),
        processData: true,
        success: function (response) {
          callback(false, response.vertex._id);
        },
        error: function (response) {
          callback(true, null, response.responseJSON.errorMessage);
        }
      });
    },

    createEdge: function (gName, gCollection, data, callback) {
      $.ajax({
        cache: false,
        type: 'POST',
        url: arangoHelper.databaseUrl('/_api/gharial/') + encodeURIComponent(gName) + '/edge/' + encodeURIComponent(gCollection),
        data: JSON.stringify(data),
        contentType: 'application/json',
        processData: false,
        success: function (response) {
          callback(false, response.edge._id);
        },
        error: function (response) {
          callback(true, null, response.responseJSON.errorMessage);
        }
      });
    },

    comparator: function (item, item2) {
      var a = item.get('_key') || '';
      var b = item2.get('_key') || '';
      a = a.toLowerCase();
      b = b.toLowerCase();
      if (this.sortOptions.desc === true) {
        return a < b ? 1 : a > b ? -1 : 0;
      }
      return a > b ? 1 : a < b ? -1 : 0;
    },

    setSortingDesc: function (val) {
      this.sortOptions.desc = val;
    },

    parse: function (res) {
      if (!res.error) {
        return res.graphs;
      }
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, Backbone */
(function () {
  'use strict';
  window.NotificationCollection = Backbone.Collection.extend({
    model: window.Notification,
    url: ''
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, Backbone, arangoHelper, $, frontendConfig */
(function () {
  'use strict';
  window.QueryManagementActive = Backbone.Collection.extend({
    model: window.queryManagementModel,

    url: function () {
      var url = frontendConfig.basePath + '/_api/query/current';

      if (window.frontendConfig.db !== '_system') {
        url = arangoHelper.databaseUrl('/_api/query/current');
      }

      return url;
    },

    killRunningQuery: function (id, callback) {
      var url = frontendConfig.basePath + '/_api/query/' + encodeURIComponent(id);

      if (window.frontendConfig.db !== '_system') {
        url = arangoHelper.databaseUrl('/_api/query/' + encodeURIComponent(id));
      }

      $.ajax({
        url: url,
        type: 'DELETE',
        success: function (result) {
          callback();
        }
      });
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, Backbone, arangoHelper, frontendConfig, $ */
(function () {
  'use strict';
  window.QueryManagementSlow = Backbone.Collection.extend({
    model: window.queryManagementModel,

    url: function () {
      var url = frontendConfig.basePath + '/_api/query/slow';

      if (window.frontendConfig.db !== '_system') {
        url = arangoHelper.databaseUrl('/_api/query/slow');
      }

      return url;
    },

    deleteSlowQueryHistory: function (callback) {
      var url = frontendConfig.basePath + '/_api/query/slow';

      if (window.frontendConfig.db !== '_system') {
        url = arangoHelper.databaseUrl('/_api/query/slow');
      }

      $.ajax({
        url: url,
        type: 'DELETE',
        success: function (result) {
          callback();
        }
      });
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, Backbone */
(function () {
  'use strict';
  window.WorkMonitorCollection = Backbone.Collection.extend({
    model: window.workMonitorModel,

    url: '/_admin/work-monitor',

    parse: function (response) {
      return response.work;
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, window */

(function () {
  'use strict';
  window.PaginationView = Backbone.View.extend({

    // Subclasses need to overwrite this
    collection: null,
    paginationDiv: '',
    idPrefix: '',

    rerender: function () {},

    jumpTo: function (page) {
      this.collection.setPage(page);
      this.rerender();
    },

    firstPage: function () {
      this.jumpTo(1);
    },

    lastPage: function () {
      this.jumpTo(this.collection.getLastPageNumber());
    },

    firstDocuments: function () {
      this.jumpTo(1);
    },
    lastDocuments: function () {
      this.jumpTo(this.collection.getLastPageNumber());
    },
    prevDocuments: function () {
      this.jumpTo(this.collection.getPage() - 1);
    },
    nextDocuments: function () {
      this.jumpTo(this.collection.getPage() + 1);
    },

    renderPagination: function () {
      $(this.paginationDiv).html('');
      var self = this;
      var currentPage = this.collection.getPage();
      var totalPages = this.collection.getLastPageNumber();
      var target = $(this.paginationDiv);
      var options = {
        page: currentPage,
        lastPage: totalPages,
        click: function (i) {
          var split = window.location.hash.split('/');
          if (split[2] === 'documents') {
            options.page = i;
            window.location.hash = split[0] + '/' + split[1] + '/' + split[2] + '/' + i;
          } else {
            self.jumpTo(i);
            options.page = i;
          }
        }
      };
      target.html('');
      target.pagination(options);
      $(this.paginationDiv).prepend(
        '<ul class="pre-pagi"><li><a id="' + this.idPrefix +
        '_first" class="pagination-button">' +
        '<span><i class="fa fa-angle-double-left"/></span></a></li></ul>'
      );
      $(this.paginationDiv).append(
        '<ul class="las-pagi"><li><a id="' + this.idPrefix +
        '_last" class="pagination-button">' +
        '<span><i class="fa fa-angle-double-right"/></span></a></li></ul>'

      );
    }

  });
}());

/* jshint browser: true */
/* global Backbone, $, window, ace, arangoHelper, templateEngine, Joi, _ */
(function () {
  'use strict';

  window.ApplicationDetailView = Backbone.View.extend({
    el: '#content',

    divs: ['#readme', '#swagger', '#app-info', '#sideinformation', '#information', '#settings'],
    navs: ['#service-info', '#service-api', '#service-readme', '#service-settings'],

    template: templateEngine.createTemplate('applicationDetailView.ejs'),

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    events: {
      'click .open': 'openApp',
      'click .delete': 'deleteApp',
      'click #app-deps': 'showDepsDialog',
      'click #app-switch-mode': 'toggleDevelopment',
      'click #app-scripts [data-script]': 'runScript',
      'click #app-tests': 'runTests',
      'click #app-replace': 'replaceApp',
      'click #download-app': 'downloadApp',
      'click .subMenuEntries li': 'changeSubview',
      'click #jsonLink': 'toggleSwagger',
      'mouseenter #app-scripts': 'showDropdown',
      'mouseleave #app-scripts': 'hideDropdown'
    },

    resize: function (auto) {
      if (auto) {
        $('.innerContent').css('height', 'auto');
      } else {
        $('.innerContent').height($('.centralRow').height() - 150);
        $('#swagger iframe').height($('.centralRow').height() - 150);
        $('#swagger #swaggerJsonContent').height($('.centralRow').height() - 150);
      }
    },

    toggleSwagger: function () {
      var callbackFunction = function (json) {
        $('#jsonLink').html('JSON');
        this.jsonEditor.setValue(JSON.stringify(json, null, '\t'), 1);
        $('#swaggerJsonContent').show();
        $('#swagger iframe').hide();
      }.bind(this);

      if ($('#jsonLink').html() === 'Swagger') {
        var url = arangoHelper.databaseUrl('/_admin/aardvark/foxxes/docs/swagger.json?mount=' + encodeURIComponent(this.model.get('mount')));
        arangoHelper.download(url, callbackFunction);
      } else {
        $('#swaggerJsonContent').hide();
        $('#swagger iframe').show();
        $('#jsonLink').html('Swagger');
      }
    },

    changeSubview: function (e) {
      _.each(this.navs, function (nav) {
        $(nav).removeClass('active');
      });

      $(e.currentTarget).addClass('active');

      _.each(this.divs, function (div) {
        $('.headerButtonBar').hide();
        $(div).hide();
      });

      if (e.currentTarget.id === 'service-readme') {
        this.resize(true);
        $('#readme').show();
      } else if (e.currentTarget.id === 'service-api') {
        this.resize();
        $('#swagger').show();
      } else if (e.currentTarget.id === 'service-info') {
        this.resize(true);
        this.render();
        $('#information').show();
        $('#sideinformation').show();
      } else if (e.currentTarget.id === 'service-settings') {
        this.resize(true);
        this.showConfigDialog();
        $('.headerButtonBar').show();
        $('#settings').show();
      }
    },

    downloadApp: function () {
      if (!this.model.isSystem()) {
        this.model.download();
      }
    },

    replaceApp: function () {
      var mount = this.model.get('mount');
      window.foxxInstallView.upgrade(mount, function () {
        window.App.applicationDetail(encodeURIComponent(mount));
      });
      $('.createModalDialog .arangoHeader').html('Replace Service');
      $('#infoTab').click();
    },

    updateConfig: function () {
      this.model.getConfiguration(function () {
        $('#app-warning')[this.model.needsAttention() ? 'show' : 'hide']();
        $('#app-warning-config')[this.model.needsConfiguration() ? 'show' : 'hide']();

        if (this.model.needsConfiguration()) {
          $('#app-config').addClass('error');
        } else {
          $('#app-config').removeClass('error');
        }
      }.bind(this));
    },

    updateDeps: function () {
      this.model.getDependencies(function () {
        $('#app-warning')[this.model.needsAttention() ? 'show' : 'hide']();
        $('#app-warning-deps')[this.model.hasUnconfiguredDependencies() ? 'show' : 'hide']();
        if (this.model.hasUnconfiguredDependencies()) {
          $('#app-deps').addClass('error');
        } else {
          $('#app-deps').removeClass('error');
        }
      }.bind(this));
    },

    toggleDevelopment: function () {
      this.model.toggleDevelopment(!this.model.isDevelopment(), function () {
        if (this.model.isDevelopment()) {
          $('.app-switch-mode').text('Set Production');
          $('#app-development-indicator').css('display', 'inline');
          $('#app-development-path').css('display', 'inline');
        } else {
          $('.app-switch-mode').text('Set Development');
          $('#app-development-indicator').css('display', 'none');
          $('#app-development-path').css('display', 'none');
        }
      }.bind(this));
    },

    runScript: function (event) {
      event.preventDefault();
      var script = $(event.currentTarget).attr('data-script');
      var tableContent = [
        window.modalView.createBlobEntry(
          'app_script_arguments',
          'Script arguments',
          '', null, 'optional', false,
          [{
            rule: function (v) {
              return v && JSON.parse(v);
            },
            msg: 'Must be well-formed JSON or empty'
          }]
        )
      ];
      var buttons = [
        window.modalView.createSuccessButton('Run script', function () {
          var opts = $('#app_script_arguments').val();
          opts = opts && JSON.parse(opts);
          window.modalView.hide();
          this.model.runScript(script, opts, function (err, result) {
            var info;
            if (err) {
              info = (
                '<p>The script failed with an error' +
                (err.statusCode ? (' (HTTP ' + err.statusCode + ')') : '') +
                ':</p>' +
                '<pre>' + err.message + '</pre>'
              );
            } else if (result) {
              info = (
                '<p>Script results:</p>' +
                '<pre>' + JSON.stringify(result, null, 2) + '</pre>'
              );
            } else {
              info = '<p>The script ran successfully.</p>';
            }
            window.modalView.show(
              'modalTable.ejs',
              'Result of script "' + script + '"',
              undefined,
              undefined,
              undefined,
              info
            );
          });
        }.bind(this))
      ];
      window.modalView.show(
        'modalTable.ejs',
        'Run script "' + script + '" on "' + this.model.get('mount') + '"',
        buttons,
        tableContent
      );
    },

    showSwagger: function (event) {
      event.preventDefault();
      this.render('swagger');
    },

    showReadme: function (event) {
      event.preventDefault();
      this.render('readme');
    },

    runTests: function (event) {
      event.preventDefault();
      var warning = (
      '<p><strong>WARNING:</strong> Running tests may result in destructive side-effects including data loss.' +
        ' Please make sure not to run tests on a production database.</p>'
      );
      if (this.model.isDevelopment()) {
        warning += (
          '<p><strong>WARNING:</strong> This app is running in <strong>development mode</strong>.' +
          ' If any of the tests access the app\'s HTTP API they may become non-deterministic.</p>'
        );
      }
      var buttons = [
        window.modalView.createSuccessButton('Run tests', function () {
          window.modalView.hide();
          this.model.runTests({reporter: 'suite'}, function (err, result) {
            window.modalView.show(
              'modalTestResults.ejs',
              'Test results',
              undefined,
              undefined,
              undefined,
              err || result
            );
          });
        }.bind(this))
      ];
      window.modalView.show(
        'modalTable.ejs',
        'Run tests for app "' + this.model.get('mount') + '"',
        buttons,
        undefined,
        undefined,
        warning
      );
    },

    render: function (mode) {
      this.resize();
      this.model.fetchThumbnail(function () {
        var callback = function (error, db) {
          var self = this;
          if (error) {
            arangoHelper.arangoError('DB', 'Could not get current database');
          } else {
            $(this.el).html(this.template.render({
              app: this.model,
              baseUrl: arangoHelper.databaseUrl('', db),
              mode: mode
            }));

            // init ace
            self.jsonEditor = ace.edit('swaggerJsonEditor');
            self.jsonEditor.setReadOnly(true);
            self.jsonEditor.getSession().setMode('ace/mode/json');

            $.ajax({
              url: this.appUrl(db),
              headers: {
                accept: 'text/html,*/*;q=0.9'
              }
            }).success(function () {
              $('.open', this.el).prop('disabled', false);
            }.bind(this));

            this.updateConfig();
            this.updateDeps();

            if (mode === 'swagger') {
              $.get('./foxxes/docs/swagger.json?mount=' + encodeURIComponent(this.model.get('mount')), function (data) {
                if (Object.keys(data.paths).length < 1) {
                  self.render('readme');
                  $('#app-show-swagger').attr('disabled', 'true');
                }
              });
            }
          }

          this.breadcrumb();
        }.bind(this);

        arangoHelper.currentDatabase(callback);

        if (_.isEmpty(this.model.get('config'))) {
          $('#service-settings').attr('disabled', true);
        }
      }.bind(this));
      return $(this.el);
    },

    breadcrumb: function () {
      var string = 'Service: ' + this.model.get('name') + '<i class="fa fa-ellipsis-v" aria-hidden="true"></i>';

      var contributors = '<p class="mount"><span>Contributors:</span>';
      if (this.model.get('contributors') && this.model.get('contributors').length > 0) {
        _.each(this.model.get('contributors'), function (contributor) {
          if (contributor.email) {
            contributors += '<a href="mailto:' + contributor.email + '">' + (contributor.name || contributor.email) + '</a>';
          } else if (contributor.name) {
            contributors += '<a>contributor.name</a>';
          }
        });
      } else {
        contributors += 'No contributors';
      }
      contributors += '</p>';
      $('.information').append(
        contributors
      );

      // information box info tab
      if (this.model.get('author')) {
        $('.information').append(
          '<p class="mount"><span>Author:</span>' + this.model.get('author') + '</p>'
        );
      }
      if (this.model.get('mount')) {
        $('.information').append(
          '<p class="mount"><span>Mount:</span>' + this.model.get('mount') + '</p>'
        );
      }
      if (this.model.get('development')) {
        if (this.model.get('path')) {
          $('.information').append(
            '<p class="path"><span>Path:</span>' + this.model.get('path') + '</p>'
          );
        }
      }
      $('#subNavigationBar .breadcrumb').html(string);
    },

    openApp: function () {
      var callback = function (error, db) {
        if (error) {
          arangoHelper.arangoError('DB', 'Could not get current database');
        } else {
          window.open(this.appUrl(db), this.model.get('title')).focus();
        }
      }.bind(this);

      arangoHelper.currentDatabase(callback);
    },

    deleteApp: function () {
      var buttons = [
        window.modalView.createDeleteButton('Delete', function () {
          var opts = {teardown: $('#app_delete_run_teardown').is(':checked')};
          this.model.destroy(opts, function (err, result) {
            if (!err && result.error === false) {
              window.modalView.hide();
              window.App.navigate('services', {trigger: true});
            }
          });
        }.bind(this))
      ];
      var tableContent = [
        window.modalView.createCheckboxEntry(
          'app_delete_run_teardown',
          'Run teardown?',
          true,
          "Should this app's teardown script be executed before removing the app?",
          true
        )
      ];
      window.modalView.show(
        'modalTable.ejs',
        'Delete Foxx App mounted at "' + this.model.get('mount') + '"',
        buttons,
        tableContent,
        undefined,
        '<p>Are you sure? There is no way back...</p>',
        true
      );
    },

    appUrl: function (currentDB) {
      return arangoHelper.databaseUrl(this.model.get('mount'), currentDB);
    },

    applyConfig: function () {
      var cfg = {};
      _.each(this.model.get('config'), function (opt, key) {
        var $el = $('#app_config_' + key);
        var val = $el.val();
        if (opt.type === 'boolean' || opt.type === 'bool') {
          cfg[key] = $el.is(':checked');
          return;
        }
        if (val === '' && opt.hasOwnProperty('default')) {
          cfg[key] = opt.default;
          if (opt.type === 'json') {
            cfg[key] = JSON.stringify(opt.default);
          }
          return;
        }
        if (opt.type === 'number') {
          cfg[key] = parseFloat(val);
        } else if (opt.type === 'integer' || opt.type === 'int') {
          cfg[key] = parseInt(val, 10);
        } else if (opt.type === 'json') {
          cfg[key] = val && JSON.stringify(JSON.parse(val));
        } else {
          cfg[key] = val;
          return;
        }
      });
      this.model.setConfiguration(cfg, function () {
        this.updateConfig();
        arangoHelper.arangoNotification(this.model.get('name'), 'Settings applied.');
      }.bind(this));
    },

    showConfigDialog: function () {
      if (_.isEmpty(this.model.get('config'))) {
        $('#settings .buttons').html($('#hidden_buttons').html());
        return;
      }
      var tableContent = _.map(this.model.get('config'), function (obj, name) {
        var defaultValue = obj.default === undefined ? '' : String(obj.default);
        var currentValue = obj.current === undefined ? '' : String(obj.current);
        var methodName = 'createTextEntry';
        var mandatory = false;
        var checks = [];
        if (obj.type === 'boolean' || obj.type === 'bool') {
          methodName = 'createCheckboxEntry';
          obj.default = obj.default || false;
          defaultValue = obj.default || false;
          currentValue = obj.current || false;
        } else if (obj.type === 'json') {
          methodName = 'createBlobEntry';
          defaultValue = obj.default === undefined ? '' : JSON.stringify(obj.default);
          currentValue = obj.current === undefined ? '' : obj.current;
          checks.push({
            rule: function (v) {
              return v && JSON.parse(v);
            },
            msg: 'Must be well-formed JSON or empty.'
          });
        } else if (obj.type === 'integer' || obj.type === 'int') {
          checks.push({
            rule: Joi.number().integer().optional().allow(''),
            msg: 'Has to be an integer.'
          });
        } else if (obj.type === 'number') {
          checks.push({
            rule: Joi.number().optional().allow(''),
            msg: 'Has to be a number.'
          });
        } else {
          if (obj.type === 'password') {
            methodName = 'createPasswordEntry';
          }
          checks.push({
            rule: Joi.string().optional().allow(''),
            msg: 'Has to be a string.'
          });
        }
        if (obj.default === undefined && obj.required !== false) {
          mandatory = true;
          checks.unshift({
            rule: Joi.any().required(),
            msg: 'This field is required.'
          });
        }
        return window.modalView[methodName](
          'app_config_' + name,
          name,
          currentValue,
          obj.description,
          defaultValue,
          mandatory,
          checks
        );
      });

      var buttons = [
        window.modalView.createSuccessButton('Apply', this.applyConfig.bind(this))
      ];

      window.modalView.show(
        'modalTable.ejs', 'Configuration', buttons, tableContent, null, null, null, null, null, 'settings'
      );
      $('.modal-footer').prepend($('#hidden_buttons').html());
    },

    applyDeps: function () {
      var deps = {};
      _.each(this.model.get('deps'), function (title, name) {
        var $el = $('#app_deps_' + name);
        deps[name] = window.arangoHelper.escapeHtml($el.val());
      });
      this.model.setDependencies(deps, function () {
        window.modalView.hide();
        this.updateDeps();
      }.bind(this));
    },

    showDepsDialog: function () {
      if (_.isEmpty(this.model.get('deps'))) {
        return;
      }
      var tableContent = _.map(this.model.get('deps'), function (obj, name) {
        var currentValue = obj.current === undefined ? '' : String(obj.current);
        var defaultValue = '';
        var description = obj.definition.name;
        if (obj.definition.version !== '*') {
          description += '@' + obj.definition.version;
        }
        var checks = [{
          rule: Joi.string().optional().allow(''),
          msg: 'Has to be a string.'
        }];
        if (obj.definition.required) {
          checks.push({
            rule: Joi.string().required(),
            msg: 'This value is required.'
          });
        }
        return window.modalView.createTextEntry(
          'app_deps_' + name,
          obj.title,
          currentValue,
          description,
          defaultValue,
          obj.definition.required,
          checks
        );
      });
      var buttons = [
        window.modalView.createSuccessButton('Apply', this.applyDeps.bind(this))
      ];
      window.modalView.show(
        'modalTable.ejs', 'Dependencies', buttons, tableContent
      );
    },

    showDropdown: function () {
      if (!_.isEmpty(this.model.get('scripts'))) {
        $('#scripts_dropdown').show(200);
      }
    },

    hideDropdown: function () {
      $('#scripts_dropdown').hide();
    }
  });
}());

/* jshint browser: true */
/* global Backbone, $, window, arangoHelper, templateEngine, _ */
(function () {
  'use strict';

  window.ApplicationsView = Backbone.View.extend({
    el: '#content',

    template: templateEngine.createTemplate('applicationsView.ejs'),

    events: {
      'click #addApp': 'createInstallModal',
      'click #foxxToggle': 'slideToggle',
      'click #checkDevel': 'toggleDevel',
      'click #checkProduction': 'toggleProduction',
      'click #checkSystem': 'toggleSystem'
    },

    fixCheckboxes: function () {
      if (this._showDevel) {
        $('#checkDevel').attr('checked', 'checked');
      } else {
        $('#checkDevel').removeAttr('checked');
      }
      if (this._showSystem) {
        $('#checkSystem').attr('checked', 'checked');
      } else {
        $('#checkSystem').removeAttr('checked');
      }
      if (this._showProd) {
        $('#checkProduction').attr('checked', 'checked');
      } else {
        $('#checkProduction').removeAttr('checked');
      }
      $('#checkDevel').next().removeClass('fa fa-check-square-o fa-square-o').addClass('fa');
      $('#checkSystem').next().removeClass('fa fa-check-square-o fa-square-o').addClass('fa');
      $('#checkProduction').next().removeClass('fa fa-check-square-o fa-square-o').addClass('fa');
      arangoHelper.setCheckboxStatus('#foxxDropdown');
    },

    toggleDevel: function () {
      var self = this;
      this._showDevel = !this._showDevel;
      _.each(this._installedSubViews, function (v) {
        v.toggle('devel', self._showDevel);
      });
      this.fixCheckboxes();
    },

    toggleProduction: function () {
      var self = this;
      this._showProd = !this._showProd;
      _.each(this._installedSubViews, function (v) {
        v.toggle('production', self._showProd);
      });
      this.fixCheckboxes();
    },

    toggleSystem: function () {
      this._showSystem = !this._showSystem;
      var self = this;
      _.each(this._installedSubViews, function (v) {
        v.toggle('system', self._showSystem);
      });
      this.fixCheckboxes();
    },

    reload: function () {
      var self = this;

      // unbind and remove any unused views
      _.each(this._installedSubViews, function (v) {
        v.undelegateEvents();
      });

      this.collection.fetch({
        success: function () {
          self.createSubViews();
          self.render();
        }
      });
    },

    createSubViews: function () {
      var self = this;
      this._installedSubViews = { };

      self.collection.each(function (foxx) {
        var subView = new window.FoxxActiveView({
          model: foxx,
          appsView: self
        });
        self._installedSubViews[foxx.get('mount')] = subView;
      });
    },

    initialize: function () {
      this._installedSubViews = {};
      this._showDevel = true;
      this._showProd = true;
      this._showSystem = false;
    },

    slideToggle: function () {
      $('#foxxToggle').toggleClass('activated');
      $('#foxxDropdownOut').slideToggle(200);
    },

    createInstallModal: function (event) {
      event.preventDefault();
      window.foxxInstallView.install(this.reload.bind(this));
    },

    render: function () {
      this.collection.sort();

      $(this.el).html(this.template.render({}));
      _.each(this._installedSubViews, function (v) {
        $('#installedList').append(v.render());
      });
      this.delegateEvents();
      $('#checkDevel').attr('checked', this._showDevel);
      $('#checkProduction').attr('checked', this._showProd);
      $('#checkSystem').attr('checked', this._showSystem);
      arangoHelper.setCheckboxStatus('#foxxDropdown');

      var self = this;
      _.each(this._installedSubViews, function (v) {
        v.toggle('devel', self._showDevel);
        v.toggle('system', self._showSystem);
      });

      arangoHelper.fixTooltips('icon_arangodb', 'left');
      return this;
    }

  });

/* Info for mountpoint
 *
 *
    window.modalView.createTextEntry(
      "mount-point",
      "Mount",
      "",
      "The path the app will be mounted. Has to start with /. Is not allowed to start with /_",
      "/my/app",
      true,
      [
        {
          rule: Joi.string().required(),
          msg: "No mountpoint given."
        },
        {
          rule: Joi.string().regex(/^\/[^_]/),
          msg: "Mountpoints with _ are reserved for internal use."
        },
        {
          rule: Joi.string().regex(/^(\/[a-zA-Z0-9_\-%]+)+$/),
          msg: "Mountpoints have to start with / and can only contain [a-zA-Z0-9_-%]"
        }
      ]
    )
 */
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, prettyBytes, Backbone, templateEngine, $, window, _, nv, d3 */
(function () {
  'use strict';

  window.ClusterView = Backbone.View.extend({
    el: '#content',
    template: templateEngine.createTemplate('clusterView.ejs'),

    events: {
    },

    statsEnabled: false,
    historyInit: false,
    initDone: false,
    interval: 5000,
    maxValues: 100,
    knownServers: [],
    chartData: {},
    charts: {},
    nvcharts: [],
    startHistory: {},
    startHistoryAccumulated: {},

    initialize: function (options) {
      var self = this;

      if (window.App.isCluster) {
        this.dbServers = options.dbServers;
        this.coordinators = options.coordinators;
        this.updateServerTime();

        // start polling with interval
        window.setInterval(function () {
          if (window.location.hash === '#cluster' ||
            window.location.hash === '' ||
            window.location.hash === '#') {
            var callback = function (data) {
              self.rerenderValues(data);
              self.rerenderGraphs(data);
            };

            // now fetch the statistics history
            self.getCoordStatHistory(callback);
          } else {
            var cb2 = function (data) {
              self.rerenderGraphs(data, true);
            };

            // only fetch data when view is not active
            self.getCoordStatHistory(cb2);
          }
        }, this.interval);
      }
    },

    render: function () {
      var self = this;
      this.$el.html(this.template.render({}));
      // this.initValues()

      if (!this.initDone) {
        if (this.coordinators.first() !== undefined) {
          this.getServerStatistics();
        } else {
          this.waitForCoordinators();
        }
        this.initDone = true;
      }
      this.initGraphs();

      // directly rerender coord, db, data
      var callback = function (data) {
        self.rerenderValues(data);
      };
      this.getCoordStatHistory(callback);
    },

    waitForCoordinators: function () {
      var self = this;

      window.setTimeout(function () {
        if (self.coordinators) {
          self.getServerStatistics();
        } else {
          self.waitForCoordinators();
        }
      }, 500);
    },

    updateServerTime: function () {
      this.serverTime = new Date().getTime();
    },

    getServerStatistics: function () {
      var self = this;

      this.data = undefined;

      var coord = this.coordinators.first();

      this.statCollectCoord = new window.ClusterStatisticsCollection([],
        {host: coord.get('address')}
      );
      this.statCollectDBS = new window.ClusterStatisticsCollection([],
        {host: coord.get('address')}
      );

      // create statistics collector for DB servers
      var dbsmodels = [];
      _.each(this.dbServers, function (dbs) {
        dbs.each(function (model) {
          dbsmodels.push(model);
        });
      });

      _.each(dbsmodels, function (dbserver) {
        if (dbserver.get('status') !== 'ok') {
          return;
        }

        if (self.knownServers.indexOf(dbserver.id) === -1) {
          self.knownServers.push(dbserver.id);
        }

        var stat = new window.Statistics({name: dbserver.id});
        stat.url = coord.get('protocol') + '://' +
        coord.get('address') +
        '/_admin/clusterStatistics?DBserver=' +
        dbserver.get('name');
        self.statCollectDBS.add(stat);
      });

      // create statistics collector for coordinator
      this.coordinators.forEach(function (coordinator) {
        if (coordinator.get('status') !== 'ok') {
          return;
        }

        if (self.knownServers.indexOf(coordinator.id) === -1) {
          self.knownServers.push(coordinator.id);
        }

        var stat = new window.Statistics({name: coordinator.id});

        stat.url = coordinator.get('protocol') + '://' +
          coordinator.get('address') +
          '/_admin/statistics';

        self.statCollectCoord.add(stat);
      });

      // first load history callback
      var callback = function (data) {
        self.rerenderValues(data);
        self.rerenderGraphs(data);
      };

      // now fetch the statistics history
      self.getCoordStatHistory(callback);

      // special case nodes
      self.renderNodes();
    },

    rerenderValues: function (data) {
      var self = this;

      // NODES - DBS - COORDS
      self.renderNodes();

      // Connections
      this.renderValue('#clusterConnections', Math.round(data.clientConnectionsCurrent));
      this.renderValue('#clusterConnectionsAvg', Math.round(data.clientConnections15M));

      // RAM
      var totalMem = data.physicalMemory;
      var usedMem = data.residentSizeCurrent;
      this.renderValue('#clusterRam', [usedMem, totalMem]);
    },

    renderValue: function (id, value, error, warning) {
      if (typeof value === 'number') {
        $(id).html(value);
      } else if ($.isArray(value)) {
        var a = value[0]; var b = value[1];

        var percent = 1 / (b / a) * 100;
        if (percent > 90) {
          error = true;
        } else if (percent > 70 && percent < 90) {
          warning = true;
        }
        $(id).html(percent.toFixed(1) + ' %');
      } else if (typeof value === 'string') {
        $(id).html(value);
      }

      if (error) {
        $(id).addClass('negative');
        $(id).removeClass('warning');
        $(id).removeClass('positive');
      } else if (warning) {
        $(id).addClass('warning');
        $(id).removeClass('positive');
        $(id).removeClass('negative');
      } else {
        $(id).addClass('positive');
        $(id).removeClass('negative');
        $(id).removeClass('warning');
      }
    },

    renderNodes: function () {
      var self = this;
      var callbackFunction = function (data) {
        var coords = 0; var coordsErrors = 0;
        var dbs = 0; var dbsErrors = 0;

        _.each(data, function (node) {
          if (node.Role === 'Coordinator') {
            coords++;
            if (node.Status !== 'GOOD') {
              coordsErrors++;
            }
          } else if (node.Role === 'DBServer') {
            dbs++;
            if (node.Status !== 'GOOD') {
              dbsErrors++;
            }
          }
        });

        if (coordsErrors > 0) {
          this.renderValue('#clusterCoordinators', coords - coordsErrors + '/' + coords, true);
        } else {
          this.renderValue('#clusterCoordinators', coords);
        }

        if (dbsErrors > 0) {
          this.renderValue('#clusterDBServers', dbs - dbsErrors + '/' + dbs, true);
        } else {
          this.renderValue('#clusterDBServers', dbs);
        }
      }.bind(this);

      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_admin/cluster/health'),
        contentType: 'application/json',
        processData: false,
        async: true,
        success: function (data) {
          callbackFunction(data.Health);
        },
        error: function () {
          self.renderValue('#clusterCoordinators', 'N/A', true);
          self.renderValue('#clusterDBServers', 'N/A', true);
        }
      });
    },

    initValues: function () {
      var values = [
        '#clusterNodes',
        '#clusterRam',
        '#clusterConnections',
        '#clusterConnectionsAvg'
      ];

      _.each(values, function (id) {
        $(id).html('<i class="fa fa-spin fa-circle-o-notch" style="color: rgba(0, 0, 0, 0.64);"></i>');
      });
    },

    graphData: {
      data: {
        sent: [],
        received: []
      },
      http: [],
      average: []
    },

    checkArraySizes: function () {
      var self = this;

      _.each(self.chartsOptions, function (val1, key1) {
        _.each(val1.options, function (val2, key2) {
          if (val2.values.length > self.maxValues - 1) {
            self.chartsOptions[key1].options[key2].values.shift();
          }
        });
      });
    },

    formatDataForGraph: function (data) {
      var self = this;

      if (!self.historyInit) {
        _.each(data.times, function (time, key) {
          // DATA
          self.chartsOptions[0].options[0].values.push({x: time, y: data.bytesSentPerSecond[key]});
          self.chartsOptions[0].options[1].values.push({x: time, y: data.bytesReceivedPerSecond[key]});

          // HTTP
          self.chartsOptions[1].options[0].values.push({x: time, y: self.calcTotalHttp(data.http, key)});

          // AVERAGE
          self.chartsOptions[2].options[0].values.push({x: time, y: data.avgRequestTime[key] / self.coordinators.length});
        });
        self.historyInit = true;
      } else {
        self.checkArraySizes();

        // DATA
        self.chartsOptions[0].options[0].values.push({
          x: data.times[data.times.length - 1],
          y: data.bytesSentPerSecond[data.bytesSentPerSecond.length - 1]
        });
        self.chartsOptions[0].options[1].values.push({
          x: data.times[data.times.length - 1],
          y: data.bytesReceivedPerSecond[data.bytesReceivedPerSecond.length - 1]
        });
        // HTTP
        self.chartsOptions[1].options[0].values.push({
          x: data.times[data.times.length - 1],
          y: self.calcTotalHttp(data.http, data.bytesSentPerSecond.length - 1)
        });
        // AVERAGE
        self.chartsOptions[2].options[0].values.push({
          x: data.times[data.times.length - 1],
          y: data.avgRequestTime[data.bytesSentPerSecond.length - 1] / self.coordinators.length
        });
      }
    },

    chartsOptions: [
      {
        id: '#clusterData',
        type: 'bytes',
        count: 2,
        options: [
          {
            area: true,
            values: [],
            key: 'Bytes out',
            color: 'rgb(23,190,207)',
            strokeWidth: 2,
            fillOpacity: 0.1
          },
          {
            area: true,
            values: [],
            key: 'Bytes in',
            color: 'rgb(188, 189, 34)',
            strokeWidth: 2,
            fillOpacity: 0.1
          }
        ]
      },
      {
        id: '#clusterHttp',
        type: 'bytes',
        options: [{
          area: true,
          values: [],
          key: 'Bytes',
          color: 'rgb(0, 166, 90)',
          fillOpacity: 0.1
        }]
      },
      {
        id: '#clusterAverage',
        data: [],
        type: 'seconds',
        options: [{
          area: true,
          values: [],
          key: 'Seconds',
          color: 'rgb(243, 156, 18)',
          fillOpacity: 0.1
        }]
      }
    ],

    initGraphs: function () {
      var self = this;

      var noData = 'No data...';

      _.each(self.chartsOptions, function (c) {
        nv.addGraph(function () {
          self.charts[c.id] = nv.models.stackedAreaChart()
            .options({
              useInteractiveGuideline: true,
              showControls: false,
              noData: noData,
              duration: 0
            });

          self.charts[c.id].xAxis
            .axisLabel('')
            .tickFormat(function (d) {
              var x = new Date(d * 1000);
              return (x.getHours() < 10 ? '0' : '') + x.getHours() + ':' +
                (x.getMinutes() < 10 ? '0' : '') + x.getMinutes() + ':' +
                (x.getSeconds() < 10 ? '0' : '') + x.getSeconds();
            })
            .staggerLabels(false);

          self.charts[c.id].yAxis
            .axisLabel('')
            .tickFormat(function (d) {
              var formatted;

              if (c.type === 'bytes') {
                if (d === null) {
                  return 'N/A';
                }
                formatted = parseFloat(d3.format('.2f')(d));
                return prettyBytes(formatted);
              } else if (c.type === 'seconds') {
                if (d === null) {
                  return 'N/A';
                }
                formatted = parseFloat(d3.format('.3f')(d));
                return formatted;
              }
            });

          var data; var lines = self.returnGraphOptions(c.id);
          if (lines.length > 0) {
            _.each(lines, function (val, key) {
              c.options[key].values = val;
            });
          } else {
            c.options[0].values = [];
          }
          data = c.options;

          self.chartData[c.id] = d3.select(c.id).append('svg')
            .datum(data)
            .transition().duration(300)
            .call(self.charts[c.id])
            .each('start', function () {
              window.setTimeout(function () {
                d3.selectAll(c.id + ' *').each(function () {
                  if (this.__transition__) {
                    this.__transition__.duration = 0;
                  }
                });
              }, 0);
            });

          nv.utils.windowResize(self.charts[c.id].update);
          self.nvcharts.push(self.charts[c.id]);

          return self.charts[c.id];
        });
      });
    },

    returnGraphOptions: function (id) {
      var arr = [];
      if (id === '#clusterData') {
        // arr =  [this.graphData.data.sent, this.graphData.data.received]
        arr = [
          this.chartsOptions[0].options[0].values,
          this.chartsOptions[0].options[1].values
        ];
      } else if (id === '#clusterHttp') {
        arr = [this.chartsOptions[1].options[0].values];
      } else if (id === '#clusterAverage') {
        arr = [this.chartsOptions[2].options[0].values];
      } else {
        arr = [];
      }

      return arr;
    },

    rerenderGraphs: function (input, noRender) {
      if (!this.statsEnabled) {
        return;
      }

      var self = this; var data; var lines;
      this.formatDataForGraph(input);

      _.each(self.chartsOptions, function (c) {
        lines = self.returnGraphOptions(c.id);

        if (lines.length > 0) {
          _.each(lines, function (val, key) {
            c.options[key].values = val;
          });
        } else {
          c.options[0].values = [];
        }
        data = c.options;

        if (noRender === undefined || noRender === false) {
          // update nvd3 chart
          if (data[0].values.length > 0) {
            if (self.historyInit) {
              if (self.charts[c.id]) {
                self.charts[c.id].update();
              }
            }
          }
        }
      });
    },

    calcTotalHttp: function (object, pos) {
      var sum = 0;
      _.each(object, function (totalHttp) {
        sum += totalHttp[pos];
      });
      return sum;
    },

    getCoordStatHistory: function (callback) {
      $.ajax({
        url: 'statistics/coordshort',
        json: true
      })
        .success(function (data) {
          this.statsEnabled = data.enabled;
          callback(data.data);
        }.bind(this));
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, frontendConfig, exports, Backbone, _, $, templateEngine, arangoHelper, Joi */

(function () {
  'use strict';

  window.CollectionListItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'tile pure-u-1-1 pure-u-sm-1-2 pure-u-md-1-3 pure-u-lg-1-4 pure-u-xl-1-6',
    template: templateEngine.createTemplate('collectionsItemView.ejs'),

    initialize: function (options) {
      this.collectionsView = options.collectionsView;
    },

    events: {
      'click .iconSet.icon_arangodb_settings2': 'createEditPropertiesModal',
      'click .pull-left': 'noop',
      'click .icon_arangodb_settings2': 'editProperties',
      'click .spanInfo': 'showProperties',
      'click': 'selectCollection'
    },

    render: function () {
      if (this.model.get('locked') || this.model.get('status') === 'corrupted') {
        $(this.el).addClass('locked');
        $(this.el).addClass(this.model.get('lockType'));
      } else {
        $(this.el).removeClass('locked');
      }
      if (this.model.get('status') === 'loading' || this.model.get('status') === 'unloading') {
        $(this.el).addClass('locked');
      }
      $(this.el).html(this.template.render({
        model: this.model
      }));
      $(this.el).attr('id', 'collection_' + this.model.get('name'));

      return this;
    },

    editProperties: function (event) {
      if (this.model.get('locked')) {
        return 0;
      }
      event.stopPropagation();
      this.createEditPropertiesModal();
    },

    showProperties: function (event) {
      if (this.model.get('locked')) {
        return 0;
      }
      event.stopPropagation();
      this.createInfoModal();
    },

    selectCollection: function (event) {
      // check if event was fired from disabled button
      if ($(event.target).hasClass('disabled')) {
        return 0;
      }
      if (this.model.get('locked')) {
        return 0;
      }
      if (this.model.get('status') === 'loading') {
        return 0;
      }
      if (this.model.get('status') === 'corrupted') {
        return 0;
      }

      if (this.model.get('status') === 'unloaded') {
        this.loadCollection();
      } else {
        window.App.navigate(
          'collection/' + encodeURIComponent(this.model.get('name')) + '/documents/1', {trigger: true}
        );
      }
    },

    noop: function (event) {
      event.stopPropagation();
    },

    unloadCollection: function () {
      var unloadCollectionCallback = function (error) {
        if (error) {
          arangoHelper.arangoError('Collection error', this.model.get('name') + ' could not be unloaded.');
        } else if (error === undefined) {
          this.model.set('status', 'unloading');
          this.render();
        } else {
          if (window.location.hash === '#collections') {
            this.model.set('status', 'unloaded');
            this.render();
          } else {
            arangoHelper.arangoNotification('Collection ' + this.model.get('name') + ' unloaded.');
          }
        }
      }.bind(this);

      this.model.unloadCollection(unloadCollectionCallback);
      window.modalView.hide();
    },

    loadCollection: function () {
      var loadCollectionCallback = function (error) {
        if (error) {
          arangoHelper.arangoError('Collection error', this.model.get('name') + ' could not be loaded.');
        } else if (error === undefined) {
          this.model.set('status', 'loading');
          this.render();
        } else {
          if (window.location.hash === '#collections') {
            this.model.set('status', 'loaded');
            this.render();
          } else {
            arangoHelper.arangoNotification('Collection ' + this.model.get('name') + ' loaded.');
          }
        }
      }.bind(this);

      this.model.loadCollection(loadCollectionCallback);
      window.modalView.hide();
    },

    truncateCollection: function () {
      this.model.truncateCollection();
      window.modalView.hide();
    },

    deleteCollection: function () {
      this.model.destroy(
        {
          error: function () {
            arangoHelper.arangoError('Could not delete collection.');
          },
          success: function () {
            window.modalView.hide();
          }
        }
      );
      this.collectionsView.render();
    },

    saveModifiedCollection: function () {
      var callback = function (error, isCoordinator) {
        if (error) {
          arangoHelper.arangoError('Error', 'Could not get coordinator info');
        } else {
          var newname;
          if (isCoordinator) {
            newname = this.model.get('name');
          } else {
            newname = $('#change-collection-name').val();
          }
          var status = this.model.get('status');

          if (status === 'loaded') {
            var journalSize;
            try {
              journalSize = JSON.parse($('#change-collection-size').val() * 1024 * 1024);
            } catch (e) {
              arangoHelper.arangoError('Please enter a valid number');
              return 0;
            }

            var indexBuckets;
            try {
              indexBuckets = JSON.parse($('#change-index-buckets').val());
              if (indexBuckets < 1 || parseInt(indexBuckets, 10) !== Math.pow(2, Math.log2(indexBuckets))) {
                throw new Error('invalid indexBuckets value');
              }
            } catch (e) {
              arangoHelper.arangoError('Please enter a valid number of index buckets');
              return 0;
            }
            var callbackChange = function (error) {
              if (error) {
                arangoHelper.arangoError('Collection error: ' + error.responseText);
              } else {
                this.collectionsView.render();
                window.modalView.hide();
              }
            }.bind(this);

            var callbackRename = function (error) {
              if (error) {
                arangoHelper.arangoError('Collection error: ' + error.responseText);
              } else {
                var wfs = $('#change-collection-sync').val();
                this.model.changeCollection(wfs, journalSize, indexBuckets, callbackChange);
              }
            }.bind(this);

            if (frontendConfig.isCluster === false) {
              this.model.renameCollection(newname, callbackRename);
            } else {
              callbackRename();
            }
          } else if (status === 'unloaded') {
            if (this.model.get('name') !== newname) {
              var callbackRename2 = function (error, data) {
                if (error) {
                  arangoHelper.arangoError('Collection error: ' + data.responseText);
                } else {
                  this.collectionsView.render();
                  window.modalView.hide();
                }
              }.bind(this);

              if (frontendConfig.isCluster === false) {
                this.model.renameCollection(newname, callbackRename2);
              } else {
                callbackRename2();
              }
            } else {
              window.modalView.hide();
            }
          }
        }
      }.bind(this);

      window.isCoordinator(callback);
    },

    createEditPropertiesModal: function () {
      var callback = function (error, isCoordinator) {
        if (error) {
          arangoHelper.arangoError('Error', 'Could not get coordinator info');
        } else {
          var collectionIsLoaded = false;

          if (this.model.get('status') === 'loaded') {
            collectionIsLoaded = true;
          }

          var buttons = [];
          var tableContent = [];

          if (!isCoordinator) {
            tableContent.push(
              window.modalView.createTextEntry(
                'change-collection-name',
                'Name',
                this.model.get('name'),
                false,
                '',
                true,
                [
                  {
                    rule: Joi.string().regex(/^[a-zA-Z]/),
                    msg: 'Collection name must always start with a letter.'
                  },
                  {
                    rule: Joi.string().regex(/^[a-zA-Z0-9\-_]*$/),
                    msg: 'Only Symbols "_" and "-" are allowed.'
                  },
                  {
                    rule: Joi.string().required(),
                    msg: 'No collection name given.'
                  }
                ]
              )
            );
          }

          var after = function () {
            tableContent.push(
              window.modalView.createReadOnlyEntry(
                'change-collection-id', 'ID', this.model.get('id'), ''
              )
            );
            tableContent.push(
              window.modalView.createReadOnlyEntry(
                'change-collection-type', 'Type', this.model.get('type'), ''
              )
            );
            tableContent.push(
              window.modalView.createReadOnlyEntry(
                'change-collection-status', 'Status', this.model.get('status'), ''
              )
            );
            buttons.push(
              window.modalView.createDeleteButton(
                'Delete',
                this.deleteCollection.bind(this)
              )
            );
            buttons.push(
              window.modalView.createDeleteButton(
                'Truncate',
                this.truncateCollection.bind(this)
              )
            );
            if (collectionIsLoaded) {
              buttons.push(
                window.modalView.createNotificationButton(
                  'Unload',
                  this.unloadCollection.bind(this)
                )
              );
            } else {
              buttons.push(
                window.modalView.createNotificationButton(
                  'Load',
                  this.loadCollection.bind(this)
                )
              );
            }

            buttons.push(
              window.modalView.createSuccessButton(
                'Save',
                this.saveModifiedCollection.bind(this)
              )
            );

            var tabBar = ['General', 'Indexes'];
            var templates = ['modalTable.ejs', 'indicesView.ejs'];

            window.modalView.show(
              templates,
              'Modify Collection',
              buttons,
              tableContent, null, null,
              this.events, null,
              tabBar
            );
            if (this.model.get('status') === 'loaded') {
              this.getIndex();
            } else {
              $($('#infoTab').children()[1]).remove();
            }
          }.bind(this);

          if (collectionIsLoaded) {
            var callback2 = function (error, data) {
              if (error) {
                arangoHelper.arangoError('Collection', 'Could not fetch properties');
              } else {
                var journalSize = data.journalSize / (1024 * 1024);
                var indexBuckets = data.indexBuckets;
                var wfs = data.waitForSync;

                tableContent.push(
                  window.modalView.createTextEntry(
                    'change-collection-size',
                    'Journal size',
                    journalSize,
                    'The maximal size of a journal or datafile (in MB). Must be at least 1.',
                    '',
                    true,
                    [
                      {
                        rule: Joi.string().allow('').optional().regex(/^[0-9]*$/),
                        msg: 'Must be a number.'
                      }
                    ]
                  )
                );

                tableContent.push(
                  window.modalView.createTextEntry(
                    'change-index-buckets',
                    'Index buckets',
                    indexBuckets,
                    'The number of index buckets for this collection. Must be at least 1 and a power of 2.',
                    '',
                    true,
                    [
                      {
                        rule: Joi.string().allow('').optional().regex(/^[1-9][0-9]*$/),
                        msg: 'Must be a number greater than 1 and a power of 2.'
                      }
                    ]
                  )
                );

                // prevent "unexpected sync method error"
                tableContent.push(
                  window.modalView.createSelectEntry(
                    'change-collection-sync',
                    'Wait for sync',
                    wfs,
                    'Synchronize to disk before returning from a create or update of a document.',
                    [{value: false, label: 'No'}, {value: true, label: 'Yes'}])
                );
              }
              after();
            };

            this.model.getProperties(callback2);
          } else {
            after();
          }
        }
      }.bind(this);
      window.isCoordinator(callback);
    },

    bindIndexEvents: function () {
      this.unbindIndexEvents();
      var self = this;

      $('#indexEditView #addIndex').bind('click', function () {
        self.toggleNewIndexView();

        $('#cancelIndex').unbind('click');
        $('#cancelIndex').bind('click', function () {
          self.toggleNewIndexView();
        });

        $('#createIndex').unbind('click');
        $('#createIndex').bind('click', function () {
          self.createIndex();
        });
      });

      $('#newIndexType').bind('change', function () {
        self.selectIndexType();
      });

      $('.deleteIndex').bind('click', function (e) {
        self.prepDeleteIndex(e);
      });

      $('#infoTab a').bind('click', function (e) {
        $('#indexDeleteModal').remove();
        if ($(e.currentTarget).html() === 'Indexes' && !$(e.currentTarget).parent().hasClass('active')) {
          $('#newIndexView').hide();
          $('#indexEditView').show();

          $('#modal-dialog .modal-footer .button-danger').hide();
          $('#modal-dialog .modal-footer .button-success').hide();
          $('#modal-dialog .modal-footer .button-notification').hide();
        // $('#addIndex').detach().appendTo('#modal-dialog .modal-footer')
        }
        if ($(e.currentTarget).html() === 'General' && !$(e.currentTarget).parent().hasClass('active')) {
          $('#modal-dialog .modal-footer .button-danger').show();
          $('#modal-dialog .modal-footer .button-success').show();
          $('#modal-dialog .modal-footer .button-notification').show();
          var elem2 = $('.index-button-bar2')[0];
          // $('#addIndex').detach().appendTo(elem)
          if ($('#cancelIndex').is(':visible')) {
            $('#cancelIndex').detach().appendTo(elem2);
            $('#createIndex').detach().appendTo(elem2);
          }
        }
      });
    },

    unbindIndexEvents: function () {
      $('#indexEditView #addIndex').unbind('click');
      $('#newIndexType').unbind('change');
      $('#infoTab a').unbind('click');
      $('.deleteIndex').unbind('click');
    /*
    //$('#documentsToolbar ul').unbind('click')
    this.markFilterToggle()
    this.changeEditMode(false)
    "click #documentsToolbar ul"    : "resetIndexForms"
    */
    },

    createInfoModal: function () {
      var callbackRev = function (error, revision, figures) {
        if (error) {
          arangoHelper.arangoError('Figures', 'Could not get revision.');
        } else {
          var buttons = [];
          var tableContent = {
            figures: figures,
            revision: revision,
            model: this.model
          };
          window.modalView.show(
            'modalCollectionInfo.ejs',
            'Collection: ' + this.model.get('name'),
            buttons,
            tableContent
          );
        }
      }.bind(this);

      var callback = function (error, data) {
        if (error) {
          arangoHelper.arangoError('Figures', 'Could not get figures.');
        } else {
          var figures = data;
          this.model.getRevision(callbackRev, figures);
        }
      }.bind(this);

      this.model.getFigures(callback);
    },
    // index functions
    resetIndexForms: function () {
      $('#indexHeader input').val('').prop('checked', false);
      $('#newIndexType').val('Geo').prop('selected', true);
      this.selectIndexType();
    },

    createIndex: function () {
      // e.preventDefault()
      var self = this;
      var indexType = $('#newIndexType').val();
      var postParameter = {};
      var fields;
      var unique;
      var sparse;

      switch (indexType) {
        case 'Geo':
          // HANDLE ARRAY building
          fields = $('#newGeoFields').val();
          var geoJson = self.checkboxToValue('#newGeoJson');
          var constraint = self.checkboxToValue('#newGeoConstraint');
          var ignoreNull = self.checkboxToValue('#newGeoIgnoreNull');
          postParameter = {
            type: 'geo',
            fields: self.stringToArray(fields),
            geoJson: geoJson,
            constraint: constraint,
            ignoreNull: ignoreNull
          };
          break;
        case 'Hash':
          fields = $('#newHashFields').val();
          unique = self.checkboxToValue('#newHashUnique');
          sparse = self.checkboxToValue('#newHashSparse');
          postParameter = {
            type: 'hash',
            fields: self.stringToArray(fields),
            unique: unique,
            sparse: sparse
          };
          break;
        case 'Fulltext':
          fields = ($('#newFulltextFields').val());
          var minLength = parseInt($('#newFulltextMinLength').val(), 10) || 0;
          postParameter = {
            type: 'fulltext',
            fields: self.stringToArray(fields),
            minLength: minLength
          };
          break;
        case 'Skiplist':
          fields = $('#newSkiplistFields').val();
          unique = self.checkboxToValue('#newSkiplistUnique');
          sparse = self.checkboxToValue('#newSkiplistSparse');
          postParameter = {
            type: 'skiplist',
            fields: self.stringToArray(fields),
            unique: unique,
            sparse: sparse
          };
          break;
      }
      var callback = function (error, msg) {
        if (error) {
          if (msg) {
            var message = JSON.parse(msg.responseText);
            arangoHelper.arangoError('Document error', message.errorMessage);
          } else {
            arangoHelper.arangoError('Document error', 'Could not create index.');
          }
        }
        self.refreshCollectionsView();
      };

      window.modalView.hide();
      // $($('#infoTab').children()[1]).find('a').click()
      self.model.createIndex(postParameter, callback);
    },

    lastTarget: null,

    prepDeleteIndex: function (e) {
      var self = this;
      this.lastTarget = e;

      this.lastId = $(this.lastTarget.currentTarget).parent().parent().first().children().first().text();
      // window.modalView.hide()

      // delete modal
      $('#modal-dialog .modal-footer').after(
        '<div id="indexDeleteModal" style="display:block;" class="alert alert-error modal-delete-confirmation">' +
        '<strong>Really delete?</strong>' +
        '<button id="indexConfirmDelete" class="button-danger pull-right modal-confirm-delete">Yes</button>' +
        '<button id="indexAbortDelete" class="button-neutral pull-right">No</button>' +
        '</div>'
      );
      $('#indexConfirmDelete').unbind('click');
      $('#indexConfirmDelete').bind('click', function () {
        $('#indexDeleteModal').remove();
        self.deleteIndex();
      });

      $('#indexAbortDelete').unbind('click');
      $('#indexAbortDelete').bind('click', function () {
        $('#indexDeleteModal').remove();
      });
    },

    refreshCollectionsView: function () {
      window.App.arangoCollectionsStore.fetch({
        success: function () {
          window.App.collectionsView.render();
        }
      });
    },

    deleteIndex: function () {
      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('Could not delete index');
          $("tr th:contains('" + this.lastId + "')").parent().children().last().html(
            '<span class="deleteIndex icon_arangodb_roundminus"' +
            ' data-original-title="Delete index" title="Delete index"></span>'
          );
          this.model.set('locked', false);
          this.refreshCollectionsView();
        } else if (!error && error !== undefined) {
          $("tr th:contains('" + this.lastId + "')").parent().remove();
          this.model.set('locked', false);
          this.refreshCollectionsView();
        }
        this.refreshCollectionsView();
      }.bind(this);

      this.model.set('locked', true);
      this.model.deleteIndex(this.lastId, callback);

      $("tr th:contains('" + this.lastId + "')").parent().children().last().html(
        '<i class="fa fa-circle-o-notch fa-spin"></i>'
      );
    },

    selectIndexType: function () {
      $('.newIndexClass').hide();
      var type = $('#newIndexType').val();
      $('#newIndexType' + type).show();
    },

    getIndex: function () {
      var callback = function (error, data) {
        if (error) {
          window.arangoHelper.arangoError('Index', data.errorMessage);
        } else {
          this.renderIndex(data);
        }
      }.bind(this);

      this.model.getIndex(callback);
    },

    renderIndex: function (data) {
      this.index = data;

      var cssClass = 'collectionInfoTh modal-text';
      if (this.index) {
        var fieldString = '';
        var actionString = '';

        _.each(this.index.indexes, function (v) {
          if (v.type === 'primary' || v.type === 'edge') {
            actionString = '<span class="icon_arangodb_locked" ' +
              'data-original-title="No action"></span>';
          } else {
            actionString = '<span class="deleteIndex icon_arangodb_roundminus" ' +
              'data-original-title="Delete index" title="Delete index"></span>';
          }

          if (v.fields !== undefined) {
            fieldString = v.fields.join(', ');
          }

          // cut index id
          var position = v.id.indexOf('/');
          var indexId = v.id.substr(position + 1, v.id.length);
          var selectivity = (
          v.hasOwnProperty('selectivityEstimate')
            ? (v.selectivityEstimate * 100).toFixed(2) + '%'
            : 'n/a'
          );
          var sparse = (v.hasOwnProperty('sparse') ? v.sparse : 'n/a');

          $('#collectionEditIndexTable').append(
            '<tr>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + indexId + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + v.type + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + v.unique + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + sparse + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + selectivity + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + fieldString + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + actionString + '</th>' +
            '</tr>'
          );
        });
      }
      this.bindIndexEvents();
    },

    toggleNewIndexView: function () {
      var elem = $('.index-button-bar2')[0];

      if ($('#indexEditView').is(':visible')) {
        $('#indexEditView').hide();
        $('#newIndexView').show();
        $('#cancelIndex').detach().appendTo('#modal-dialog .modal-footer');
        $('#createIndex').detach().appendTo('#modal-dialog .modal-footer');
      } else {
        $('#indexEditView').show();
        $('#newIndexView').hide();
        $('#cancelIndex').detach().appendTo(elem);
        $('#createIndex').detach().appendTo(elem);
      }

      arangoHelper.fixTooltips('.icon_arangodb, .arangoicon', 'right');
      this.resetIndexForms();
    },

    stringToArray: function (fieldString) {
      var fields = [];
      fieldString.split(',').forEach(function (field) {
        field = field.replace(/(^\s+|\s+$)/g, '');
        if (field !== '') {
          fields.push(field);
        }
      });
      return fields;
    },

    checkboxToValue: function (id) {
      return $(id).prop('checked');
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global _, Backbone, templateEngine, window, setTimeout, clearTimeout, arangoHelper, Joi, $ */

(function () {
  'use strict';
  window.CollectionsView = Backbone.View.extend({
    el: '#content',
    el2: '#collectionsThumbnailsIn',

    searchTimeout: null,
    refreshRate: 10000,

    template: templateEngine.createTemplate('collectionsView.ejs'),

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    refetchCollections: function () {
      var self = this;
      this.collection.fetch({
        cache: false,
        success: function () {
          self.checkLockedCollections();
        }
      });
    },

    checkLockedCollections: function () {
      var callback = function (error, lockedCollections) {
        var self = this;
        if (error) {
          console.log('Could not check locked collections');
        } else {
          this.collection.each(function (model) {
            model.set('locked', false);
          });

          _.each(lockedCollections, function (locked) {
            var model = self.collection.findWhere({
              id: locked.collection
            });
            model.set('locked', true);
            model.set('lockType', locked.type);
            model.set('desc', locked.desc);
          });

          this.collection.each(function (model) {
            if (!model.get('locked')) {
              $('#collection_' + model.get('name')).find('.corneredBadge').removeClass('loaded unloaded');
              $('#collection_' + model.get('name') + ' .corneredBadge').text(model.get('status'));
              $('#collection_' + model.get('name') + ' .corneredBadge').addClass(model.get('status'));
            }

            if (model.get('locked') || model.get('status') === 'loading') {
              $('#collection_' + model.get('name')).addClass('locked');
              if (model.get('locked')) {
                $('#collection_' + model.get('name')).find('.corneredBadge').removeClass('loaded unloaded');
                $('#collection_' + model.get('name')).find('.corneredBadge').addClass('inProgress');
                $('#collection_' + model.get('name') + ' .corneredBadge').text(model.get('desc'));
              } else {
                $('#collection_' + model.get('name') + ' .corneredBadge').text(model.get('status'));
              }
            } else {
              $('#collection_' + model.get('name')).removeClass('locked');
              $('#collection_' + model.get('name') + ' .corneredBadge').text(model.get('status'));
              if ($('#collection_' + model.get('name') + ' .corneredBadge').hasClass('inProgress')) {
                $('#collection_' + model.get('name') + ' .corneredBadge').text(model.get('status'));
                $('#collection_' + model.get('name') + ' .corneredBadge').removeClass('inProgress');
                $('#collection_' + model.get('name') + ' .corneredBadge').addClass('loaded');
              }
              if (model.get('status') === 'unloaded') {
                $('#collection_' + model.get('name') + ' .icon_arangodb_info').addClass('disabled');
              }
            }
          });
        }
      }.bind(this);

      window.arangoHelper.syncAndReturnUninishedAardvarkJobs('index', callback);
    },

    initialize: function () {
      var self = this;

      window.setInterval(function () {
        if (window.location.hash === '#collections' && window.VISIBLE) {
          self.refetchCollections();
        }
      }, self.refreshRate);
    },

    render: function () {
      this.checkLockedCollections();
      var dropdownVisible = false;

      if ($('#collectionsDropdown').is(':visible')) {
        dropdownVisible = true;
      }

      $(this.el).html(this.template.render({}));
      this.setFilterValues();

      if (dropdownVisible === true) {
        $('#collectionsDropdown2').show();
      }

      var searchOptions = this.collection.searchOptions;

      this.collection.getFiltered(searchOptions).forEach(function (arangoCollection) {
        $('#collectionsThumbnailsIn', this.el).append(new window.CollectionListItemView({
          model: arangoCollection,
          collectionsView: this
        }).render().el);
      }, this);

      // if type in collectionsDropdown2 is changed,
      // the page will be rerendered, so check the toggel button
      if ($('#collectionsDropdown2').css('display') === 'none') {
        $('#collectionsToggle').removeClass('activated');
      } else {
        $('#collectionsToggle').addClass('activated');
      }

      var length;
      arangoHelper.setCheckboxStatus('#collectionsDropdown');

      try {
        length = searchOptions.searchPhrase.length;
      } catch (ignore) {}
      $('#searchInput').val(searchOptions.searchPhrase);
      $('#searchInput').focus();
      $('#searchInput')[0].setSelectionRange(length, length);

      arangoHelper.fixTooltips('.icon_arangodb, .arangoicon', 'left');

      return this;
    },

    events: {
      'click #createCollection': 'createCollection',
      'keydown #searchInput': 'restrictToSearchPhraseKey',
      'change #searchInput': 'restrictToSearchPhrase',
      'click #searchSubmit': 'restrictToSearchPhrase',
      'click .checkSystemCollections': 'checkSystem',
      'click #checkLoaded': 'checkLoaded',
      'click #checkUnloaded': 'checkUnloaded',
      'click #checkDocument': 'checkDocument',
      'click #checkEdge': 'checkEdge',
      'click #sortName': 'sortName',
      'click #sortType': 'sortType',
      'click #sortOrder': 'sortOrder',
      'click #collectionsToggle': 'toggleView',
      'click .css-label': 'checkBoxes'
    },

    updateCollectionsView: function () {
      var self = this;
      this.collection.fetch({
        cache: false,
        success: function () {
          self.render();
        }
      });
    },

    toggleView: function () {
      $('#collectionsToggle').toggleClass('activated');
      $('#collectionsDropdown2').slideToggle(200);
    },

    checkBoxes: function (e) {
      // chrome bugfix
      var clicked = e.currentTarget.id;
      $('#' + clicked).click();
    },

    checkSystem: function () {
      var searchOptions = this.collection.searchOptions;
      var oldValue = searchOptions.includeSystem;

      searchOptions.includeSystem = ($('.checkSystemCollections').is(':checked') === true);

      if (oldValue !== searchOptions.includeSystem) {
        this.render();
      }
    },
    checkEdge: function () {
      var searchOptions = this.collection.searchOptions;
      var oldValue = searchOptions.includeEdge;

      searchOptions.includeEdge = ($('#checkEdge').is(':checked') === true);

      if (oldValue !== searchOptions.includeEdge) {
        this.render();
      }
    },
    checkDocument: function () {
      var searchOptions = this.collection.searchOptions;
      var oldValue = searchOptions.includeDocument;

      searchOptions.includeDocument = ($('#checkDocument').is(':checked') === true);

      if (oldValue !== searchOptions.includeDocument) {
        this.render();
      }
    },
    checkLoaded: function () {
      var searchOptions = this.collection.searchOptions;
      var oldValue = searchOptions.includeLoaded;

      searchOptions.includeLoaded = ($('#checkLoaded').is(':checked') === true);

      if (oldValue !== searchOptions.includeLoaded) {
        this.render();
      }
    },
    checkUnloaded: function () {
      var searchOptions = this.collection.searchOptions;
      var oldValue = searchOptions.includeUnloaded;

      searchOptions.includeUnloaded = ($('#checkUnloaded').is(':checked') === true);

      if (oldValue !== searchOptions.includeUnloaded) {
        this.render();
      }
    },
    sortName: function () {
      var searchOptions = this.collection.searchOptions;
      var oldValue = searchOptions.sortBy;

      searchOptions.sortBy = (($('#sortName').is(':checked') === true) ? 'name' : 'type');
      if (oldValue !== searchOptions.sortBy) {
        this.render();
      }
    },
    sortType: function () {
      var searchOptions = this.collection.searchOptions;
      var oldValue = searchOptions.sortBy;

      searchOptions.sortBy = (($('#sortType').is(':checked') === true) ? 'type' : 'name');
      if (oldValue !== searchOptions.sortBy) {
        this.render();
      }
    },
    sortOrder: function () {
      var searchOptions = this.collection.searchOptions;
      var oldValue = searchOptions.sortOrder;

      searchOptions.sortOrder = (($('#sortOrder').is(':checked') === true) ? -1 : 1);
      if (oldValue !== searchOptions.sortOrder) {
        this.render();
      }
    },

    setFilterValues: function () {
      var searchOptions = this.collection.searchOptions;
      $('#checkLoaded').attr('checked', searchOptions.includeLoaded);
      $('#checkUnloaded').attr('checked', searchOptions.includeUnloaded);
      $('.checkSystemCollections').attr('checked', searchOptions.includeSystem);
      $('#checkEdge').attr('checked', searchOptions.includeEdge);
      $('#checkDocument').attr('checked', searchOptions.includeDocument);
      $('#sortName').attr('checked', searchOptions.sortBy !== 'type');
      $('#sortType').attr('checked', searchOptions.sortBy === 'type');
      $('#sortOrder').attr('checked', searchOptions.sortOrder !== 1);
    },

    search: function () {
      var searchOptions = this.collection.searchOptions;
      var searchPhrase = $('#searchInput').val();
      if (searchPhrase === searchOptions.searchPhrase) {
        return;
      }
      searchOptions.searchPhrase = searchPhrase;

      this.render();
    },

    resetSearch: function () {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }

      var searchOptions = this.collection.searchOptions;
      searchOptions.searchPhrase = null;
    },

    restrictToSearchPhraseKey: function () {
      // key pressed in search box
      var self = this;

      // force a new a search
      this.resetSearch();

      self.searchTimeout = setTimeout(function () {
        self.search();
      }, 200);
    },

    restrictToSearchPhrase: function () {
      // force a new a search
      this.resetSearch();

      // search executed
      this.search();
    },

    createCollection: function (e) {
      e.preventDefault();
      var self = this;

      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_api/engine'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          self.engine = data;
          console.log(self.engine);
          self.createNewCollectionModal(data);
        },
        error: function () {
          arangoHelper.arangoError('Engine', 'Could not fetch ArangoDB Engine details.');
        }
      });
    },

    submitCreateCollection: function () {
      var self = this;
      var callbackCoord = function (error, isCoordinator) {
        if (error) {
          arangoHelper.arangoError('DB', 'Could not check coordinator state');
        } else {
          var collName = $('#new-collection-name').val();
          var collSize = $('#new-collection-size').val();
          var replicationFactor = $('#new-replication-factor').val();
          var collType = $('#new-collection-type').val();
          var collSync = $('#new-collection-sync').val();
          var shards = 1;
          var shardBy = [];

          if (replicationFactor === '') {
            replicationFactor = 1;
          }

          if (isCoordinator) {
            shards = $('#new-collection-shards').val();

            if (shards === '') {
              shards = 1;
            }
            shards = parseInt(shards, 10);
            if (shards < 1) {
              arangoHelper.arangoError(
                'Number of shards has to be an integer value greater or equal 1'
              );
              return 0;
            }
            shardBy = _.pluck($('#new-collection-shardBy').select2('data'), 'text');
            if (shardBy.length === 0) {
              shardBy.push('_key');
            }
          }
          if (collName.substr(0, 1) === '_') {
            arangoHelper.arangoError('No "_" allowed as first character!');
            return 0;
          }
          var isSystem = false;
          var wfs = (collSync === 'true');
          if (collSize > 0) {
            try {
              collSize = JSON.parse(collSize) * 1024 * 1024;
            } catch (e) {
              arangoHelper.arangoError('Please enter a valid number');
              return 0;
            }
          }
          if (collName === '') {
            arangoHelper.arangoError('No collection name entered!');
            return 0;
          }
          // no new system collections via webinterface
          // var isSystem = (collName.substr(0, 1) === '_')
          var callback = function (error, data) {
            if (error) {
              try {
                data = JSON.parse(data.responseText);
                arangoHelper.arangoError('Error', data.errorMessage);
              } catch (ignore) {}
            } else {
              this.updateCollectionsView();
            }
            window.modalView.hide();
          }.bind(this);

          var tmpObj = {
            collName: collName,
            wfs: wfs,
            isSystem: isSystem,
            replicationFactor: replicationFactor,
            collType: collType,
            shards: shards,
            shardBy: shardBy
          };
          if (self.engine.name !== 'rocksdb') {
            tmpObj.journalSize = collSize;
          }
          this.collection.newCollection(tmpObj, callback);
        }
      }.bind(this);

      window.isCoordinator(callbackCoord);
    },

    createNewCollectionModal: function () {
      var self = this;
      var callbackCoord2 = function (error, isCoordinator) {
        if (error) {
          arangoHelper.arangoError('DB', 'Could not check coordinator state');
        } else {
          var buttons = [];
          var tableContent = [];
          var advanced = {};
          var advancedTableContent = [];

          tableContent.push(
            window.modalView.createTextEntry(
              'new-collection-name',
              'Name',
              '',
              false,
              '',
              true,
              [
                {
                  rule: Joi.string().regex(/^[a-zA-Z]/),
                  msg: 'Collection name must always start with a letter.'
                },
                {
                  rule: Joi.string().regex(/^[a-zA-Z0-9\-_]*$/),
                  msg: 'Only symbols, "_" and "-" are allowed.'
                },
                {
                  rule: Joi.string().required(),
                  msg: 'No collection name given.'
                }
              ]
            )
          );
          tableContent.push(
            window.modalView.createSelectEntry(
              'new-collection-type',
              'Type',
              '',
              'The type of the collection to create.',
              [{value: 2, label: 'Document'}, {value: 3, label: 'Edge'}]
            )
          );

          if (isCoordinator) {
            tableContent.push(
              window.modalView.createTextEntry(
                'new-collection-shards',
                'Shards',
                '',
                'The number of shards to create. You cannot change this afterwards. ' +
                'Recommended: DBServers squared',
                '',
                true
              )
            );
            tableContent.push(
              window.modalView.createSelect2Entry(
                'new-collection-shardBy',
                'shardBy',
                '',
                'The keys used to distribute documents on shards. ' +
                'Type the key and press return to add it.',
                '_key',
                false
              )
            );
          }

          buttons.push(
            window.modalView.createSuccessButton(
              'Save',
              this.submitCreateCollection.bind(this)
            )
          );
          if (self.engine.name !== 'rocksdb') {
            advancedTableContent.push(
              window.modalView.createTextEntry(
                'new-collection-size',
                'Journal size',
                '',
                'The maximal size of a journal or datafile (in MB). Must be at least 1.',
                '',
                false,
                [
                  {
                    rule: Joi.string().allow('').optional().regex(/^[0-9]*$/),
                    msg: 'Must be a number.'
                  }
                ]
              )
            );
          }
          if (window.App.isCluster) {
            advancedTableContent.push(
              window.modalView.createTextEntry(
                'new-replication-factor',
                'Replication factor',
                '',
                'Numeric value. Must be at least 1. Total number of copies of the data in the cluster',
                '',
                false,
                [
                  {
                    rule: Joi.string().allow('').optional().regex(/^[0-9]*$/),
                    msg: 'Must be a number.'
                  }
                ]
              )
            );
          }
          advancedTableContent.push(
            window.modalView.createSelectEntry(
              'new-collection-sync',
              'Wait for sync',
              '',
              'Synchronize to disk before returning from a create or update of a document.',
              [{value: false, label: 'No'}, {value: true, label: 'Yes'}]
            )
          );
          advanced.header = 'Advanced';
          advanced.content = advancedTableContent;
          window.modalView.show(
            'modalTable.ejs',
            'New Collection',
            buttons,
            tableContent,
            advanced
          );

          // select2 workaround
          $('#s2id_new-collection-shardBy .select2-search-field input').on('focusout', function (e) {
            if ($('.select2-drop').is(':visible')) {
              if (!$('#select2-search-field input').is(':focus')) {
                window.setTimeout(function () {
                  $(e.currentTarget).parent().parent().parent().select2('close');
                }, 200);
              }
            }
          });
        }
      }.bind(this);

      window.isCoordinator(callbackCoord2);
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, window, arangoHelper, moment, nv, d3, prettyBytes */
/* global document, console, frontendConfig, Dygraph, _,templateEngine */

(function () {
  'use strict';

  function fmtNumber (n, nk) {
    if (n === undefined || n === null) {
      n = 0;
    }

    return n.toFixed(nk);
  }

  window.DashboardView = Backbone.View.extend({
    el: '#content',
    interval: 10000, // in milliseconds
    defaultTimeFrame: 20 * 60 * 1000, // 20 minutes in milliseconds
    defaultDetailFrame: 2 * 24 * 60 * 60 * 1000,
    reRender: true,
    reRenderDistribution: true,
    isVisible: true,
    distributionCharts: {
      totalTimeDistribution: null,
      dataTransferDistribution: null
    },
    residentChart: null,
    history: {},
    graphs: {},

    events: {
      // will be filled in initialize
      'click .subViewNavbar .subMenuEntry': 'toggleViews'
    },

    tendencies: {
      asyncPerSecondCurrent: [
        'asyncPerSecondCurrent', 'asyncPerSecondPercentChange'
      ],

      syncPerSecondCurrent: [
        'syncPerSecondCurrent', 'syncPerSecondPercentChange'
      ],

      clientConnectionsCurrent: [
        'clientConnectionsCurrent', 'clientConnectionsPercentChange'
      ],

      clientConnectionsAverage: [
        'clientConnections15M', 'clientConnections15MPercentChange'
      ],

      numberOfThreadsCurrent: [
        'numberOfThreadsCurrent', 'numberOfThreadsPercentChange'
      ],

      numberOfThreadsAverage: [
        'numberOfThreads15M', 'numberOfThreads15MPercentChange'
      ],

      virtualSizeCurrent: [
        'virtualSizeCurrent', 'virtualSizePercentChange'
      ],

      virtualSizeAverage: [
        'virtualSize15M', 'virtualSize15MPercentChange'
      ]
    },

    barCharts: {
      totalTimeDistribution: [
        'queueTimeDistributionPercent', 'requestTimeDistributionPercent'
      ],
      dataTransferDistribution: [
        'bytesSentDistributionPercent', 'bytesReceivedDistributionPercent'
      ]
    },

    barChartsElementNames: {
      queueTimeDistributionPercent: 'Queue',
      requestTimeDistributionPercent: 'Computation',
      bytesSentDistributionPercent: 'Bytes sent',
      bytesReceivedDistributionPercent: 'Bytes received'

    },

    getDetailFigure: function (e) {
      var figure = $(e.currentTarget).attr('id').replace(/ChartButton/g, '');
      return figure;
    },

    showDetail: function (e) {
      var self = this;
      var figure = this.getDetailFigure(e);
      var options;

      options = this.dygraphConfig.getDetailChartConfig(figure);

      this.getHistoryStatistics(figure);
      this.detailGraphFigure = figure;

      window.modalView.hideFooter = true;
      window.modalView.hide();
      window.modalView.show(
        'modalGraph.ejs',
        options.header,
        undefined,
        undefined,
        undefined,
        undefined,
        this.events
      );

      window.modalView.hideFooter = false;

      $('#modal-dialog').on('hidden', function () {
        self.hidden();
      });

      $('#modal-dialog').toggleClass('modal-chart-detail', true);

      options.height = $(window).height() * 0.7;
      options.width = $('.modal-inner-detail').width();

      // Reselect the labelsDiv. It was not known when requesting options
      options.labelsDiv = $(options.labelsDiv)[0];

      this.detailGraph = new Dygraph(
        document.getElementById('lineChartDetail'),
        this.history[this.server][figure],
        options
      );
    },

    hidden: function () {
      this.detailGraph.destroy();
      delete this.detailGraph;
      delete this.detailGraphFigure;
    },

    getCurrentSize: function (div) {
      if (div.substr(0, 1) !== '#') {
        div = '#' + div;
      }
      var height, width;
      $(div).attr('style', '');
      height = $(div).height();
      width = $(div).width();
      return {
        height: height,
        width: width
      };
    },

    prepareDygraphs: function () {
      var self = this; var options;
      this.dygraphConfig.getDashBoardFigures().forEach(function (f) {
        options = self.dygraphConfig.getDefaultConfig(f);
        var dimensions = self.getCurrentSize(options.div);
        options.height = dimensions.height;
        options.width = dimensions.width;
        self.graphs[f] = new Dygraph(
          document.getElementById(options.div),
          self.history[self.server][f] || [],
          options
        );
      });
    },

    initialize: function (options) {
      this.options = options;
      this.dygraphConfig = options.dygraphConfig;
      this.d3NotInitialized = true;
      this.events['click .dashboard-sub-bar-menu-sign'] = this.showDetail.bind(this);
      this.events['mousedown .dygraph-rangesel-zoomhandle'] = this.stopUpdating.bind(this);
      this.events['mouseup .dygraph-rangesel-zoomhandle'] = this.startUpdating.bind(this);

      this.serverInfo = options.serverToShow;

      if (!this.serverInfo) {
        this.server = '-local-';
      } else {
        this.server = this.serverInfo.target;
      }

      this.history[this.server] = {};
    },

    toggleViews: function (e) {
      var id = e.currentTarget.id.split('-')[0]; var self = this;
      var views = ['replication', 'requests', 'system'];

      _.each(views, function (view) {
        if (id !== view) {
          $('#' + view).hide();
        } else {
          $('#' + view).show();
          self.resize();
          $(window).resize();
        }
      });

      $('.subMenuEntries').children().removeClass('active');
      $('#' + id + '-statistics').addClass('active');

      window.setTimeout(function () {
        self.resize();
        $(window).resize();
      }, 200);
    },

    updateCharts: function () {
      var self = this;
      if (this.detailGraph) {
        this.updateLineChart(this.detailGraphFigure, true);
        return;
      }
      this.prepareD3Charts(this.isUpdating);
      this.prepareResidentSize(this.isUpdating);
      this.updateTendencies();
      Object.keys(this.graphs).forEach(function (f) {
        self.updateLineChart(f, false);
      });
    },

    updateTendencies: function () {
      var self = this; var map = this.tendencies;

      var tempColor = '';
      Object.keys(map).forEach(function (a) {
        var p = '';
        var v = 0;
        if (self.history.hasOwnProperty(self.server) &&
          self.history[self.server].hasOwnProperty(a)) {
          v = self.history[self.server][a][1];
        }

        if (v < 0) {
          tempColor = '#d05448';
        } else {
          tempColor = '#77DB99';
          p = '+';
        }
        if (self.history.hasOwnProperty(self.server) &&
          self.history[self.server].hasOwnProperty(a)) {
          $('#' + a).html(self.history[self.server][a][0] + '<br/><span class="dashboard-figurePer" style="color: ' +
            tempColor + ';">' + p + v + '%</span>');
        } else {
          $('#' + a).html('<br/><span class="dashboard-figurePer" style="color: ' +
            '#000' + ';">' + '<p class="dataNotReadyYet">data not ready yet</p>' + '</span>');
        }
      });
    },

    updateDateWindow: function (graph, isDetailChart) {
      var t = new Date().getTime();
      var borderLeft, borderRight;
      if (isDetailChart && graph.dateWindow_) {
        borderLeft = graph.dateWindow_[0];
        borderRight = t - graph.dateWindow_[1] - this.interval * 5 > 0
          ? graph.dateWindow_[1] : t;
        return [borderLeft, borderRight];
      }
      return [t - this.defaultTimeFrame, t];
    },

    updateLineChart: function (figure, isDetailChart) {
      var g = isDetailChart ? this.detailGraph : this.graphs[figure];
      var opts = {
        file: this.history[this.server][figure],
        dateWindow: this.updateDateWindow(g, isDetailChart)
      };

      // round line chart values to 10th decimals
      var pointer = 0; var dates = [];
      _.each(opts.file, function (value) {
        var rounded = value[0].getSeconds() - (value[0].getSeconds() % 10);
        opts.file[pointer][0].setSeconds(rounded);
        dates.push(opts.file[pointer][0]);

        pointer++;
      });
      // get min/max dates of array
      var maxDate = new Date(Math.max.apply(null, dates));
      var minDate = new Date(Math.min.apply(null, dates));
      var tmpDate = new Date(minDate.getTime());
      var missingDates = [];
      var tmpDatesComplete = [];

      while (tmpDate < maxDate) {
        tmpDate = new Date(tmpDate.setSeconds(tmpDate.getSeconds() + 10));
        tmpDatesComplete.push(tmpDate);
      }

      // iterate through all date ranges
      _.each(tmpDatesComplete, function (date) {
        var tmp = false;

        // iterate through all available real date values
        _.each(opts.file, function (availableDates) {
          // if real date is inside date range
          if (Math.floor(date.getTime() / 1000) === Math.floor(availableDates[0].getTime() / 1000)) {
            tmp = true;
          }
        });

        if (tmp === false) {
          // a value is missing
          if (date < new Date()) {
            missingDates.push(date);
          }
        }
      });

      _.each(missingDates, function (date) {
        if (figure === 'systemUserTime' ||
          figure === 'requests' ||
          figure === 'pageFaults' ||
          figure === 'dataTransfer') {
          opts.file.push([date, 0, 0]);
        }
        if (figure === 'totalTime') {
          opts.file.push([date, 0, 0, 0]);
        }
      });

      if (opts.file === undefined) {
        $('#loadingScreen span').text('Statistics not ready yet. Waiting.');

        if (window.location.hash === '#dashboard' || window.location.hash === '' || window.location.hash === '#') {
          $('#loadingScreen').show();
          $('#content').hide();
        }
      } else {
        $('#content').show();
        $('#loadingScreen').hide();

        // sort for library
        opts.file.sort(function (a, b) {
          return new Date(b[0]) - new Date(a[0]);
        });

        g.updateOptions(opts);
      }
      $(window).trigger('resize');
      this.resize();
    },

    mergeDygraphHistory: function (newData, i) {
      var self = this;
      var valueList;

      this.dygraphConfig.getDashBoardFigures(true).forEach(function (f) {
        // check if figure is known
        if (!self.dygraphConfig.mapStatToFigure[f]) {
          return;
        }

        // need at least an empty history
        if (!self.history[self.server][f]) {
          self.history[self.server][f] = [];
        }

        // generate values for this key
        valueList = [];

        self.dygraphConfig.mapStatToFigure[f].forEach(function (a) {
          if (!newData[a]) {
            return;
          }

          if (a === 'times') {
            valueList.push(new Date(newData[a][i] * 1000));
          } else {
            valueList.push(newData[a][i]);
          }
        });

        // if we found at list one value besides times, then use the entry
        if (valueList.length > 1) {
          // HTTP requests combine all types to one
          // 0: date, 1: GET", 2: "PUT", 3: "POST", 4: "DELETE", 5: "PATCH",
          // 6: "HEAD", 7: "OPTIONS", 8: "OTHER"
          //
          var read = 0; var write = 0;
          if (valueList.length === 9) {
            read += valueList[1];
            read += valueList[6];
            read += valueList[7];
            read += valueList[8];

            write += valueList[2];
            write += valueList[3];
            write += valueList[4];
            write += valueList[5];

            valueList = [valueList[0], read, write];
          }

          self.history[self.server][f].unshift(valueList);
        }
      });
    },

    cutOffHistory: function (f, cutoff) {
      var self = this;
      var h = self.history[self.server][f];

      while (h.length !== 0) {
        if (h[h.length - 1][0] >= cutoff) {
          break;
        }

        h.pop();
      }
    },

    cutOffDygraphHistory: function (cutoff) {
      var self = this;
      var cutoffDate = new Date(cutoff);

      this.dygraphConfig.getDashBoardFigures(true).forEach(function (f) {
        // check if figure is known
        if (!self.dygraphConfig.mapStatToFigure[f]) {
          return;
        }

        // history must be non-empty
        if (!self.history[self.server][f]) {
          return;
        }

        self.cutOffHistory(f, cutoffDate);
      });
    },

    mergeHistory: function (newData) {
      var self = this; var i;

      for (i = 0; i < newData.times.length; ++i) {
        this.mergeDygraphHistory(newData, i);
      }

      this.cutOffDygraphHistory(new Date().getTime() - this.defaultTimeFrame);

      // convert tendency values
      Object.keys(this.tendencies).forEach(function (a) {
        var n1 = 1;
        var n2 = 1;

        if (a === 'virtualSizeCurrent' || a === 'virtualSizeAverage') {
          newData[self.tendencies[a][0]] /= (1024 * 1024 * 1024);
          n1 = 2;
        } else if (a === 'clientConnectionsCurrent') {
          n1 = 0;
        } else if (a === 'numberOfThreadsCurrent') {
          n1 = 0;
        }

        self.history[self.server][a] = [
          fmtNumber(newData[self.tendencies[a][0]], n1),
          fmtNumber(newData[self.tendencies[a][1]] * 100, n2)
        ];
      });

      // update distribution
      Object.keys(this.barCharts).forEach(function (a) {
        self.history[self.server][a] = self.mergeBarChartData(self.barCharts[a], newData);
      });

      // update physical memory
      self.history[self.server].physicalMemory = newData.physicalMemory;
      self.history[self.server].residentSizeCurrent = newData.residentSizeCurrent;
      self.history[self.server].residentSizePercent = newData.residentSizePercent;

      // generate chart description
      self.history[self.server].residentSizeChart = [
        {
          'key': '',
          'color': this.dygraphConfig.colors[1],
          'values': [
            {
              label: 'used',
              value: newData.residentSizePercent * 100
            }
          ]
        },
        {
          'key': '',
          'color': this.dygraphConfig.colors[2],
          'values': [
            {
              label: 'used',
              value: 100 - newData.residentSizePercent * 100
            }
          ]
        }
      ];

      // remember next start
      this.nextStart = newData.nextStart;
    },

    mergeBarChartData: function (attribList, newData) {
      var i;
      var v1 = {
        'key': this.barChartsElementNames[attribList[0]],
        'color': this.dygraphConfig.colors[1],
        'values': []
      };
      var v2 = {
        'key': this.barChartsElementNames[attribList[1]],
        'color': this.dygraphConfig.colors[2],
        'values': []
      };

      for (i = newData[attribList[0]].values.length - 1; i >= 0; --i) {
        v1.values.push({
          label: this.getLabel(newData[attribList[0]].cuts, i),
          value: newData[attribList[0]].values[i]
        });
        v2.values.push({
          label: this.getLabel(newData[attribList[1]].cuts, i),
          value: newData[attribList[1]].values[i]
        });
      }
      return [v1, v2];
    },

    getLabel: function (cuts, counter) {
      if (!cuts[counter]) {
        return '>' + cuts[counter - 1];
      }
      return counter === 0 ? '0 - ' +
      cuts[counter] : cuts[counter - 1] + ' - ' + cuts[counter];
    },

    renderReplicationStatistics: function (object) {
      $('#repl-numbers table tr:nth-child(1) > td:nth-child(2)').html(object.state.totalEvents);
      $('#repl-numbers table tr:nth-child(2) > td:nth-child(2)').html(object.state.totalRequests);
      $('#repl-numbers table tr:nth-child(3) > td:nth-child(2)').html(object.state.totalFailedConnects);

      if (object.state.lastAppliedContinuousTick) {
        $('#repl-ticks table tr:nth-child(1) > td:nth-child(2)').html(object.state.lastAppliedContinuousTick);
      } else {
        $('#repl-ticks table tr:nth-child(1) > td:nth-child(2)').html('no data available').addClass('no-data');
      }
      if (object.state.lastProcessedContinuousTick) {
        $('#repl-ticks table tr:nth-child(2) > td:nth-child(2)').html(object.state.lastProcessedContinuousTick);
      } else {
        $('#repl-ticks table tr:nth-child(2) > td:nth-child(2)').html('no data available').addClass('no-data');
      }
      if (object.state.lastAvailableContinuousTick) {
        $('#repl-ticks table tr:nth-child(3) > td:nth-child(2)').html(object.state.lastAvailableContinuousTick);
      } else {
        $('#repl-ticks table tr:nth-child(3) > td:nth-child(2)').html('no data available').addClass('no-data');
      }

      $('#repl-progress table tr:nth-child(1) > td:nth-child(2)').html(object.state.progress.message);
      $('#repl-progress table tr:nth-child(2) > td:nth-child(2)').html(object.state.progress.time);
      $('#repl-progress table tr:nth-child(3) > td:nth-child(2)').html(object.state.progress.failedConnects);
    },

    getReplicationStatistics: function () {
      var self = this;

      $.ajax(
        arangoHelper.databaseUrl('/_api/replication/applier-state'),
        {async: true}
      ).done(
        function (d) {
          if (d.hasOwnProperty('state')) {
            var running;
            if (d.state.running) {
              running = 'active';
            } else {
              running = 'inactive';
            }
            running = '<span class="state">' + running + '</span>';
            $('#replication-chart .dashboard-sub-bar').html('Replication ' + running);

            self.renderReplicationStatistics(d);
          }
        });
    },

    checkState: function () {
      var self = this;

      // if view is currently not active (#dashboard = standalone, #node = cluster)
      if (window.location.hash === '#dashboard' || window.location.hash.substr(0, 5) === '#node') {
        self.isVisible = true;
      } else {
        // chart data state
        self.residentChart = null;

        // render state
        self.isVisible = false;
        self.reRender = true;
        self.reRenderDistribution = false;
      }
    },

    renderStatisticBox: function (name, value, title, rowCount) {
      // box already rendered, just update value
      if ($('#node-info #nodeattribute-' + name).length) {
        $('#node-info #nodeattribute-' + name).html(value);
      } else {
        var elem = '';
        if (rowCount === 6) {
          elem += '<div class="pure-u-1-2 pure-u-md-1-3 pure-u-lg-1-6" style="background-color: #fff">';
        } else {
          elem += '<div class="pure-u-1-2 pure-u-md-1-4" style="background-color: #fff">';
        }
        elem += '<div class="valueWrapper">';
        if (title) {
          elem += '<div id="nodeattribute-' + name + '" class="value tippy" title="' + value + '">' + value + '</div>';
        } else {
          elem += '<div id="nodeattribute-' + name + '" class="value">' + value + '</div>';
        }
        elem += '<div class="graphLabel">' + name + '</div>';
        elem += '</div>';
        elem += '</div>';
        $('#node-info').append(elem);
      }
    },

    getNodeInfo: function () {
      var self = this;

      if (frontendConfig.isCluster) {
        // Cluster node
        if (this.serverInfo.isDBServer) {
          this.renderStatisticBox('Role', 'DBServer', undefined, 6);
        } else {
          this.renderStatisticBox('Role', 'Coordinator', undefined, 6);
        }

        this.renderStatisticBox('Host', this.serverInfo.raw, this.serverInfo.raw, 6);
        /*
        if (this.serverInfo.endpoint) {
          this.renderStatisticBox('Protocol', this.serverInfo.endpoint.substr(0, this.serverInfo.endpoint.indexOf('/') - 1));
        } else {
          this.renderStatisticBox('Protocol', 'Error');
        }

        this.renderStatisticBox('ID', this.serverInfo.target, this.serverInfo.target);
        */

        // get node version + license
        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/clusterNodeVersion?ServerID=' + this.serverInfo.target),
          contentType: 'application/json',
          processData: false,
          success: function (data) {
            self.renderStatisticBox('Version', frontendConfig.version.version, undefined, 6);
            self.renderStatisticBox('Edition', frontendConfig.version.license, undefined, 6);
          },
          error: function (data) {
            self.renderStatisticBox('Version', 'Error');
            self.renderStatisticBox('Edition', 'Error');
          }
        });

        // get server engine
        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/clusterNodeEngine?ServerID=' + this.serverInfo.target),
          contentType: 'application/json',
          processData: false,
          success: function (data) {
            self.renderStatisticBox('Engine', data.name, undefined, 6);
          },
          error: function (data) {
            self.renderStatisticBox('Engine', 'Error', undefined, 6);
          }
        });

        // get server statistics
        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/clusterNodeStats?ServerID=' + this.serverInfo.target),
          contentType: 'application/json',
          processData: false,
          success: function (data) {
            self.renderStatisticBox('Uptime', moment.duration(data.server.uptime, 'seconds').humanize(), undefined, 6);
          },
          error: function (data) {
            self.renderStatisticBox('Uptime', 'Error', undefined, 6);
          }
        });
      } else {
        // Standalone
        // version + license
        this.renderStatisticBox('Version', frontendConfig.version.version);
        this.renderStatisticBox('Edition', frontendConfig.version.license);

        // engine status
        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_api/engine'),
          contentType: 'application/json',
          processData: false,
          success: function (data) {
            self.renderStatisticBox('Engine', data.name);
          },
          error: function () {
            self.renderStatisticBox('Engine', 'Error');
          }
        });

        // uptime status
        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/statistics'),
          contentType: 'application/json',
          processData: false,
          success: function (data) {
            self.renderStatisticBox('Uptime', moment.duration(data.server.uptime, 'seconds').humanize());
          },
          error: function () {
            self.renderStatisticBox('Uptime', 'Error');
          }
        });
      }
      arangoHelper.createTooltips();
    },

    getStatistics: function (callback, modalView) {
      var self = this;
      self.checkState();

      var url = arangoHelper.databaseUrl('/_admin/aardvark/statistics/short', '_system');
      var urlParams = '?start=';

      if (self.nextStart) {
        urlParams += self.nextStart;
      } else {
        urlParams += (new Date().getTime() - self.defaultTimeFrame) / 1000;
      }

      if (self.server !== '-local-') {
        urlParams += '&type=short&DBserver=' + self.serverInfo.target;

        if (!self.history.hasOwnProperty(self.server)) {
          self.history[self.server] = {};
        }
      }

      $.ajax(
        url + urlParams,
        {
          async: true,
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true
        }
      ).done(
        function (d) {
          if (d.times.length > 0) {
            self.isUpdating = true;
            self.mergeHistory(d);
          }
          if (self.isUpdating === false) {
            return;
          }
          if (callback) {
            callback(d.enabled, modalView);
          }
          self.updateCharts();
        }).error(function (e) {
          console.log('stat fetch req error:' + e);
        });

      this.getReplicationStatistics();
    },

    getHistoryStatistics: function (figure) {
      var self = this;
      var url = 'statistics/long';

      var urlParams = '?filter=' + this.dygraphConfig.mapStatToFigure[figure].join();

      if (self.server !== '-local-') {
        url = self.server.endpoint + arangoHelper.databaseUrl('/_admin/aardvark/statistics/cluster');
        urlParams += '&type=long&DBserver=' + self.server.target;

        if (!self.history.hasOwnProperty(self.server)) {
          self.history[self.server] = {};
        }
      }

      var origin = window.location.href.split('/');
      var preUrl = origin[0] + '//' + origin[2] + '/' + origin[3] + '/_system/' + origin[5] + '/' + origin[6] + '/';

      $.ajax(
        preUrl + url + urlParams,
        {async: true}
      ).done(
        function (d) {
          var i;

          self.history[self.server][figure] = [];

          for (i = 0; i < d.times.length; ++i) {
            self.mergeDygraphHistory(d, i, true);
          }
        }
      );
    },

    addEmptyDataLabels: function () {
      if ($('.dataNotReadyYet').length === 0) {
        $('#dataTransferDistribution').prepend('<p class="dataNotReadyYet"> data not ready yet </p>');
        $('#totalTimeDistribution').prepend('<p class="dataNotReadyYet"> data not ready yet </p>');
        $('.dashboard-bar-chart-title').append('<p class="dataNotReadyYet"> data not ready yet </p>');
      }
    },

    removeEmptyDataLabels: function () {
      $('.dataNotReadyYet').remove();
    },

    prepareResidentSize: function (update) {
      var self = this;

      var dimensions = this.getCurrentSize('#residentSizeChartContainer');

      var current = self.history[self.server].residentSizeCurrent / 1024 / 1024;

      var currentA = '';

      if (current < 1025) {
        currentA = fmtNumber(current, 2) + ' MB';
      } else {
        currentA = fmtNumber(current / 1024, 2) + ' GB';
      }

      var currentP = fmtNumber(self.history[self.server].residentSizePercent * 100, 2);
      var data;

      if (self.history[self.server].physicalMemory) {
        this.removeEmptyDataLabels();
        data = [prettyBytes(self.history[self.server].physicalMemory)];
      } else {
        this.addEmptyDataLabels();
        return;
      }

      if (self.history[self.server].residentSizeChart === undefined) {
        this.addEmptyDataLabels();
        return;
      } else {
        this.removeEmptyDataLabels();
      }

      if (self.reRender && self.isVisible) {
        nv.addGraph(function () {
          self.residentChart = nv.models.multiBarHorizontalChart()
          .x(function (d) {
            return d.label;
          })
          .y(function (d) {
            return d.value;
          })
          .width(dimensions.width)
          .height(dimensions.height)
          .margin({
            top: ($('residentSizeChartContainer').outerHeight() - $('residentSizeChartContainer').height()) / 2,
            right: 1,
            bottom: ($('residentSizeChartContainer').outerHeight() - $('residentSizeChartContainer').height()) / 2,
            left: 1
          })
          .showValues(false)
          .showYAxis(false)
          .showXAxis(false)
          // .transitionDuration(100)
          // .tooltip(false)
          .showLegend(false)
          .showControls(false)
          .stacked(true);

          self.residentChart.yAxis
          .tickFormat(function (d) {
            return d + '%';
          })
          .showMaxMin(false);
          self.residentChart.xAxis.showMaxMin(false);

          d3.select('#residentSizeChart svg')
          .datum(self.history[self.server].residentSizeChart)
          .call(self.residentChart);

          d3.select('#residentSizeChart svg').select('.nv-zeroLine').remove();

          if (update) {
            d3.select('#residentSizeChart svg').select('#total').remove();
            d3.select('#residentSizeChart svg').select('#percentage').remove();
          }

          d3.select('.dashboard-bar-chart-title .percentage')
          .html(currentA + ' (' + currentP + ' %)');

          d3.select('.dashboard-bar-chart-title .absolut')
          .html(data[0]);

          nv.utils.windowResize(self.residentChart.update);

          return self.residentChart;
        }, function () {
          d3.selectAll('#residentSizeChart .nv-bar').on('click',
            function () {
              // no idea why this has to be empty, well anyways...
            }
           );
        });
        self.reRender = false;
      } else {
        if (self.residentChart) {
          // TODO FIX ME: THE MAIN FUNCTION MUCH TO OFTEN CALLED

          if (self.isVisible) {
            // update widths
            self.residentChart.width(dimensions.width);
            self.residentChart.height(dimensions.height);

            // update labels
            d3.select('.dashboard-bar-chart-title .percentage')
            .html(currentA + ' (' + currentP + ' %)');
            d3.select('.dashboard-bar-chart-title .absolut')
            .html(data[0]);

            // update data
            d3.select('#residentSizeChart svg')
            .datum(self.history[self.server].residentSizeChart)
            .call(self.residentChart);

            // trigger resize
            nv.utils.windowResize(self.residentChart.update);
          }
        }
      }
    },

    prepareD3Charts: function (update) {
      var self = this;

      var barCharts = {
        totalTimeDistribution: [
          'queueTimeDistributionPercent', 'requestTimeDistributionPercent'],
        dataTransferDistribution: [
          'bytesSentDistributionPercent', 'bytesReceivedDistributionPercent']
      };

      if (this.d3NotInitialized) {
        update = false;
        this.d3NotInitialized = false;
      }

      _.each(Object.keys(barCharts), function (k) {
        var dimensions = self.getCurrentSize('#' + k +
          'Container .dashboard-interior-chart');

        var selector = '#' + k + 'Container svg';

        if (self.history[self.server].residentSizeChart === undefined) {
          self.addEmptyDataLabels();
          // initialize with 0 values then
          // return;
        } else {
          self.removeEmptyDataLabels();
        }

        if (self.reRenderDistribution && self.isVisible) {
          // append custom legend
          $('#' + k + 'Container').append(
            '<div class="dashboard-legend-inner">' +
              '<span style="color: rgb(238, 190, 77);"><div style="display: inline-block; position: relative; bottom: .5ex; padding-left: 1em; height: 1px; border-bottom: 2px solid rgb(238, 190, 77);"></div> Bytes sent</span>' +
              '<span style="color: rgb(142, 209, 220);"><div style="display: inline-block; position: relative; bottom: .5ex; padding-left: 1em; height: 1px; border-bottom: 2px solid rgb(142, 209, 220);"></div> Bytes received</span>' +
                '</div>'
          );

          nv.addGraph(function () {
            var tickMarks = [0, 0.25, 0.5, 0.75, 1];
            var marginLeft = 75;
            var marginBottom = 23;
            var bottomSpacer = 6;

            if (dimensions.width < 219) {
              tickMarks = [0, 0.5, 1];
              marginLeft = 72;
              marginBottom = 21;
              bottomSpacer = 5;
            } else if (dimensions.width < 299) {
              tickMarks = [0, 0.3334, 0.6667, 1];
              marginLeft = 77;
            } else if (dimensions.width < 379) {
              marginLeft = 87;
            } else if (dimensions.width < 459) {
              marginLeft = 95;
            } else if (dimensions.width < 539) {
              marginLeft = 100;
            } else if (dimensions.width < 619) {
              marginLeft = 105;
            }

            self.distributionCharts[k] = nv.models.multiBarHorizontalChart()
            .x(function (d) {
              return d.label;
            })
            .y(function (d) {
              return d.value;
            })
            .width(dimensions.width)
            .height(dimensions.height)
            .margin({
              top: 5,
              right: 20,
              bottom: marginBottom,
              left: marginLeft
            })
            .showValues(false)
            .showYAxis(true)
            .showXAxis(true)
            // .transitionDuration(100)
            // .tooltips(false)
            .showLegend(false)
            .showControls(false)
            .forceY([0, 1]);

            self.distributionCharts[k].yAxis
            .showMaxMin(false);

            d3.select('.nv-y.nv-axis')
            .selectAll('text')
            .attr('transform', 'translate (0, ' + bottomSpacer + ')');

            self.distributionCharts[k].yAxis
            .tickValues(tickMarks)
            .tickFormat(function (d) {
              return fmtNumber(((d * 100 * 100) / 100), 0) + '%';
            });

            if (self.history[self.server][k]) {
              d3.select(selector)
              .datum(self.history[self.server][k])
              .call(self.distributionCharts[k]);
            } else {
              d3.select(selector)
              .datum([])
              .call(self.distributionCharts[k]);
            }

            nv.utils.windowResize(self.distributionCharts[k].update);

            return self.distributionCharts[k];
          }, function () {
            d3.selectAll(selector + ' .nv-bar').on('click',
              function () {
                // no idea why this has to be empty, well anyways...
              }
            );
          });
        } else {
          if (self.distributionCharts[k]) {
            // TODO FIX ME: THE MAIN FUNCTION MUCH TO OFTEN CALLED

            if (self.isVisible) {
              // update widths
              self.distributionCharts[k].width(dimensions.width);
              self.distributionCharts[k].height(dimensions.height);

              // update data
              if (self.history[self.server][k]) {
                d3.select(selector)
                .datum(self.history[self.server][k])
                .call(self.distributionCharts[k]);
              } else {
                d3.select(selector)
                .datum([])
                .call(self.distributionCharts[k]);
              }

              // trigger resize
              nv.utils.windowResize(self.distributionCharts[k].update);
            }
          }
        }
      });
      if (self.reRenderDistribution && self.isVisible) {
        self.reRenderDistribution = false;
      }
    },

    stopUpdating: function () {
      this.isUpdating = false;
    },

    startUpdating: function () {
      var self = this;
      if (self.timer) {
        return;
      }
      self.timer = window.setInterval(function () {
        if (window.App.isCluster) {
          if (window.location.hash.indexOf(self.serverInfo.target) > -1) {
            self.getStatistics();
          }
        } else {
          self.getStatistics();
        }
      },
        self.interval
      );
    },

    resize: function () {
      if (!this.isUpdating) {
        return;
      }
      var self = this; var dimensions;
      _.each(this.graphs, function (g) {
        dimensions = self.getCurrentSize(g.maindiv_.id);
        g.resize(dimensions.width, dimensions.height);
      });
      if (this.detailGraph) {
        dimensions = this.getCurrentSize(this.detailGraph.maindiv_.id);
        this.detailGraph.resize(dimensions.width, dimensions.height);
      }
      this.prepareD3Charts(true);
      this.prepareResidentSize(true);
    },

    template: templateEngine.createTemplate('dashboardView.ejs'),

    render: function (modalView) {
      if (this.serverInfo === undefined) {
        this.serverInfo = {
          isDBServer: false
        };
      }
      if (this.serverInfo.isDBServer !== true) {
        this.delegateEvents(this.events);
        var callback = function (enabled, modalView) {
          if (!modalView) {
            $(this.el).html(this.template.render({
              hideStatistics: false
            }));
            this.getNodeInfo();
          }

          if (!enabled || frontendConfig.db !== '_system') {
            $(this.el).html('');
            if (this.server) {
              $(this.el).append(
                '<div style="color: red">Server statistics (' + this.server + ') are disabled.</div>'
              );
            } else {
              $(this.el).append(
                '<div style="color: red">Server statistics are disabled.</div>'
              );
            }
            return;
          }

          this.prepareDygraphs();
          if (this.isUpdating) {
            this.prepareD3Charts();
            this.prepareResidentSize();
            this.updateTendencies();
            $(window).trigger('resize');
          }
          this.startUpdating();
          $(window).resize();
        }.bind(this);

        var errorFunction = function () {
          $(this.el).html('');
          $('.contentDiv').remove();
          $('.headerBar').remove();
          $('.dashboard-headerbar').remove();
          $('.dashboard-row').remove();
          $(this.el).append(
            '<div style="color: red">You do not have permission to view this page.</div>'
          );
          $(this.el).append(
            '<div style="color: red">You can switch to \'_system\' to see the dashboard.</div>'
          );
        }.bind(this);

        if (frontendConfig.db !== '_system') {
          errorFunction();
          return;
        }

        var callback2 = function (error, authorized) {
          if (!error) {
            if (!authorized) {
              errorFunction();
            } else {
              this.getStatistics(callback, modalView);
            }
          }
        }.bind(this);

        if (window.App.currentDB.get('name') === undefined) {
          window.setTimeout(function () {
            if (window.App.currentDB.get('name') !== '_system') {
              errorFunction();
              return;
            }
            // check if user has _system permission
            this.options.database.hasSystemAccess(callback2);
          }.bind(this), 300);
        } else {
          // check if user has _system permission
          this.options.database.hasSystemAccess(callback2);
        }
      } else {
        $(this.el).html(this.template.render({
          hideStatistics: true
        }));
        // hide menu entries
        $('.subMenuEntry').remove();
        this.getNodeInfo();
      }
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global window, document, Backbone, $, arangoHelper, templateEngine, Joi */
(function () {
  'use strict';

  window.DatabaseView = Backbone.View.extend({
    users: null,
    el: '#content',

    template: templateEngine.createTemplate('databaseView.ejs'),

    dropdownVisible: false,

    currentDB: '',

    events: {
      'click #createDatabase': 'createDatabase',
      'click #submitCreateDatabase': 'submitCreateDatabase',
      'click .editDatabase': 'editDatabase',
      'click #userManagementView .icon': 'editDatabase',
      'click #selectDatabase': 'updateDatabase',
      'click #submitDeleteDatabase': 'submitDeleteDatabase',
      'click .contentRowInactive a': 'changeDatabase',
      'keyup #databaseSearchInput': 'search',
      'click #databaseSearchSubmit': 'search',
      'click #databaseToggle': 'toggleSettingsDropdown',
      'click .css-label': 'checkBoxes',
      'click #dbSortDesc': 'sorting'
    },

    sorting: function () {
      if ($('#dbSortDesc').is(':checked')) {
        this.collection.setSortingDesc(true);
      } else {
        this.collection.setSortingDesc(false);
      }

      if ($('#databaseDropdown').is(':visible')) {
        this.dropdownVisible = true;
      } else {
        this.dropdownVisible = false;
      }

      this.render();
    },

    initialize: function () {
      this.collection.fetch({
        async: true,
        cache: false
      });
    },

    checkBoxes: function (e) {
      // chrome bugfix
      var clicked = e.currentTarget.id;
      $('#' + clicked).click();
    },

    render: function () {
      var self = this;

      var callback = function (error, db) {
        if (error) {
          arangoHelper.arangoError('DB', 'Could not get current db properties');
        } else {
          self.currentDB = db;

          self.collection.fetch({
            success: function () {
              // sorting
              self.collection.sort();

              $(self.el).html(self.template.render({
                collection: self.collection,
                searchString: '',
                currentDB: self.currentDB
              }));

              if (self.dropdownVisible === true) {
                $('#dbSortDesc').attr('checked', self.collection.sortOptions.desc);
                $('#databaseToggle').toggleClass('activated');
                $('#databaseDropdown2').show();
              }

              arangoHelper.setCheckboxStatus('#databaseDropdown');

              self.replaceSVGs();
            }
          });
        }
      };

      this.collection.getCurrentDatabase(callback);

      return this;
    },

    toggleSettingsDropdown: function () {
      // apply sorting to checkboxes
      $('#dbSortDesc').attr('checked', this.collection.sortOptions.desc);

      $('#databaseToggle').toggleClass('activated');
      $('#databaseDropdown2').slideToggle(200);
    },

    selectedDatabase: function () {
      return $('#selectDatabases').val();
    },

    handleError: function (status, text, dbname) {
      if (status === 409) {
        arangoHelper.arangoError('DB', 'Database ' + dbname + ' already exists.');
        return;
      }
      if (status === 400) {
        arangoHelper.arangoError('DB', 'Invalid Parameters');
        return;
      }
      if (status === 403) {
        arangoHelper.arangoError('DB', 'Insufficent rights. Execute this from _system database');
        return;
      }
    },

    validateDatabaseInfo: function (db, user) {
      if (user === '') {
        arangoHelper.arangoError('DB', 'You have to define an owner for the new database');
        return false;
      }
      if (db === '') {
        arangoHelper.arangoError('DB', 'You have to define a name for the new database');
        return false;
      }
      if (db.indexOf('_') === 0) {
        arangoHelper.arangoError('DB ', 'Databasename should not start with _');
        return false;
      }
      if (!db.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)) {
        arangoHelper.arangoError('DB', 'Databasename may only contain numbers, letters, _ and -');
        return false;
      }
      return true;
    },

    createDatabase: function (e) {
      e.preventDefault();
      this.createAddDatabaseModal();
    },

    switchDatabase: function (e) {
      if (!$(e.target).parent().hasClass('iconSet')) {
        var changeTo = $(e.currentTarget).find('h5').text();
        if (changeTo !== '') {
          var url = this.collection.createDatabaseURL(changeTo);
          window.location.replace(url);
        }
      }
    },

    submitCreateDatabase: function () {
      var self = this; // userPassword,
      var dbname = $('#newDatabaseName').val();
      var userName = $('#newUser').val();

      var options = {
        name: dbname
      };

      this.collection.create(options, {
        error: function (data, err) {
          self.handleError(err.status, err.statusText, dbname);
        },
        success: function (data) {
          if (userName !== 'root') {
            $.ajax({
              type: 'PUT',
              url: arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(userName) + '/database/' + encodeURIComponent(dbname)),
              contentType: 'application/json',
              data: JSON.stringify({
                grant: 'rw'
              })
            });
          }
          $.ajax({
            type: 'PUT',
            url: arangoHelper.databaseUrl('/_api/user/root/database/' + encodeURIComponent(dbname)),
            contentType: 'application/json',
            data: JSON.stringify({
              grant: 'rw'
            })
          });

          if (window.location.hash === '#databases') {
            self.updateDatabases();
          }
          arangoHelper.arangoNotification('Database ' + data.get('name') + ' created.');
        }
      });

      arangoHelper.arangoNotification('Database creation in progress.');
      window.modalView.hide();
    },

    submitDeleteDatabase: function (dbname) {
      var toDelete = this.collection.where({name: dbname});
      toDelete[0].destroy({wait: true, url: arangoHelper.databaseUrl('/_api/database/' + dbname)});
      this.updateDatabases();
      window.App.naviView.dbSelectionView.render($('#dbSelect'));
      window.modalView.hide();
    },

    changeDatabase: function (e) {
      var changeTo = $(e.currentTarget).attr('id');
      var url = this.collection.createDatabaseURL(changeTo);
      window.location.replace(url);
    },

    updateDatabases: function () {
      var self = this;
      this.collection.fetch({
        cache: false,
        success: function () {
          self.render();
          window.App.handleSelectDatabase();
        }
      });
    },

    editDatabase: function (e) {
      var dbName = this.evaluateDatabaseName($(e.currentTarget).attr('id'), '_edit-database');
      var isDeletable = true;
      if (dbName === this.currentDB) {
        isDeletable = false;
      }
      this.createEditDatabaseModal(dbName, isDeletable);
    },

    search: function () {
      var searchInput,
        searchString,
        strLength,
        reducedCollection;

      searchInput = $('#databaseSearchInput');
      searchString = $('#databaseSearchInput').val();
      reducedCollection = this.collection.filter(
        function (u) {
          return u.get('name').indexOf(searchString) !== -1;
        }
      );
      $(this.el).html(this.template.render({
        collection: reducedCollection,
        searchString: searchString,
        currentDB: this.currentDB
      }));
      this.replaceSVGs();

      // after rendering, get the "new" element
      searchInput = $('#databaseSearchInput');
      // set focus on end of text in input field
      strLength = searchInput.val().length;
      searchInput.focus();
      searchInput[0].setSelectionRange(strLength, strLength);
    },

    replaceSVGs: function () {
      $('.svgToReplace').each(function () {
        var img = $(this);
        var id = img.attr('id');
        var src = img.attr('src');
        $.get(src, function (d) {
          var svg = $(d).find('svg');
          svg.attr('id', id)
            .attr('class', 'tile-icon-svg')
            .removeAttr('xmlns:a');
          img.replaceWith(svg);
        }, 'xml');
      });
    },

    evaluateDatabaseName: function (str, substr) {
      var index = str.lastIndexOf(substr);
      return str.substring(0, index);
    },

    createEditDatabaseModal: function (dbName, isDeletable) {
      var buttons = [];
      var tableContent = [];

      tableContent.push(
        window.modalView.createReadOnlyEntry('id_name', 'Name', dbName, '')
      );
      if (isDeletable) {
        buttons.push(
          window.modalView.createDeleteButton(
            'Delete',
            this.submitDeleteDatabase.bind(this, dbName)
          )
        );
      } else {
        buttons.push(window.modalView.createDisabledButton('Delete'));
      }
      window.modalView.show(
        'modalTable.ejs',
        'Delete database',
        buttons,
        tableContent
      );
    },

    createAddDatabaseModal: function () {
      var buttons = [];
      var tableContent = [];

      tableContent.push(
        window.modalView.createTextEntry(
          'newDatabaseName',
          'Name',
          '',
          false,
          'Database Name',
          true,
          [
            {
              rule: Joi.string().regex(/^[a-zA-Z]/),
              msg: 'Database name must start with a letter.'
            },
            {
              rule: Joi.string().regex(/^[a-zA-Z0-9\-_]*$/),
              msg: 'Only Symbols "_" and "-" are allowed.'
            },
            {
              rule: Joi.string().required(),
              msg: 'No database name given.'
            }
          ]
        )
      );

      var users = [];
      window.App.userCollection.each(function (user) {
        users.push({
          value: user.get('user'),
          label: user.get('user')
        });
      });

      tableContent.push(
        window.modalView.createSelectEntry(
          'newUser',
          'Username',
          this.users !== null ? this.users.whoAmI() : 'root',
          'Please define the owner of this database. This will be the only user having ' +
          'initial access to this database if authentication is turned on. Please note ' +
          'that if you specify a username different to your account you will not be ' +
          'able to access the database with your account after having creating it. ' +
          'Specifying a username is mandatory even with authentication turned off. ' +
          'If there is a failure you will be informed.',
          users
        )
      );
      buttons.push(
        window.modalView.createSuccessButton(
          'Create',
          this.submitCreateDatabase.bind(this)
        )
      );
      window.modalView.show(
        'modalTable.ejs',
        'Create Database',
        buttons,
        tableContent
      );

      $('#useDefaultPassword').change(function () {
        if ($('#useDefaultPassword').val() === 'true') {
          $('#row_newPassword').hide();
        } else {
          $('#row_newPassword').show();
        }
      });

      $('#row_newPassword').hide();
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global templateEngine, window, Backbone, $, arangoHelper */
(function () {
  'use strict';
  window.DBSelectionView = Backbone.View.extend({
    template: templateEngine.createTemplate('dbSelectionView.ejs'),

    events: {
      'click .dbSelectionLink': 'changeDatabase'
    },

    initialize: function (opts) {
      this.current = opts.current;
    },

    changeDatabase: function (e) {
      var changeTo = $(e.currentTarget).closest('.dbSelectionLink.tab').attr('id');
      var url = this.collection.createDatabaseURL(changeTo);
      window.location.replace(url);
    },

    render: function (el) {
      var callback = function (error, list) {
        if (error) {
          arangoHelper.arangoError('DB', 'Could not fetch databases');
        } else {
          this.$el = el;
          this.$el.html(this.template.render({
            list: list,
            current: this.current.get('name')
          }));
          this.delegateEvents();
        }
      }.bind(this);

      this.collection.getDatabasesForUser(callback);

      return this.el;
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, _, $, window, arangoHelper, templateEngine, Joi, btoa */
/* global numeral */

(function () {
  'use strict';
  window.DocumentsView = window.PaginationView.extend({
    filters: { '0': true },
    filterId: 0,
    paginationDiv: '#documentsToolbarF',
    idPrefix: 'documents',

    addDocumentSwitch: true,
    activeFilter: false,
    lastCollectionName: undefined,
    restoredFilters: [],

    editMode: false,

    allowUpload: false,

    el: '#content',
    table: '#documentsTableID',

    template: templateEngine.createTemplate('documentsView.ejs'),

    collectionContext: {
      prev: null,
      next: null
    },

    unbindEvents: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
    },

    editButtons: ['#deleteSelected', '#moveSelected'],

    initialize: function (options) {
      this.documentStore = options.documentStore;
      this.collectionsStore = options.collectionsStore;
      this.tableView = new window.TableView({
        el: this.table,
        collection: this.collection
      });
      this.tableView.setRowClick(this.clicked.bind(this));
      this.tableView.setRemoveClick(this.remove.bind(this));
    },

    resize: function () {
      var dropdownVisible = false;
      _.each($('.documentsDropdown').first().children(), function (elem) {
        if ($(elem).is(':visible')) {
          dropdownVisible = true;
        }
      });
      if (dropdownVisible) {
        $('#docPureTable').height($('.centralRow').height() - 210 - 57);
        $('#docPureTable .pure-table-body').css('max-height', $('#docPureTable').height() - 47);
      } else {
        $('#docPureTable').height($('.centralRow').height() - 210);
        $('#docPureTable .pure-table-body').css('max-height', $('#docPureTable').height() - 47);
      }
    },

    setCollectionId: function (colid, page) {
      this.collection.setCollection(colid);
      this.collection.setPage(page);
      this.page = page;

      var callback = function (error, type) {
        if (error) {
          arangoHelper.arangoError('Error', 'Could not get collection properties.');
        } else {
          this.type = type;
          this.collection.getDocuments(this.getDocsCallback.bind(this));
          this.collectionModel = this.collectionsStore.get(colid);
        }
      }.bind(this);

      arangoHelper.collectionApiType(colid, null, callback);
    },

    getDocsCallback: function (error) {
      // Hide first/last pagination
      $('#documents_last').css('visibility', 'hidden');
      $('#documents_first').css('visibility', 'hidden');

      if (error) {
        window.progressView.hide();
        arangoHelper.arangoError('Document error', 'Could not fetch requested documents.');
      } else if (!error || error !== undefined) {
        window.progressView.hide();
        this.drawTable();
        this.renderPaginationElements();
      }
    },

    events: {
      'click #collectionPrev': 'prevCollection',
      'click #collectionNext': 'nextCollection',
      'click #filterCollection': 'filterCollection',
      'click #markDocuments': 'editDocuments',
      'click #importCollection': 'importCollection',
      'click #exportCollection': 'exportCollection',
      'click #filterSend': 'sendFilter',
      'click #addFilterItem': 'addFilterItem',
      'click .removeFilterItem': 'removeFilterItem',
      'click #deleteSelected': 'deleteSelectedDocs',
      'click #moveSelected': 'moveSelectedDocs',
      'click #addDocumentButton': 'addDocumentModal',
      'click #documents_first': 'firstDocuments',
      'click #documents_last': 'lastDocuments',
      'click #documents_prev': 'prevDocuments',
      'click #documents_next': 'nextDocuments',
      'click #confirmDeleteBtn': 'confirmDelete',
      'click .key': 'nop',
      'keyup': 'returnPressedHandler',
      'keydown .queryline input': 'filterValueKeydown',
      'click #importModal': 'showImportModal',
      'click #resetView': 'resetView',
      'click #confirmDocImport': 'startUpload',
      'click #exportDocuments': 'startDownload',
      'change #documentSize': 'setPagesize',
      'change #docsSort': 'setSorting'
    },

    showSpinner: function () {
      $('.upload-indicator').show();
    },

    hideSpinner: function () {
      $('.upload-indicator').hide();
    },

    showImportModal: function () {
      $('#docImportModal').modal('show');
    },

    hideImportModal: function () {
      $('#docImportModal').modal('hide');
    },

    setPagesize: function () {
      var size = $('#documentSize').find(':selected').val();
      this.collection.setPagesize(size);
      this.collection.getDocuments(this.getDocsCallback.bind(this));
    },

    setSorting: function () {
      var sortAttribute = $('#docsSort').val();

      if (sortAttribute === '' || sortAttribute === undefined || sortAttribute === null) {
        sortAttribute = '_key';
      }

      this.collection.setSort(sortAttribute);
    },

    returnPressedHandler: function (event) {
      if (event.keyCode === 13 && $(event.target).is($('#docsSort'))) {
        this.collection.getDocuments(this.getDocsCallback.bind(this));
      }
      if (event.keyCode === 13) {
        if ($('#confirmDeleteBtn').attr('disabled') === false) {
          this.confirmDelete();
        }
      }
    },

    nop: function (event) {
      event.stopPropagation();
    },

    resetView: function () {
      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('Document', 'Could not fetch documents count');
        }
      };

      // clear all input/select - fields
      $('input').val('');
      $('select').val('==');
      this.removeAllFilterItems();
      $('#documentSize').val(this.collection.getPageSize());

      $('#documents_last').css('visibility', 'visible');
      $('#documents_first').css('visibility', 'visible');
      this.addDocumentSwitch = true;
      this.collection.resetFilter();
      this.collection.loadTotal(callback);
      this.restoredFilters = [];

      // for resetting json upload
      this.allowUpload = false;
      this.files = undefined;
      this.file = undefined;
      $('#confirmDocImport').attr('disabled', true);

      this.markFilterToggle();
      this.collection.getDocuments(this.getDocsCallback.bind(this));
    },

    startDownload: function () {
      var query = this.collection.buildDownloadDocumentQuery();

      if (query !== '' || query !== undefined || query !== null) {
        var url = 'query/result/download/' + btoa(JSON.stringify(query));
        arangoHelper.download(url);
      } else {
        arangoHelper.arangoError('Document error', 'could not download documents');
      }
    },

    startUpload: function () {
      var callback = function (error, msg) {
        if (error) {
          arangoHelper.arangoError('Upload', msg);
        } else {
          this.hideImportModal();
          this.resetView();
        }
        this.hideSpinner();
      }.bind(this);

      if (this.allowUpload === true) {
        this.showSpinner();
        this.collection.uploadDocuments(this.file, callback);
      }
    },

    uploadSetup: function () {
      var self = this;
      $('#importDocuments').change(function (e) {
        self.files = e.target.files || e.dataTransfer.files;
        self.file = self.files[0];
        $('#confirmDocImport').attr('disabled', false);

        self.allowUpload = true;
      });
    },

    buildCollectionLink: function (collection) {
      return 'collection/' + encodeURIComponent(collection.get('name')) + '/documents/1';
    },

    markFilterToggle: function () {
      if (this.restoredFilters.length > 0) {
        $('#filterCollection').addClass('activated');
      } else {
        $('#filterCollection').removeClass('activated');
      }
    },

    // need to make following functions automatically!

    editDocuments: function () {
      $('#importCollection').removeClass('activated');
      $('#exportCollection').removeClass('activated');
      this.markFilterToggle();
      $('#markDocuments').toggleClass('activated');
      this.changeEditMode();
      $('#filterHeader').hide();
      $('#importHeader').hide();
      $('#editHeader').slideToggle(1);
      $('#exportHeader').hide();

      var self = this;
      window.setTimeout(function () {
        self.resize();
      }, 50);
    },

    filterCollection: function () {
      $('#importCollection').removeClass('activated');
      $('#exportCollection').removeClass('activated');
      $('#markDocuments').removeClass('activated');
      this.changeEditMode(false);
      this.markFilterToggle();
      this.activeFilter = true;
      $('#importHeader').hide();
      $('#editHeader').hide();
      $('#exportHeader').hide();
      $('#filterHeader').slideToggle(1);

      var self = this;
      window.setTimeout(function () {
        self.resize();
      }, 50);

      var i;
      for (i in this.filters) {
        if (this.filters.hasOwnProperty(i)) {
          $('#attribute_name' + i).focus();
          return;
        }
      }
    },

    exportCollection: function () {
      $('#importCollection').removeClass('activated');
      $('#filterHeader').removeClass('activated');
      $('#markDocuments').removeClass('activated');
      this.changeEditMode(false);
      $('#exportCollection').toggleClass('activated');
      this.markFilterToggle();
      $('#exportHeader').slideToggle(1);
      $('#importHeader').hide();
      $('#filterHeader').hide();
      $('#editHeader').hide();
      var self = this;
      window.setTimeout(function () {
        self.resize();
      }, 50);
    },

    importCollection: function () {
      this.markFilterToggle();
      $('#markDocuments').removeClass('activated');
      this.changeEditMode(false);
      $('#importCollection').toggleClass('activated');
      $('#exportCollection').removeClass('activated');
      $('#importHeader').slideToggle(1);
      $('#filterHeader').hide();
      $('#editHeader').hide();
      $('#exportHeader').hide();
      var self = this;
      window.setTimeout(function () {
        self.resize();
      }, 50);
    },

    changeEditMode: function (enable) {
      if (enable === false || this.editMode === true) {
        $('#docPureTable .pure-table-body .pure-table-row').css('cursor', 'default');
        $('.deleteButton').fadeIn();
        $('.addButton').fadeIn();
        $('.selected-row').removeClass('selected-row');
        this.editMode = false;
        this.tableView.setRowClick(this.clicked.bind(this));
      } else {
        $('#docPureTable .pure-table-body .pure-table-row').css('cursor', 'copy');
        $('.deleteButton').fadeOut();
        $('.addButton').fadeOut();
        $('.selectedCount').text(0);
        this.editMode = true;
        this.tableView.setRowClick(this.editModeClick.bind(this));
      }
    },

    getFilterContent: function () {
      var filters = [];
      var i, value;

      for (i in this.filters) {
        if (this.filters.hasOwnProperty(i)) {
          value = $('#attribute_value' + i).val();

          try {
            value = JSON.parse(value);
          } catch (err) {
            value = String(value);
          }

          if ($('#attribute_name' + i).val() !== '') {
            filters.push({
              attribute: $('#attribute_name' + i).val(),
              operator: $('#operator' + i).val(),
              value: value
            });
          }
        }
      }
      return filters;
    },

    sendFilter: function () {
      this.restoredFilters = this.getFilterContent();
      var self = this;
      this.collection.resetFilter();
      this.addDocumentSwitch = false;
      _.each(this.restoredFilters, function (f) {
        if (f.operator !== undefined) {
          self.collection.addFilter(f.attribute, f.operator, f.value);
        }
      });
      this.collection.setToFirst();

      this.collection.getDocuments(this.getDocsCallback.bind(this));
      this.markFilterToggle();
    },

    restoreFilter: function () {
      var self = this;
      var counter = 0;

      this.filterId = 0;
      $('#docsSort').val(this.collection.getSort());
      _.each(this.restoredFilters, function (f) {
        // change html here and restore filters
        if (counter !== 0) {
          self.addFilterItem();
        }
        if (f.operator !== undefined) {
          $('#attribute_name' + counter).val(f.attribute);
          $('#operator' + counter).val(f.operator);
          $('#attribute_value' + counter).val(f.value);
        }
        counter++;

        // add those filters also to the collection
        self.collection.addFilter(f.attribute, f.operator, f.value);
      });

      self.rerender();
    },

    addFilterItem: function () {
      // adds a line to the filter widget

      var num = ++this.filterId;
      $('#filterHeader').append(' <div class="queryline querylineAdd">' +
        '<input id="attribute_name' + num +
        '" type="text" placeholder="Attribute name">' +
        '<select name="operator" id="operator' +
        num + '" class="filterSelect">' +
        '    <option value="==">==</option>' +
        '    <option value="!=">!=</option>' +
        '    <option value="&lt;">&lt;</option>' +
        '    <option value="&lt;=">&lt;=</option>' +
        '    <option value="&gt;">&gt;</option>' +
        '    <option value="&gt;=">&gt;=</option>' +
        '    <option value="LIKE">LIKE</option>' +
        '    <option value="IN">IN</option>' +
        '    <option value="=~">NOT IN</option>' +
        '    <option value="REGEX">REGEX</option>' +
        '</select>' +
        '<input id="attribute_value' + num +
        '" type="text" placeholder="Attribute value" ' +
        'class="filterValue">' +
        ' <a class="removeFilterItem" id="removeFilter' + num + '">' +
        '<i class="fa fa-minus-circle"></i></a></div>');
      this.filters[num] = true;

      this.checkFilterState();
    },

    filterValueKeydown: function (e) {
      if (e.keyCode === 13) {
        this.sendFilter();
      }
    },

    checkFilterState: function () {
      var length = $('#filterHeader .queryline').length;

      if (length === 1) {
        $('#filterHeader .removeFilterItem').remove();
      } else {
        if ($('#filterHeader .queryline').first().find('.removeFilterItem').length === 0) {
          var id = $('#filterHeader .queryline').first().children().first().attr('id');
          var num = id.substr(14, id.length);

          $('#filterHeader .queryline').first().find('.add-filter-item').after(
            ' <a class="removeFilterItem" id="removeFilter' + num + '">' +
            '<i class="fa fa-minus-circle"></i></a>');
        }
      }

      if ($('#filterHeader .queryline').first().find('.add-filter-item').length === 0) {
        $('#filterHeader .queryline').first().find('.filterValue').after(
          '<a id="addFilterItem" class="add-filter-item"><i style="margin-left: 4px;" class="fa fa-plus-circle"></i></a>'
        );
      }
    },

    removeFilterItem: function (e) {
      // removes line from the filter widget
      var button = e.currentTarget;

      var filterId = button.id.replace(/^removeFilter/, '');
      // remove the filter from the list
      delete this.filters[filterId];
      delete this.restoredFilters[filterId];

      // remove the line from the DOM
      $(button.parentElement).remove();
      this.checkFilterState();
    },

    removeAllFilterItems: function () {
      var childrenLength = $('#filterHeader').children().length;
      var i;
      for (i = 1; i <= childrenLength; i++) {
        $('#removeFilter' + i).parent().remove();
      }
      this.filters = { '0': true };
      this.filterId = 0;
    },

    addDocumentModal: function () {
      var collid = window.location.hash.split('/')[1];
      var buttons = []; var tableContent = [];
        // second parameter is "true" to disable caching of collection type

      var callback = function (error, type) {
        if (error) {
          arangoHelper.arangoError('Error', 'Could not fetch collection type');
        } else {
          if (type === 'edge') {
            tableContent.push(
              window.modalView.createTextEntry(
                'new-edge-from-attr',
                '_from',
                '',
                'document _id: document handle of the linked vertex (incoming relation)',
                undefined,
                false,
                [
                  {
                    rule: Joi.string().required(),
                    msg: 'No _from attribute given.'
                  }
                ]
              )
            );

            tableContent.push(
              window.modalView.createTextEntry(
                'new-edge-to',
                '_to',
                '',
                'document _id: document handle of the linked vertex (outgoing relation)',
                undefined,
                false,
                [
                  {
                    rule: Joi.string().required(),
                    msg: 'No _to attribute given.'
                  }
                ]
              )
            );

            tableContent.push(
              window.modalView.createTextEntry(
                'new-edge-key-attr',
                '_key',
                undefined,
                'the edges unique key(optional attribute, leave empty for autogenerated key',
                'is optional: leave empty for autogenerated key',
                false,
                [
                  {
                    rule: Joi.string().allow('').optional(),
                    msg: ''
                  }
                ]
              )
            );
            buttons.push(
              window.modalView.createSuccessButton('Create', this.addEdge.bind(this))
            );

            window.modalView.show(
              'modalTable.ejs',
              'Create edge',
              buttons,
              tableContent
            );
          } else {
            tableContent.push(
              window.modalView.createTextEntry(
                'new-document-key-attr',
                '_key',
                undefined,
                'the documents unique key(optional attribute, leave empty for autogenerated key',
                'is optional: leave empty for autogenerated key',
                false,
                [
                  {
                    rule: Joi.string().allow('').optional(),
                    msg: ''
                  }
                ]
              )
            );

            buttons.push(
              window.modalView.createSuccessButton('Create', this.addDocument.bind(this))
            );

            window.modalView.show(
              'modalTable.ejs',
              'Create document',
              buttons,
              tableContent
            );
          }
        }
      }.bind(this);
      arangoHelper.collectionApiType(collid, true, callback);
    },

    addEdge: function () {
      var collid = window.location.hash.split('/')[1];
      var from = $('.modal-body #new-edge-from-attr').last().val();
      var to = $('.modal-body #new-edge-to').last().val();
      var key = $('.modal-body #new-edge-key-attr').last().val();
      var url;

      var callback = function (error, data, msg) {
        if (error) {
          arangoHelper.arangoError('Error', msg.errorMessage);
        } else {
          window.modalView.hide();
          data = data._id.split('/');

          try {
            url = 'collection/' + data[0] + '/' + data[1];
            decodeURI(url);
          } catch (ex) {
            url = 'collection/' + data[0] + '/' + encodeURIComponent(data[1]);
          }
          window.location.hash = url;
        }
      };

      if (key !== '' || key !== undefined) {
        this.documentStore.createTypeEdge(collid, from, to, key, callback);
      } else {
        this.documentStore.createTypeEdge(collid, from, to, null, callback);
      }
    },

    addDocument: function () {
      var collid = window.location.hash.split('/')[1];
      var key = $('.modal-body #new-document-key-attr').last().val();
      var url;

      var callback = function (error, data, msg) {
        if (error) {
          arangoHelper.arangoError('Error', msg.errorMessage);
        } else {
          window.modalView.hide();
          data = data.split('/');

          try {
            url = 'collection/' + data[0] + '/' + data[1];
            decodeURI(url);
          } catch (ex) {
            url = 'collection/' + data[0] + '/' + encodeURIComponent(data[1]);
          }

          window.location.hash = url;
        }
      };

      if (key !== '' || key !== undefined) {
        this.documentStore.createTypeDocument(collid, key, callback);
      } else {
        this.documentStore.createTypeDocument(collid, null, callback);
      }
    },

    moveSelectedDocs: function () {
      var buttons = []; var tableContent = [];
      var toDelete = this.getSelectedDocs();

      if (toDelete.length === 0) {
        return;
      }

      tableContent.push(
        window.modalView.createTextEntry(
          'move-documents-to',
          'Move to',
          '',
          false,
          'collection-name',
          true,
          [
            {
              rule: Joi.string().regex(/^[a-zA-Z]/),
              msg: 'Collection name must always start with a letter.'
            },
            {
              rule: Joi.string().regex(/^[a-zA-Z0-9\-_]*$/),
              msg: 'Only Symbols "_" and "-" are allowed.'
            },
            {
              rule: Joi.string().required(),
              msg: 'No collection name given.'
            }
          ]
        )
      );

      buttons.push(
        window.modalView.createSuccessButton('Move', this.confirmMoveSelectedDocs.bind(this))
      );

      window.modalView.show(
        'modalTable.ejs',
        'Move documents',
        buttons,
        tableContent
      );
    },

    confirmMoveSelectedDocs: function () {
      var toMove = this.getSelectedDocs();
      var self = this;
      var toCollection = $('.modal-body').last().find('#move-documents-to').val();

      var callback = function () {
        this.collection.getDocuments(this.getDocsCallback.bind(this));
        $('#markDocuments').click();
        window.modalView.hide();
      }.bind(this);

      _.each(toMove, function (key) {
        self.collection.moveDocument(key, self.collection.collectionID, toCollection, callback);
      });
    },

    deleteSelectedDocs: function () {
      var buttons = []; var tableContent = [];
      var toDelete = this.getSelectedDocs();

      if (toDelete.length === 0) {
        return;
      }

      tableContent.push(
        window.modalView.createReadOnlyEntry(
          undefined,
          toDelete.length + ' documents selected',
          'Do you want to delete all selected documents?',
          undefined,
          undefined,
          false,
          undefined
        )
      );

      buttons.push(
        window.modalView.createDeleteButton('Delete', this.confirmDeleteSelectedDocs.bind(this))
      );

      window.modalView.show(
        'modalTable.ejs',
        'Delete documents',
        buttons,
        tableContent
      );
    },

    confirmDeleteSelectedDocs: function () {
      var toDelete = this.getSelectedDocs();
      var deleted = []; var self = this;

      _.each(toDelete, function (key) {
        if (self.type === 'document') {
          var callback = function (error) {
            if (error) {
              deleted.push(false);
              arangoHelper.arangoError('Document error', 'Could not delete document.');
            } else {
              deleted.push(true);
              self.collection.setTotalMinusOne();
              self.collection.getDocuments(this.getDocsCallback.bind(this));
              $('#markDocuments').click();
              window.modalView.hide();
            }
          }.bind(self);
          self.documentStore.deleteDocument(self.collection.collectionID, key, callback);
        } else if (self.type === 'edge') {
          var callback2 = function (error) {
            if (error) {
              deleted.push(false);
              arangoHelper.arangoError('Edge error', 'Could not delete edge');
            } else {
              self.collection.setTotalMinusOne();
              deleted.push(true);
              self.collection.getDocuments(this.getDocsCallback.bind(this));
              $('#markDocuments').click();
              window.modalView.hide();
            }
          }.bind(self);

          self.documentStore.deleteEdge(self.collection.collectionID, key, callback2);
        }
      });
    },

    getSelectedDocs: function () {
      var toDelete = [];
      _.each($('#docPureTable .pure-table-body .pure-table-row'), function (element) {
        if ($(element).hasClass('selected-row')) {
          toDelete.push($($(element).children()[1]).find('.key').text());
        }
      });
      return toDelete;
    },

    remove: function (a) {
      this.docid = $(a.currentTarget).parent().parent().prev().find('.key').text();
      $('#confirmDeleteBtn').attr('disabled', false);
      $('#docDeleteModal').modal('show');
    },

    confirmDelete: function () {
      $('#confirmDeleteBtn').attr('disabled', true);
      var hash = window.location.hash.split('/');
      var check = hash[3];
      // to_do - find wrong event handler
      if (check !== 'source') {
        this.reallyDelete();
      }
    },

    reallyDelete: function () {
      if (this.type === 'document') {
        var callback = function (error) {
          if (error) {
            arangoHelper.arangoError('Error', 'Could not delete document');
          } else {
            this.collection.setTotalMinusOne();
            this.collection.getDocuments(this.getDocsCallback.bind(this));
            $('#docDeleteModal').modal('hide');
          }
        }.bind(this);

        this.documentStore.deleteDocument(this.collection.collectionID, this.docid, callback);
      } else if (this.type === 'edge') {
        var callback2 = function (error) {
          if (error) {
            arangoHelper.arangoError('Edge error', 'Could not delete edge');
          } else {
            this.collection.setTotalMinusOne();
            this.collection.getDocuments(this.getDocsCallback.bind(this));
            $('#docDeleteModal').modal('hide');
          }
        }.bind(this);

        this.documentStore.deleteEdge(this.collection.collectionID, this.docid, callback2);
      }
    },

    editModeClick: function (event) {
      var target = $(event.currentTarget);

      if (target.hasClass('selected-row')) {
        target.removeClass('selected-row');
      } else {
        target.addClass('selected-row');
      }

      var selected = this.getSelectedDocs();
      $('.selectedCount').text(selected.length);

      _.each(this.editButtons, function (button) {
        if (selected.length > 0) {
          $(button).prop('disabled', false);
          $(button).removeClass('button-neutral');
          $(button).removeClass('disabled');
          if (button === '#moveSelected') {
            $(button).addClass('button-success');
          } else {
            $(button).addClass('button-danger');
          }
        } else {
          $(button).prop('disabled', true);
          $(button).addClass('disabled');
          $(button).addClass('button-neutral');
          if (button === '#moveSelected') {
            $(button).removeClass('button-success');
          } else {
            $(button).removeClass('button-danger');
          }
        }
      });
    },

    clicked: function (event) {
      var self = event.currentTarget;

      var url; var doc = $(self).attr('id').substr(4);

      try {
        url = 'collection/' + this.collection.collectionID + '/' + doc;
        decodeURI(doc);
      } catch (ex) {
        url = 'collection/' + this.collection.collectionID + '/' + encodeURIComponent(doc);
      }

      window.location.hash = url;
    },

    drawTable: function () {
      this.tableView.setElement($('#docPureTable')).render();
      // we added some icons, so we need to fix their tooltips
      arangoHelper.fixTooltips('.icon_arangodb, .arangoicon', 'top');

      $('.prettify').snippet('javascript', {
        style: 'nedit',
        menu: false,
        startText: false,
        transparent: true,
        showNum: false
      });
      this.resize();
    },

    checkCollectionState: function () {
      if (this.lastCollectionName === this.collectionName) {
        if (this.activeFilter) {
          this.filterCollection();
          this.restoreFilter();
        }
      } else {
        if (this.lastCollectionName !== undefined) {
          this.collection.resetFilter();
          this.collection.setSort('');
          this.restoredFilters = [];
          this.activeFilter = false;
        }
      }
    },

    render: function () {
      $(this.el).html(this.template.render({}));
      if (this.type === 2) {
        this.type = 'document';
      } else if (this.type === 3) {
        this.type = 'edge';
      }

      this.tableView.setElement($(this.table)).drawLoading();

      this.collectionContext = this.collectionsStore.getPosition(
        this.collection.collectionID
      );

      this.collectionName = window.location.hash.split('/')[1];

      this.checkCollectionState();

      // set last active collection name
      this.lastCollectionName = this.collectionName;

      /*
      if (this.collectionContext.prev === null) {
        $('#collectionPrev').parent().addClass('disabledPag')
      }
      if (this.collectionContext.next === null) {
        $('#collectionNext').parent().addClass('disabledPag')
      }
      */

      this.uploadSetup();

      arangoHelper.fixTooltips(['.icon_arangodb', '.arangoicon', 'top', '[data-toggle=tooltip]', '.upload-info']);
      this.renderPaginationElements();
      this.selectActivePagesize();
      this.markFilterToggle();
      this.resize();

      // fill navigation and breadcrumb
      this.breadcrumb();

      return this;
    },

    rerender: function () {
      this.collection.getDocuments(this.getDocsCallback.bind(this));
      this.resize();
    },

    selectActivePagesize: function () {
      $('#documentSize').val(this.collection.getPageSize());
    },

    renderPaginationElements: function () {
      this.renderPagination();
      var total = $('#totalDocuments');
      if (total.length === 0) {
        $('#documentsToolbarFL').append(
          '<a id="totalDocuments" class="totalDocuments"></a>'
        );
        total = $('#totalDocuments');
      }
      if (this.type === 'document') {
        total.html(numeral(this.collection.getTotal()).format('0,0') + ' doc(s)');
      }
      if (this.type === 'edge') {
        total.html(numeral(this.collection.getTotal()).format('0,0') + ' edge(s)');
      }
      if (this.collection.getTotal() > this.collection.MAX_SORT) {
        $('#docsSort').attr('disabled', true);
        $('#docsSort').attr('placeholder', 'Sort limit reached (docs count)');
      } else {
        $('#docsSort').attr('disabled', false);
        $('#docsSort').attr('placeholder', 'Sort by attribute');
      }
    },

    breadcrumb: function () {
      var self = this;

      if (window.App.naviView) {
        $('#subNavigationBar .breadcrumb').html(
          'Collection: ' + this.collectionName
        );
        window.arangoHelper.buildCollectionSubNav(this.collectionName, 'Content');
      } else {
        window.setTimeout(function () {
          self.breadcrumb();
        }, 100);
      }
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, localStorage, window, arangoHelper, templateEngine, JSONEditor */
/* global document, _ */

(function () {
  'use strict';

  var createDocumentLink = function (id) {
    var split = id.split('/');
    return 'collection/' +
      encodeURIComponent(split[0]) + '/' +
      encodeURIComponent(split[1]);
  };

  window.DocumentView = Backbone.View.extend({
    el: '#content',
    colid: 0,
    docid: 0,

    customView: false,
    defaultMode: 'tree',

    template: templateEngine.createTemplate('documentView.ejs'),

    events: {
      'click #saveDocumentButton': 'saveDocument',
      'click #deleteDocumentButton': 'deleteDocumentModal',
      'click #confirmDeleteDocument': 'deleteDocument',
      'click #document-from': 'navigateToDocument',
      'click #document-to': 'navigateToDocument',
      'keydown #documentEditor .ace_editor': 'keyPress',
      'keyup .jsoneditor .search input': 'checkSearchBox',
      'click .jsoneditor .modes': 'storeMode',
      'click #addDocument': 'addDocument'
    },

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    checkSearchBox: function (e) {
      if ($(e.currentTarget).val() === '') {
        this.editor.expandAll();
      }
    },

    initialize: function () {
      var mode = localStorage.getItem('JSONEditorMode');
      if (mode) {
        this.defaultMode = mode;
      }
    },

    addDocument: function () {
      window.App.documentsView.addDocumentModal();
    },

    storeMode: function () {
      var self = this;

      $('.type-modes').on('click', function (elem) {
        var mode = $(elem.currentTarget).text().toLowerCase();
        localStorage.setItem('JSONEditorMode', mode);
        self.defaultMode = mode;
      });
    },

    keyPress: function (e) {
      if (e.ctrlKey && e.keyCode === 13) {
        e.preventDefault();
        this.saveDocument();
      } else if (e.metaKey && e.keyCode === 13) {
        e.preventDefault();
        this.saveDocument();
      }
    },

    editor: 0,

    setType: function () {
      var callback = function (error, data, type) {
        if (error) {
          arangoHelper.arangoError('Error', 'Could not fetch data.');
        } else {
          this.type = type;
          this.breadcrumb();
          this.fillInfo();
          this.fillEditor();
        }
      }.bind(this);

      this.collection.getDocument(this.colid, this.docid, callback);
    },

    deleteDocumentModal: function () {
      var buttons = []; var tableContent = [];
      tableContent.push(
        window.modalView.createReadOnlyEntry(
          'doc-delete-button',
          'Confirm delete, document id is',
          this.type._id,
          undefined,
          undefined,
          false,
          /[<>&'"]/
        )
      );
      buttons.push(
        window.modalView.createDeleteButton('Delete', this.deleteDocument.bind(this))
      );
      window.modalView.show('modalTable.ejs', 'Delete Document', buttons, tableContent);
    },

    deleteDocument: function () {
      var successFunction = function () {
        if (this.customView) {
          this.customDeleteFunction();
        } else {
          var navigateTo = 'collection/' + encodeURIComponent(this.colid) + '/documents/1';
          window.modalView.hide();
          window.App.navigate(navigateTo, {trigger: true});
        }
      }.bind(this);

      if (this.type._from && this.type._to) {
        var callbackEdge = function (error) {
          if (error) {
            arangoHelper.arangoError('Edge error', 'Could not delete edge');
          } else {
            successFunction();
          }
        };
        this.collection.deleteEdge(this.colid, this.docid, callbackEdge);
      } else {
        var callbackDoc = function (error) {
          if (error) {
            arangoHelper.arangoError('Error', 'Could not delete document');
          } else {
            successFunction();
          }
        };
        this.collection.deleteDocument(this.colid, this.docid, callbackDoc);
      }
    },

    navigateToDocument: function (e) {
      var navigateTo = $(e.target).attr('documentLink');
      if (navigateTo) {
        window.App.navigate(navigateTo, {trigger: true});
      }
    },

    fillInfo: function () {
      var mod = this.collection.first();
      var _id = mod.get('_id');
      var _key = mod.get('_key');
      var _rev = mod.get('_rev');
      var _from = mod.get('_from');
      var _to = mod.get('_to');

      $('#document-type').css('margin-left', '10px');
      $('#document-type').text('_id:');
      $('#document-id').css('margin-left', '0');
      $('#document-id').text(_id);
      $('#document-key').text(_key);
      $('#document-rev').text(_rev);

      if (_from && _to) {
        var hrefFrom = createDocumentLink(_from);
        var hrefTo = createDocumentLink(_to);
        $('#document-from').text(_from);
        $('#document-from').attr('documentLink', hrefFrom);
        $('#document-to').text(_to);
        $('#document-to').attr('documentLink', hrefTo);
      } else {
        $('.edge-info-container').hide();
      }
    },

    fillEditor: function () {
      var toFill = this.removeReadonlyKeys(this.collection.first().attributes);
      $('.disabledBread').last().text(this.collection.first().get('_key'));
      this.editor.set(toFill);
      $('.ace_content').attr('font-size', '11pt');
    },

    jsonContentChanged: function () {
      this.enableSaveButton();
    },

    resize: function () {
      $('#documentEditor').height($('.centralRow').height() - 300);
    },

    render: function () {
      $(this.el).html(this.template.render({}));

      $('#documentEditor').height($('.centralRow').height() - 300);
      this.disableSaveButton();

      var self = this;

      var container = document.getElementById('documentEditor');
      var options = {
        change: function () {
          self.jsonContentChanged();
        },
        search: true,
        mode: 'tree',
        modes: ['tree', 'code'],
        iconlib: 'fontawesome4'
      };
      this.editor = new JSONEditor(container, options);
      if (this.defaultMode) {
        this.editor.setMode(this.defaultMode);
      }

      return this;
    },

    removeReadonlyKeys: function (object) {
      return _.omit(object, ['_key', '_id', '_from', '_to', '_rev']);
    },

    saveDocument: function () {
      if ($('#saveDocumentButton').attr('disabled') === undefined) {
        if (this.collection.first().attributes._id.substr(0, 1) === '_') {
          var buttons = []; var tableContent = [];
          tableContent.push(
            window.modalView.createReadOnlyEntry(
              'doc-save-system-button',
              'Caution',
              'You are modifying a system collection. Really continue?',
              undefined,
              undefined,
              false,
              /[<>&'"]/
            )
          );
          buttons.push(
            window.modalView.createSuccessButton('Save', this.confirmSaveDocument.bind(this))
          );
          window.modalView.show('modalTable.ejs', 'Modify System Collection', buttons, tableContent);
        } else {
          this.confirmSaveDocument();
        }
      }
    },

    confirmSaveDocument: function () {
      window.modalView.hide();

      var model;

      try {
        model = this.editor.get();
      } catch (e) {
        this.errorConfirmation(e);
        this.disableSaveButton();
        return;
      }

      model = JSON.stringify(model);

      if (this.type === 'edge' || this.type._from) {
        var callbackE = function (error, data) {
          if (error) {
            arangoHelper.arangoError('Error', data.responseJSON.errorMessage);
          } else {
            this.successConfirmation();
            this.disableSaveButton();
          }
        }.bind(this);

        this.collection.saveEdge(this.colid, this.docid, $('#document-from').html(), $('#document-to').html(), model, callbackE);
      } else {
        var callback = function (error, data) {
          if (error) {
            arangoHelper.arangoError('Error', data.responseJSON.errorMessage);
          } else {
            this.successConfirmation();
            this.disableSaveButton();
          }
        }.bind(this);

        this.collection.saveDocument(this.colid, this.docid, model, callback);
      }
    },

    successConfirmation: function () {
      arangoHelper.arangoNotification('Document saved.');
    },

    errorConfirmation: function (e) {
      arangoHelper.arangoError('Document editor: ', e);
    },

    enableSaveButton: function () {
      $('#saveDocumentButton').prop('disabled', false);
      $('#saveDocumentButton').addClass('button-success');
      $('#saveDocumentButton').removeClass('button-close');
    },

    disableSaveButton: function () {
      $('#saveDocumentButton').prop('disabled', true);
      $('#saveDocumentButton').addClass('button-close');
      $('#saveDocumentButton').removeClass('button-success');
    },

    breadcrumb: function () {
      var name = window.location.hash.split('/');
      $('#subNavigationBar .breadcrumb').html(
        '<a href="#collection/' + name[1] + '/documents/1">Collection: ' + name[1] + '</a>' +
        '<i class="fa fa-chevron-right"></i>' +
        this.type.charAt(0).toUpperCase() + this.type.slice(1) + ': ' + name[2]
      );
    },

    escaped: function (value) {
      return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, templateEngine, window, arangoHelper, $, _ */
(function () {
  'use strict';

  window.FilterSelectView = Backbone.View.extend({
    el: '#filterSelectDiv',
    filterOptionsEl: '.filterOptions',

    initialize: function (options) {
      this.name = options.name;
      this.options = options.options;
      this.position = options.position;
      this.callback = options.callback;
      this.multiple = options.multiple;
    },

    /* options arr elem
     *  option: {
     *    name: <string>,
     *    active: <boolean,
     *    color: <string>
     *  }
     */

    template: templateEngine.createTemplate('filterSelect.ejs'),

    events: {
      'click .filterOptions .inactive': 'changeState',
      'click .filterOptions .active': 'changeState',
      'click #showAll': 'showAll',
      'click #closeFilter': 'hide',
      'keyup .filterInput input': 'filter'
    },

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    changeState: function (e) {
      var self = this;
      var name = $(e.currentTarget).attr('name');
      if ($(e.currentTarget).hasClass('active')) {
        self.options[name].active = false;
        $(e.currentTarget).removeClass('active').addClass('inactive');
        $(e.currentTarget).find('.marked').css('visibility', 'hidden');
      } else {
        self.options[name].active = true;
        $(e.currentTarget).removeClass('inactive').addClass('active');
        $(e.currentTarget).find('.marked').css('visibility', 'visible');
      }

      if (this.callback) {
        this.callback(this.options);
      }
    },

    filter: function () {
      var value = $('#' + this.name + '-filter').val();
      _.each(this.options, function (option) {
        if (option.name.search(value) > -1) {
          $('#' + option.name + '-option').css('display', 'block');
        } else {
          $('#' + option.name + '-option').css('display', 'none');
        }
      });
    },

    clearFilter: function () {
      $('#' + this.name + '-filter').val('');
      this.filter();
    },

    showAll: function () {
      this.clearFilter();
      _.each(this.options, function (option) {
        option.active = false;
        $('#' + option.name + '-option').removeClass('active').addClass('inactive');
        $('#' + option.name + '-option').find('.marked').css('visibility', 'hidden');
      });
      this.callback(this.options);
    },

    render: function () {
      var self = this;

      $('#filterSelectDiv').on('click', function (e) {
        if (e.target.id === 'filterSelectDiv') {
          self.hide();
        }
      });

      _.each(self.options, function (option) {
        if (!option.color) {
          option.color = arangoHelper.alphabetColors[option.name.charAt(0).toLowerCase()];
        }
      });

      this.$el.html(this.template.render({
        name: self.name,
        options: self.options
      }));

      $('#filterSelectDiv > div').css('right', this.position.right + 'px');
      $('#filterSelectDiv > div').css('top', this.position.top + 30);

      this.show();
      $('#' + this.name + '-filter').focus();
    },

    show: function () {
      $(this.el).show();
    },

    hide: function () {
      $('#filterSelectDiv').unbind('click');
      $(this.el).hide();
      this.remove();
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global _, Backbone, frontendConfig, document, templateEngine, $, arangoHelper, window */

(function () {
  'use strict';
  window.FooterView = Backbone.View.extend({
    el: '#footerBar',
    system: {},
    isOffline: true,
    isOfflineCounter: 0,
    firstLogin: true,
    timer: 15000,
    lap: 0,
    timerFunction: null,

    events: {
      'click .footer-center p': 'showShortcutModal'
    },

    initialize: function () {
      // also server online check
      var self = this;
      window.setInterval(function () {
        self.getVersion();
      }, self.timer);
      self.getVersion();

      window.VISIBLE = true;
      document.addEventListener('visibilitychange', function () {
        window.VISIBLE = !window.VISIBLE;
      });

      $('#offlinePlaceholder button').on('click', function () {
        self.getVersion();
      });

      window.setTimeout(function () {
        if (window.frontendConfig.isCluster === true) {
          $('.health-state').css('cursor', 'pointer');
          $('.health-state').on('click', function () {
            window.App.navigate('#nodes', {trigger: true});
          });
        }
      }, 1000);
    },

    template: templateEngine.createTemplate('footerView.ejs'),

    showServerStatus: function (isOnline) {
      if (!window.App.isCluster) {
        if (isOnline === true) {
          $('#healthStatus').removeClass('negative');
          $('#healthStatus').addClass('positive');
          $('.health-state').html('GOOD');
          $('.health-icon').html('<i class="fa fa-check-circle"></i>');
          $('#offlinePlaceholder').hide();
        } else {
          $('#healthStatus').removeClass('positive');
          $('#healthStatus').addClass('negative');
          $('.health-state').html('UNKNOWN');
          $('.health-icon').html('<i class="fa fa-exclamation-circle"></i>');

          // remove modals if visible
          window.modalView.hide();

          // show offline overlay
          $('#offlinePlaceholder').show();

          // remove error messages
          $.noty.clearQueue();
          $.noty.closeAll();

          this.reconnectAnimation(0);
        }
      } else {
        this.renderClusterState(isOnline);
      }
    },

    reconnectAnimation: function (lap) {
      var self = this;

      if (lap === 0) {
        self.lap = lap;
        $('#offlineSeconds').text(self.timer / 1000);
        clearTimeout(self.timerFunction);
      }

      if (self.lap < this.timer / 1000) {
        self.lap++;
        $('#offlineSeconds').text(self.timer / 1000 - self.lap);

        self.timerFunction = window.setTimeout(function () {
          if (self.timer / 1000 - self.lap === 0) {
            self.getVersion();
          } else {
            self.reconnectAnimation(self.lap);
          }
        }, 1000);
      }
    },

    renderClusterState: function (connection) {
      if (connection) {
        $('#offlinePlaceholder').hide();

        var callbackFunction = function (data) {
          window.clusterHealth = data.Health;

          var error = 0;

          if (Object.keys(window.clusterHealth).length !== 0) {
            _.each(window.clusterHealth, function (node) {
              if (node.Status !== 'GOOD') {
                error++;
              }
            });

            if (error > 0) {
              $('#healthStatus').removeClass('positive');
              $('#healthStatus').addClass('negative');
              if (error === 1) {
                $('.health-state').html(error + ' NODE ERROR');
              } else {
                $('.health-state').html(error + ' NODES ERROR');
              }
              $('.health-icon').html('<i class="fa fa-exclamation-circle"></i>');
            } else {
              $('#healthStatus').removeClass('negative');
              $('#healthStatus').addClass('positive');
              $('.health-state').html('NODES OK');
              $('.health-icon').html('<i class="fa fa-check-circle"></i>');
            }
          } else {
            $('.health-state').html('HEALTH ERROR');
            $('#healthStatus').removeClass('positive');
            $('#healthStatus').addClass('negative');
            $('.health-icon').html('<i class="fa fa-exclamation-circle"></i>');
          }
        };

        // check cluster state
        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/cluster/health'),
          contentType: 'application/json',
          processData: false,
          async: true,
          success: function (data) {
            callbackFunction(data);
          }
        });
      } else {
        $('#healthStatus').removeClass('positive');
        $('#healthStatus').addClass('negative');
        $('.health-state').html(window.location.host + ' OFFLINE');
        $('.health-icon').html('<i class="fa fa-exclamation-circle"></i>');

        // show offline overlay
        $('#offlinePlaceholder').show();
        this.reconnectAnimation(0);
      }
    },

    showShortcutModal: function () {
      window.arangoHelper.hotkeysFunctions.showHotkeysModal();
    },

    getVersion: function () {
      var self = this;

      // always retry this call, because it also checks if the server is online
      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_api/version'),
        contentType: 'application/json',
        processData: false,
        async: true,
        success: function (data) {
          frontendConfig.version = data;
          self.showServerStatus(true);
          if (self.isOffline === true) {
            self.isOffline = false;
            self.isOfflineCounter = 0;
            if (!self.firstLogin) {
              window.setTimeout(function () {
                self.showServerStatus(true);
              }, 1000);
            } else {
              self.firstLogin = false;
            }
            self.system.name = data.server;
            self.system.version = data.version;
            self.render();
          }
        },
        error: function (jqXHR) {
          if (jqXHR.status === 401) {
            self.showServerStatus(true);
            window.App.navigate('login', {trigger: true});
          } else {
            self.isOffline = true;
            self.isOfflineCounter++;
            if (self.isOfflineCounter >= 1) {
              // arangoHelper.arangoError("Server", "Server is offline")
              self.showServerStatus(false);
            }
          }
        }
      });

      if (!self.system.hasOwnProperty('database')) {
        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_api/database/current'),
          contentType: 'application/json',
          processData: false,
          async: true,
          success: function (data) {
            var name = data.result.name;
            self.system.database = name;

            var timer = window.setInterval(function () {
              var navElement = $('#databaseNavi');

              if (navElement) {
                window.clearTimeout(timer);
                timer = null;
                self.render();
              }
            }, 50);
          }
        });
      }
    },

    renderVersion: function () {
      if (this.system.hasOwnProperty('database') && this.system.hasOwnProperty('name')) {
        $(this.el).html(this.template.render({
          name: this.system.name,
          version: this.system.version,
          database: this.system.database
        }));
      }
    },

    render: function () {
      if (!this.system.version) {
        this.getVersion();
      }
      $(this.el).html(this.template.render({
        name: this.system.name,
        version: this.system.version
      }));
      return this;
    }

  });
}());

// obsolete file

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, window, templateEngine */

(function () {
  'use strict';

  window.FoxxActiveView = Backbone.View.extend({
    tagName: 'div',
    className: 'tile pure-u-1-1 pure-u-sm-1-2 pure-u-md-1-3 pure-u-lg-1-4 pure-u-xl-1-6',
    template: templateEngine.createTemplate('foxxActiveView.ejs'),
    _show: true,

    events: {
      'click': 'openAppDetailView'
    },

    openAppDetailView: function () {
      window.App.navigate('service/' + encodeURIComponent(this.model.get('mount')), { trigger: true });
    },

    toggle: function (type, shouldShow) {
      switch (type) {
        case 'devel':
          if (this.model.isDevelopment()) {
            this._show = shouldShow;
          }
          break;
        case 'production':
          if (!this.model.isDevelopment() && !this.model.isSystem()) {
            this._show = shouldShow;
          }
          break;
        case 'system':
          if (this.model.isSystem()) {
            this._show = shouldShow;
          }
          break;
        default:
      }
      if (this._show) {
        $(this.el).show();
      } else {
        $(this.el).hide();
      }
    },

    render: function () {
      this.model.fetchThumbnail(function () {
        $(this.el).html(this.template.render({
          model: this.model
        }));

        var conf = function () {
          if (this.model.needsConfiguration()) {
            if ($(this.el).find('.warning-icons').length > 0) {
              $(this.el).find('.warning-icons')
                .append('<span class="fa fa-cog" title="Needs configuration"></span>');
            } else {
              $(this.el).find('img')
                .after(
                  '<span class="warning-icons"><span class="fa fa-cog" title="Needs configuration"></span></span>'
              );
            }
          }
        }.bind(this);

        var depend = function () {
          if (this.model.hasUnconfiguredDependencies()) {
            if ($(this.el).find('.warning-icons').length > 0) {
              $(this.el).find('.warning-icons')
                .append('<span class="fa fa-cubes" title="Unconfigured dependencies"></span>');
            } else {
              $(this.el).find('img')
                .after(
                  '<span class="warning-icons"><span class="fa fa-cubes" title="Unconfigured dependencies"></span></span>'
              );
            }
          }
        }.bind(this);

        /* isBroken function in model doesnt make sense
          var broken = function() {
          $(this.el).find('warning-icons')
          .append('<span class="fa fa-warning" title="Mount error"></span>')
          }.bind(this)
          */

        this.model.getConfiguration(conf);
        this.model.getDependencies(depend);
      }.bind(this));
      return $(this.el);
    }
  });
}());

/* jshint browser: true */
/* global $, Joi, _, arangoHelper, templateEngine, window */
(function () {
  'use strict';

  // mop: copy paste from common/bootstrap/errors.js
  var errors = {
    'ERROR_SERVICE_DOWNLOAD_FAILED': { 'code': 1752, 'message': 'service download failed' }
  };

  var appStoreTemplate = templateEngine.createTemplate('applicationListView.ejs');

  var FoxxInstallView = function (opts) {
    this.collection = opts.collection;
  };

  var installCallback = function (result) {
    var self = this;

    if (result.error === false) {
      this.collection.fetch({
        success: function () {
          window.modalView.hide();
          self.reload();
          console.log(result);
          arangoHelper.arangoNotification('Services', 'Service ' + result.name + ' installed.');
        }
      });
    } else {
      var res = result;
      if (result.hasOwnProperty('responseJSON')) {
        res = result.responseJSON;
      }
      switch (res.errorNum) {
        case errors.ERROR_SERVICE_DOWNLOAD_FAILED.code:
          arangoHelper.arangoError('Services', 'Unable to download application from the given repository.');
          break;
        default:
          arangoHelper.arangoError('Services', res.errorNum + '. ' + res.errorMessage);
      }
    }
  };

  var setMountpointValidators = function () {
    window.modalView.modalBindValidation({
      id: 'new-app-mount',
      validateInput: function () {
        return [
          {
            rule: Joi.string().regex(/^(\/(APP[^/]+|(?!APP)[a-zA-Z0-9_\-%]+))+$/i),
            msg: 'May not contain /APP'
          },
          {
            rule: Joi.string().regex(/^(\/[a-zA-Z0-9_\-%]+)+$/),
            msg: 'Can only contain [a-zA-Z0-9_-%]'
          },
          {
            rule: Joi.string().regex(/^\/([^_]|_open\/)/),
            msg: 'Mountpoints with _ are reserved for internal use'
          },
          {
            rule: Joi.string().regex(/[^/]$/),
            msg: 'May not end with /'
          },
          {
            rule: Joi.string().regex(/^\//),
            msg: 'Has to start with /'
          },
          {
            rule: Joi.string().required().min(2),
            msg: 'Has to be non-empty'
          }
        ];
      }
    });
  };

  var setGithubValidators = function () {
    window.modalView.modalBindValidation({
      id: 'repository',
      validateInput: function () {
        return [
          {
            rule: Joi.string().required().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/),
            msg: 'No valid Github account and repository.'
          }
        ];
      }
    });
  };

  var setNewAppValidators = function () {
    window.modalView.modalBindValidation({
      id: 'new-app-author',
      validateInput: function () {
        return [
          {
            rule: Joi.string().required().min(1),
            msg: 'Has to be non empty.'
          }
        ];
      }
    });
    window.modalView.modalBindValidation({
      id: 'new-app-name',
      validateInput: function () {
        return [
          {
            rule: Joi.string().required().regex(/^[a-zA-Z\-_][a-zA-Z0-9\-_]*$/),
            msg: "Can only contain a to z, A to Z, 0-9, '-' and '_'."
          }
        ];
      }
    });

    window.modalView.modalBindValidation({
      id: 'new-app-description',
      validateInput: function () {
        return [
          {
            rule: Joi.string().required().min(1),
            msg: 'Has to be non empty.'
          }
        ];
      }
    });

    window.modalView.modalBindValidation({
      id: 'new-app-license',
      validateInput: function () {
        return [
          {
            rule: Joi.string().required().regex(/^[a-zA-Z0-9 .,;-]+$/),
            msg: 'Has to be non empty.'
          }
        ];
      }
    });
    window.modalView.modalTestAll();
  };

  var switchTab = function (openTab) {
    window.modalView.clearValidators();
    var button = $('#modalButton1');
    if (!this._upgrade) {
      setMountpointValidators();
    }
    switch (openTab) {
      case 'newApp':
        button.html('Generate');
        button.prop('disabled', false);
        setNewAppValidators();
        break;
      case 'appstore':
        button.html('Install');
        button.prop('disabled', true);
        break;
      case 'github':
        setGithubValidators();
        button.html('Install');
        button.prop('disabled', false);
        break;
      case 'zip':
        button.html('Install');
        button.prop('disabled', false);
        break;
      default:
    }

    if (!button.prop('disabled') && !window.modalView.modalTestAll()) {
      // trigger the validation so the "ok" button has the correct state
      button.prop('disabled', true);
    }
  };

  var switchModalButton = function (event) {
    var openTab = $(event.currentTarget).attr('href').substr(1);
    switchTab.call(this, openTab);
  };

  var installFoxxFromStore = function (e) {
    switchTab.call(this, 'appstore');
    if (window.modalView.modalTestAll()) {
      var mount, flag;
      if (this._upgrade) {
        mount = this.mount;
        flag = $('#new-app-teardown').prop('checked');
      } else {
        mount = window.arangoHelper.escapeHtml($('#new-app-mount').val());
      }
      var toInstall = $(e.currentTarget).attr('appId');
      var version = $(e.currentTarget).attr('appVersion');
      if (flag !== undefined) {
        this.collection.installFromStore({name: toInstall, version: version}, mount, installCallback.bind(this), flag);
      } else {
        this.collection.installFromStore({name: toInstall, version: version}, mount, installCallback.bind(this));
      }
      window.modalView.hide();
      arangoHelper.arangoNotification('Services', 'Installing ' + toInstall + '.');
    }
  };

  var installFoxxFromZip = function (files, data) {
    if (data === undefined) {
      data = this._uploadData;
    } else {
      this._uploadData = data;
    }
    if (data && window.modalView.modalTestAll()) {
      var mount, flag, isLegacy;
      if (this._upgrade) {
        mount = this.mount;
        flag = Boolean($('#new-app-teardown').prop('checked'));
      } else {
        mount = window.arangoHelper.escapeHtml($('#new-app-mount').val());
      }
      isLegacy = Boolean($('#zip-app-islegacy').prop('checked'));
      this.collection.installFromZip(data.filename, mount, installCallback.bind(this), isLegacy, flag);
    }
  };

  var installFoxxFromGithub = function () {
    if (window.modalView.modalTestAll()) {
      var url, version, mount, flag, isLegacy;
      if (this._upgrade) {
        mount = this.mount;
        flag = $('#new-app-teardown').prop('checked');
      } else {
        mount = window.arangoHelper.escapeHtml($('#new-app-mount').val());
      }
      url = window.arangoHelper.escapeHtml($('#repository').val());
      version = window.arangoHelper.escapeHtml($('#tag').val());

      if (version === '') {
        version = 'master';
      }
      var info = {
        url: window.arangoHelper.escapeHtml($('#repository').val()),
        version: window.arangoHelper.escapeHtml($('#tag').val())
      };

      try {
        Joi.assert(url, Joi.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/));
      } catch (e) {
        return;
      }
      // send server req through collection
      isLegacy = Boolean($('#github-app-islegacy').prop('checked'));
      this.collection.installFromGithub(info, mount, installCallback.bind(this), isLegacy, flag);
    }
  };

  var generateNewFoxxApp = function () {
    if (window.modalView.modalTestAll()) {
      var mount, flag;
      if (this._upgrade) {
        mount = this.mount;
        flag = $('#new-app-teardown').prop('checked');
      } else {
        mount = window.arangoHelper.escapeHtml($('#new-app-mount').val());
      }
      var info = {
        name: window.arangoHelper.escapeHtml($('#new-app-name').val()),
        documentCollections: _.map($('#new-app-document-collections').select2('data'), function (d) {
          return window.arangoHelper.escapeHtml(d.text);
        }),
        edgeCollections: _.map($('#new-app-edge-collections').select2('data'), function (d) {
          return window.arangoHelper.escapeHtml(d.text);
        }),
        //        authenticated: window.arangoHelper.escapeHtml($("#new-app-name").val()),
        author: window.arangoHelper.escapeHtml($('#new-app-author').val()),
        license: window.arangoHelper.escapeHtml($('#new-app-license').val()),
        description: window.arangoHelper.escapeHtml($('#new-app-description').val())
      };
      this.collection.generate(info, mount, installCallback.bind(this), flag);
    }
  };

  var addAppAction = function () {
    var openTab = $('.modal-body .tab-pane.active').attr('id');
    switch (openTab) {
      case 'newApp':
        generateNewFoxxApp.apply(this);
        break;
      case 'github':
        installFoxxFromGithub.apply(this);
        break;
      case 'zip':
        installFoxxFromZip.apply(this);
        break;
      default:
    }
  };

  var render = function (scope, upgrade) {
    var buttons = [];
    var modalEvents = {
      'click #infoTab a': switchModalButton.bind(scope),
      'click .install-app': installFoxxFromStore.bind(scope)
    };
    buttons.push(
      window.modalView.createSuccessButton('Generate', addAppAction.bind(scope))
    );
    window.modalView.show(
      'modalApplicationMount.ejs',
      'Install Service',
      buttons,
      upgrade,
      undefined,
      undefined,
      modalEvents
    );
    $('#new-app-document-collections').select2({
      tags: [],
      showSearchBox: false,
      minimumResultsForSearch: -1,
      width: '336px'
    });
    $('#new-app-edge-collections').select2({
      tags: [],
      showSearchBox: false,
      minimumResultsForSearch: -1,
      width: '336px'
    });

    var checkButton = function () {
      var button = $('#modalButton1');
      if (!button.prop('disabled') && !window.modalView.modalTestAll()) {
        button.prop('disabled', true);
      } else {
        button.prop('disabled', false);
      }
    };

    $('.select2-search-field input').focusout(function () {
      checkButton();
      window.setTimeout(function () {
        if ($('.select2-drop').is(':visible')) {
          if (!$('#select2-search-field input').is(':focus')) {
            $('#s2id_new-app-document-collections').select2('close');
            $('#s2id_new-app-edge-collections').select2('close');
            checkButton();
          }
        }
      }, 200);
    });
    $('.select2-search-field input').focusin(function () {
      if ($('.select2-drop').is(':visible')) {
        var button = $('#modalButton1');
        button.prop('disabled', true);
      }
    });
    $('#upload-foxx-zip').uploadFile({
      url: arangoHelper.databaseUrl('/_api/upload?multipart=true'),
      allowedTypes: 'zip,js',
      multiple: false,
      onSuccess: installFoxxFromZip.bind(scope)
    });
    $.get('foxxes/fishbowl', function (list) {
      var table = $('#appstore-content');
      table.html('');
      _.each(_.sortBy(list, 'name'), function (app) {
        table.append(appStoreTemplate.render(app));
      });
    }).fail(function () {
      var table = $('#appstore-content');
      table.append('<tr><td>Store is not available. ArangoDB is not able to connect to github.com</td></tr>');
    });
  };

  FoxxInstallView.prototype.install = function (callback) {
    this.reload = callback;
    this._upgrade = false;
    this._uploadData = undefined;
    delete this.mount;
    render(this, false);
    window.modalView.clearValidators();
    setMountpointValidators();
    setNewAppValidators();
  };

  FoxxInstallView.prototype.upgrade = function (mount, callback) {
    this.reload = callback;
    this._upgrade = true;
    this._uploadData = undefined;
    this.mount = mount;
    render(this, true);
    window.modalView.clearValidators();
    setNewAppValidators();
  };

  window.FoxxInstallView = FoxxInstallView;
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, _, window, templateEngine, arangoHelper, GraphViewerUI, require, Joi, frontendConfig */

(function () {
  'use strict';

  window.GraphManagementView = Backbone.View.extend({
    el: '#content',
    template: templateEngine.createTemplate('graphManagementView.ejs'),
    edgeDefintionTemplate: templateEngine.createTemplate('edgeDefinitionTable.ejs'),
    eCollList: [],
    removedECollList: [],

    dropdownVisible: false,

    initialize: function (options) {
      this.options = options;
    },

    events: {
      'click #deleteGraph': 'deleteGraph',
      'click .icon_arangodb_settings2.editGraph': 'editGraph',
      'click #createGraph': 'addNewGraph',
      'keyup #graphManagementSearchInput': 'search',
      'click #graphManagementSearchSubmit': 'search',
      'click .tile-graph': 'redirectToGraphViewer',
      'click #graphManagementToggle': 'toggleGraphDropdown',
      'click .css-label': 'checkBoxes',
      'change #graphSortDesc': 'sorting'
    },

    toggleTab: function (e) {
      var id = e.currentTarget.id;
      id = id.replace('tab-', '');
      $('#tab-content-create-graph .tab-pane').removeClass('active');
      $('#tab-content-create-graph #' + id).addClass('active');

      if (id === 'exampleGraphs') {
        $('#modal-dialog .modal-footer .button-success').css('display', 'none');
      } else {
        $('#modal-dialog .modal-footer .button-success').css('display', 'initial');
      }
      if (id === 'smartGraph') {
        this.toggleSmartGraph();
        $('#createGraph').addClass('active');
        this.showSmartGraphOptions();
      } else {
        this.toggleSmartGraph();
        this.hideSmartGraphOptions();
      }
    },

    hideSmartGraphOptions: function () {
      $('#row_general-numberOfShards').show();
      $('#smartGraphInfo').hide();
      $('#row_new-numberOfShards').hide();
      $('#row_new-smartGraphAttribute').hide();
    },

    showSmartGraphOptions: function () {
      $('#row_general-numberOfShards').hide();
      $('#smartGraphInfo').show();
      $('#row_new-numberOfShards').show();
      $('#row_new-smartGraphAttribute').show();
    },

    redirectToGraphViewer: function (e) {
      var name = $(e.currentTarget).attr('id');
      name = name.substr(0, name.length - 5);
      window.location.hash = window.location.hash.substr(0, window.location.hash.length - 1) + '/' + encodeURIComponent(name);
    },

    loadGraphViewer: function (graphName, refetch) {
      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('', '');
        } else {
          var edgeDefs = this.collection.get(graphName).get('edgeDefinitions');
          if (!edgeDefs || edgeDefs.length === 0) {
            // User Info
            return;
          }
          var adapterConfig = {
            type: 'gharial',
            graphName: graphName,
            baseUrl: arangoHelper.databaseUrl('/')
          };
          var width = $('#content').width() - 75;
          $('#content').html('');

          var height = arangoHelper.calculateCenterDivHeight();

          this.ui = new GraphViewerUI($('#content')[0], adapterConfig, width, $('.centralRow').height() - 135, {
            nodeShaper: {
              label: '_key',
              color: {
                type: 'attribute',
                key: '_key'
              }
            }

          }, true);

          $('.contentDiv').height(height);
        }
      }.bind(this);

      if (refetch) {
        this.collection.fetch({
          cache: false,
          success: function () {
            callback();
          }
        });
      } else {
        callback();
      }
    },

    handleResize: function (w) {
      if (!this.width || this.width !== w) {
        this.width = w;
        if (this.ui) {
          this.ui.changeWidth(w);
        }
      }
    },

    addNewGraph: function (e) {
      e.preventDefault();
      if (frontendConfig.isCluster && frontendConfig.isEnterprise) {
        this.createEditGraphModal();
      } else {
        this.createEditGraphModal();
        // hide tab entry
        $('#tab-smartGraph').parent().remove();
      }
    },

    deleteGraph: function () {
      var self = this;
      var name = $('#editGraphName')[0].value;

      if ($('#dropGraphCollections').is(':checked')) {
        var callback = function (success) {
          if (success) {
            self.collection.remove(self.collection.get(name));
            self.updateGraphManagementView();
            window.modalView.hide();
          } else {
            window.modalView.hide();
            arangoHelper.arangoError('Graph', 'Could not delete Graph.');
          }
        };

        this.collection.dropAndDeleteGraph(name, callback);
      } else {
        this.collection.get(name).destroy({
          success: function () {
            self.updateGraphManagementView();
            window.modalView.hide();
          },
          error: function (xhr, err) {
            var response = JSON.parse(err.responseText);
            var msg = response.errorMessage;
            arangoHelper.arangoError(msg);
            window.modalView.hide();
          }
        });
      }
    },

    checkBoxes: function (e) {
      // chrome bugfix
      var clicked = e.currentTarget.id;
      $('#' + clicked).click();
    },

    toggleGraphDropdown: function () {
      // apply sorting to checkboxes
      $('#graphSortDesc').attr('checked', this.collection.sortOptions.desc);

      $('#graphManagementToggle').toggleClass('activated');
      $('#graphManagementDropdown2').slideToggle(200);
    },

    sorting: function () {
      if ($('#graphSortDesc').is(':checked')) {
        this.collection.setSortingDesc(true);
      } else {
        this.collection.setSortingDesc(false);
      }

      if ($('#graphManagementDropdown').is(':visible')) {
        this.dropdownVisible = true;
      } else {
        this.dropdownVisible = false;
      }

      this.render();
    },

    createExampleGraphs: function (e) {
      var graph = $(e.currentTarget).attr('graph-id');
      var self = this;

      $.ajax({
        type: 'POST',
        url: arangoHelper.databaseUrl('/_admin/aardvark/graph-examples/create/' + encodeURIComponent(graph)),
        success: function () {
          window.modalView.hide();
          self.updateGraphManagementView();
          arangoHelper.arangoNotification('Example Graphs', 'Graph: ' + graph + ' created.');
        },
        error: function (err) {
          window.modalView.hide();
          if (err.responseText) {
            try {
              var msg = JSON.parse(err.responseText);
              arangoHelper.arangoError('Example Graphs', msg.errorMessage);
            } catch (e) {
              arangoHelper.arangoError('Example Graphs', 'Could not create example graph: ' + graph);
            }
          } else {
            arangoHelper.arangoError('Example Graphs', 'Could not create example graph: ' + graph);
          }
        }
      });
    },

    toggleSmartGraph: function () {
      var i;
      var self = this;

      if (!$('#tab-smartGraph').parent().hasClass('active')) {
        for (i = 0; i < this.counter; i++) {
          $('#newEdgeDefinitions' + i).select2({
            tags: []
          });
          self.cachedNewEdgeDefinitions = $('#newEdgeDefinitions' + i).select2('data');
          self.cachedNewEdgeDefinitionsState = $('#newEdgeDefinitions' + i).attr('disabled');
          $('#newEdgeDefinitions' + i).select2('data', '');
          $('#newEdgeDefinitions' + i).attr('disabled', false);
          $('#newEdgeDefinitions' + i).change();

          $('#fromCollections' + i).select2({
            tags: []
          });
          self.cachedFromCollections = $('#fromCollections' + i).select2('data');
          self.cachedFromCollectionsState = $('#fromCollections' + i).attr('disabled');
          $('#fromCollections' + i).select2('data', '');
          $('#fromCollections' + i).attr('disabled', false);
          $('#fromCollections' + i).change();

          $('#toCollections' + i).select2({
            tags: []
          });
          self.cachedToCollections = $('#toCollections' + i).select2('data');
          self.cachedToCollectionsState = $('#toCollections' + i).attr('disabled');
          $('#toCollections' + i).select2('data', '');
          $('#toCollections' + i).attr('disabled', false);
          $('#toCollections' + i).change();
        }
        $('#newVertexCollections').select2({
          tags: []
        });
        self.cachedNewVertexCollections = $('#newVertexCollections').select2('data');
        self.cachedNewVertexCollectionsState = $('#newVertexCollections').attr('disabled');
        $('#newVertexCollections').select2('data', '');
        $('#newVertexCollections').attr('disabled', false);
        $('#newVertexCollections').change();
      } else {
        var collList = []; var collections = this.options.collectionCollection.models;

        collections.forEach(function (c) {
          if (c.get('isSystem')) {
            return;
          }
          collList.push(c.id);
        });

        for (i = 0; i < this.counter; i++) {
          $('#newEdgeDefinitions' + i).select2({
            tags: this.eCollList
          });
          $('#newEdgeDefinitions' + i).select2('data', self.cachedNewEdgeDefinitions);
          $('#newEdgeDefinitions' + i).attr('disabled', self.cachedNewEdgeDefinitionsState);

          $('#fromCollections' + i).select2({
            tags: collList
          });
          $('#fromCollections' + i).select2('data', self.cachedFromCollections);
          $('#fromCollections' + i).attr('disabled', self.cachedFromCollectionsState);

          $('#toCollections' + i).select2({
            tags: collList
          });
          $('#toCollections' + i).select2('data', self.cachedToCollections);
          $('#toCollections' + i).attr('disabled', self.cachedToCollectionsState);
        }
        $('#newVertexCollections').select2({
          tags: collList
        });
        $('#newVertexCollections').select2('data', self.cachedNewVertexCollections);
        $('#newVertexCollections').attr('disabled', self.cachedNewVertexCollectionsState);
      }
    },

    render: function (name, refetch) {
      var self = this;
      this.collection.fetch({
        cache: false,

        success: function () {
          self.collection.sort();

          $(self.el).html(self.template.render({
            graphs: self.collection,
            searchString: ''
          }));

          if (self.dropdownVisible === true) {
            $('#graphManagementDropdown2').show();
            $('#graphSortDesc').attr('checked', self.collection.sortOptions.desc);
            $('#graphManagementToggle').toggleClass('activated');
            $('#graphManagementDropdown').show();
          }

          self.events['change tr[id*="newEdgeDefinitions"]'] = self.setFromAndTo.bind(self);
          self.events['click .graphViewer-icon-button'] = self.addRemoveDefinition.bind(self);
          self.events['click #graphTab a'] = self.toggleTab.bind(self);
          self.events['click .createExampleGraphs'] = self.createExampleGraphs.bind(self);
          self.events['focusout .select2-search-field input'] = function (e) {
            if ($('.select2-drop').is(':visible')) {
              if (!$('#select2-search-field input').is(':focus')) {
                window.setTimeout(function () {
                  $(e.currentTarget).parent().parent().parent().select2('close');
                }, 200);
              }
            }
          };
          arangoHelper.setCheckboxStatus('#graphManagementDropdown');
        }
      });

      if (name) {
        this.loadGraphViewer(name, refetch);
      }
      return this;
    },

    setFromAndTo: function (e) {
      e.stopPropagation();
      var map = this.calculateEdgeDefinitionMap();
      var id;

      if ($('#tab-smartGraph').parent().hasClass('active')) {
        if (e.added) {
          if (this.eCollList.indexOf(e.added.id) === -1 && this.removedECollList.indexOf(e.added.id) !== -1) {
            id = e.currentTarget.id.split('row_newEdgeDefinitions')[1];
            $('input[id*="newEdgeDefinitions' + id + '"]').select2('val', null);
            $('input[id*="newEdgeDefinitions' + id + '"]').attr(
              'placeholder', 'The collection ' + e.added.id + ' is already used.'
            );
            return;
          }
          this.removedECollList.push(e.added.id);
          this.eCollList.splice(this.eCollList.indexOf(e.added.id), 1);
        } else {
          if (e.removed) {
            // TODO edges not properly removed within selection
            this.eCollList.push(e.removed.id);
            this.removedECollList.splice(this.removedECollList.indexOf(e.removed.id), 1);
          }
        }
        if (map[e.val]) {
          id = e.currentTarget.id.split('row_newEdgeDefinitions')[1];
          $('#s2id_fromCollections' + id).select2('val', map[e.val].from);
          $('#fromCollections' + id).attr('disabled', true);
          $('#s2id_toCollections' + id).select2('val', map[e.val].to);
          $('#toCollections' + id).attr('disabled', true);
        } else {
          id = e.currentTarget.id.split('row_newEdgeDefinitions')[1];
          $('#s2id_fromCollections' + id).select2('val', null);
          $('#fromCollections' + id).attr('disabled', false);
          $('#s2id_toCollections' + id).select2('val', null);
          $('#toCollections' + id).attr('disabled', false);
        }
      }
    },

    editGraph: function (e) {
      e.stopPropagation();
      this.collection.fetch({
        cache: false
      });
      this.graphToEdit = this.evaluateGraphName($(e.currentTarget).attr('id'), '_settings');
      var graph = this.collection.findWhere({_key: this.graphToEdit});
      if (graph.get('isSmart')) {
        this.createEditGraphModal(graph, true);
      } else {
        this.createEditGraphModal(graph);
      }
    },

    saveEditedGraph: function () {
      var name = $('#editGraphName')[0].value;
      var editedVertexCollections = _.pluck($('#newVertexCollections').select2('data'), 'text');
      var edgeDefinitions = [];
      var newEdgeDefinitions = {};
      var collection;
      var from;
      var to;
      var index;
      var edgeDefinitionElements;

      edgeDefinitionElements = $('[id^=s2id_newEdgeDefinitions]').toArray();
      edgeDefinitionElements.forEach(
        function (eDElement) {
          index = $(eDElement).attr('id');
          index = index.replace('s2id_newEdgeDefinitions', '');
          collection = _.pluck($('#s2id_newEdgeDefinitions' + index).select2('data'), 'text')[0];
          if (collection && collection !== '') {
            from = _.pluck($('#s2id_fromCollections' + index).select2('data'), 'text');
            to = _.pluck($('#s2id_toCollections' + index).select2('data'), 'text');
            if (from.length !== 0 && to.length !== 0) {
              var edgeDefinition = {
                collection: collection,
                from: from,
                to: to
              };
              edgeDefinitions.push(edgeDefinition);
              newEdgeDefinitions[collection] = edgeDefinition;
            }
          }
        }
      );

      // if no edge definition is left
      if (edgeDefinitions.length === 0) {
        $('#s2id_newEdgeDefinitions0 .select2-choices').css('border-color', 'red');
        $('#s2id_newEdgeDefinitions0')
          .parent()
          .parent()
          .next().find('.select2-choices').css('border-color', 'red');
        $('#s2id_newEdgeDefinitions0').parent()
          .parent()
          .next()
          .next()
          .find('.select2-choices')
          .css('border-color', 'red');
        return;
      }

      // get current edgeDefs/orphanage
      var graph = this.collection.findWhere({_key: name});
      var currentEdgeDefinitions = graph.get('edgeDefinitions');
      var currentOrphanage = graph.get('orphanCollections');
      var currentCollections = [];

      // delete removed orphans
      currentOrphanage.forEach(
        function (oC) {
          if (editedVertexCollections.indexOf(oC) === -1) {
            graph.deleteVertexCollection(oC);
          }
        }
      );
      // add new orphans
      editedVertexCollections.forEach(
        function (vC) {
          if (currentOrphanage.indexOf(vC) === -1) {
            graph.addVertexCollection(vC);
          }
        }
      );

      // evaluate all new, edited and deleted edge definitions
      var newEDs = [];
      var editedEDs = [];
      var deletedEDs = [];

      currentEdgeDefinitions.forEach(
        function (eD) {
          var collection = eD.collection;
          currentCollections.push(collection);
          var newED = newEdgeDefinitions[collection];
          if (newED === undefined) {
            deletedEDs.push(collection);
          } else if (JSON.stringify(newED) !== JSON.stringify(eD)) {
            editedEDs.push(collection);
          }
        }
      );
      edgeDefinitions.forEach(
        function (eD) {
          var collection = eD.collection;
          if (currentCollections.indexOf(collection) === -1) {
            newEDs.push(collection);
          }
        }
      );

      newEDs.forEach(
        function (eD) {
          graph.addEdgeDefinition(newEdgeDefinitions[eD]);
        }
      );

      editedEDs.forEach(
        function (eD) {
          graph.modifyEdgeDefinition(newEdgeDefinitions[eD]);
        }
      );

      deletedEDs.forEach(
        function (eD) {
          graph.deleteEdgeDefinition(eD);
        }
      );
      this.updateGraphManagementView();
      window.modalView.hide();
    },

    evaluateGraphName: function (str, substr) {
      var index = str.lastIndexOf(substr);
      return str.substring(0, index);
    },

    search: function () {
      var searchInput,
        searchString,
        strLength,
        reducedCollection;

      searchInput = $('#graphManagementSearchInput');
      searchString = $('#graphManagementSearchInput').val();
      reducedCollection = this.collection.filter(
        function (u) {
          return u.get('_key').indexOf(searchString) !== -1;
        }
      );
      $(this.el).html(this.template.render({
        graphs: reducedCollection,
        searchString: searchString
      }));

      // after rendering, get the "new" element
      searchInput = $('#graphManagementSearchInput');
      // set focus on end of text in input field
      strLength = searchInput.val().length;
      searchInput.focus();
      searchInput[0].setSelectionRange(strLength, strLength);
    },

    updateGraphManagementView: function () {
      var self = this;
      this.collection.fetch({
        cache: false,
        success: function () {
          self.render();
        }
      });
    },

    createNewGraph: function () {
      var name = $('#createNewGraphName').val();
      var vertexCollections = _.pluck($('#newVertexCollections').select2('data'), 'text');
      var edgeDefinitions = [];
      var self = this;
      var collection;
      var from;
      var to;
      var index;
      var edgeDefinitionElements;

      if (!name) {
        arangoHelper.arangoError(
          'A name for the graph has to be provided.'
        );
        return 0;
      }

      if (this.collection.findWhere({_key: name})) {
        arangoHelper.arangoError(
          "The graph '" + name + "' already exists."
        );
        return 0;
      }

      edgeDefinitionElements = $('[id^=s2id_newEdgeDefinitions]').toArray();
      edgeDefinitionElements.forEach(
        function (eDElement) {
          index = $(eDElement).attr('id');
          index = index.replace('s2id_newEdgeDefinitions', '');
          collection = _.pluck($('#s2id_newEdgeDefinitions' + index).select2('data'), 'text')[0];
          if (collection && collection !== '') {
            from = _.pluck($('#s2id_fromCollections' + index).select2('data'), 'text');
            to = _.pluck($('#s2id_toCollections' + index).select2('data'), 'text');
            if (from !== 1 && to !== 1) {
              edgeDefinitions.push(
                {
                  collection: collection,
                  from: from,
                  to: to
                }
              );
            }
          }
        }
      );

      if (edgeDefinitions.length === 0) {
        $('#s2id_newEdgeDefinitions0 .select2-choices').css('border-color', 'red');
        $('#s2id_newEdgeDefinitions0').parent()
          .parent()
          .next()
          .find('.select2-choices')
          .css('border-color', 'red');
        $('#s2id_newEdgeDefinitions0').parent()
          .parent()
          .next()
          .next()
          .find('.select2-choices')
          .css('border-color', 'red');
        return;
      }

      var newCollectionObject = {
        name: name,
        edgeDefinitions: edgeDefinitions,
        orphanCollections: vertexCollections
      };

      // if smart graph
      if ($('#tab-smartGraph').parent().hasClass('active')) {
        if ($('#new-numberOfShards').val() === '' || $('#new-smartGraphAttribute').val() === '') {
          arangoHelper.arangoError('Smart Graph creation', 'numberOfShards and/or smartGraphAttribute not set!');
          return;
        } else {
          newCollectionObject.isSmart = true;
          newCollectionObject.options = {
            numberOfShards: $('#new-numberOfShards').val(),
            smartGraphAttribute: $('#new-smartGraphAttribute').val()
          };
        }
      } else {
        if (frontendConfig.isCluster) {
          if ($('#general-numberOfShards').val().length > 0) {
            newCollectionObject.options = {
              numberOfShards: $('#general-numberOfShards').val()
            };
          }
        }
      }

      this.collection.create(newCollectionObject, {
        success: function () {
          self.updateGraphManagementView();
          window.modalView.hide();
        },
        error: function (obj, err) {
          var response = JSON.parse(err.responseText);
          var msg = response.errorMessage;
          // Gritter does not display <>
          msg = msg.replace('<', '');
          msg = msg.replace('>', '');
          arangoHelper.arangoError(msg);
        }
      });
    },

    createEditGraphModal: function (graph, isSmart) {
      var buttons = [];
      var collList = [];
      var tableContent = [];
      var collections = this.options.collectionCollection.models;
      var self = this;
      var name = '';
      var edgeDefinitions = [{collection: '', from: '', to: ''}];
      var orphanCollections = '';
      var title;
      var sorter = function (l, r) {
        l = l.toLowerCase();
        r = r.toLowerCase();
        if (l < r) {
          return -1;
        }
        if (l > r) {
          return 1;
        }
        return 0;
      };

      this.eCollList = [];
      this.removedECollList = [];

      collections.forEach(function (c) {
        if (c.get('isSystem')) {
          return;
        }
        if (c.get('type') === 'edge') {
          self.eCollList.push(c.id);
        } else {
          collList.push(c.id);
        }
      });
      window.modalView.enableHotKeys = false;
      this.counter = 0;

      if (graph) {
        if (isSmart) {
          title = 'Edit Smart Graph';
        } else {
          title = 'Edit Graph';
        }

        name = graph.get('_key');
        edgeDefinitions = graph.get('edgeDefinitions');
        if (!edgeDefinitions || edgeDefinitions.length === 0) {
          edgeDefinitions = [{collection: '', from: '', to: ''}];
        }
        orphanCollections = graph.get('orphanCollections');

        tableContent.push(
          window.modalView.createReadOnlyEntry(
            'editGraphName',
            'Name',
            name,
            'The name to identify the graph. Has to be unique'
          )
        );

        if (isSmart) {
          tableContent.push(
            window.modalView.createReadOnlyEntry(
              'smartGraphAttribute',
              'Smart Graph Attribute',
              graph.get('smartGraphAttribute'),
              'The attribute name that is used to smartly shard the vertices of a graph. \n' +
              'Every vertex in this Graph has to have this attribute. \n'
            )
          );
        }

        if (graph.get('numberOfShards')) {
          tableContent.push(
            window.modalView.createReadOnlyEntry(
              'numberOfShards',
              'Shards',
              graph.get('numberOfShards'),
              'Number of shards the graph is using.'
            )
          );
        }

        buttons.push(
          window.modalView.createDeleteButton('Delete', this.deleteGraph.bind(this))
        );
        buttons.push(
          window.modalView.createNotificationButton('Reset display settings', this.resetDisplaySettings.bind(this))
        );
        buttons.push(
          window.modalView.createSuccessButton('Save', this.saveEditedGraph.bind(this))
        );
      } else {
        title = 'Create Graph';

        tableContent.push(
          window.modalView.createTextEntry(
            'createNewGraphName',
            'Name',
            '',
            'The name to identify the graph. Has to be unique.',
            'graphName',
            true
          )
        );

        buttons.push(
          window.modalView.createSuccessButton('Create', this.createNewGraph.bind(this))
        );
      }

      edgeDefinitions.forEach(
        function (edgeDefinition) {
          if (frontendConfig.isEnterprise === true && frontendConfig.isCluster) {
            tableContent.push(
              window.modalView.createTextEntry(
                'new-numberOfShards',
                'Shards*',
                '',
                'Number of shards the smart graph is using.',
                '',
                false,
                [
                  {
                    rule: Joi.string().allow('').optional().regex(/^[0-9]*$/),
                    msg: 'Must be a number.'
                  }
                ]
              )
            );

            tableContent.push(
              window.modalView.createTextEntry(
                'new-smartGraphAttribute',
                'Smart Graph Attribute*',
                '',
                'The attribute name that is used to smartly shard the vertices of a graph. \n' +
                'Every vertex in this Graph has to have this attribute. \n' +
                'Cannot be modified later.',
                '',
                false,
                [
                  {
                    rule: Joi.string().allow('').optional(),
                    msg: 'Must be a string.'
                  }
                ]
              )
            );
          }

          if (frontendConfig.isCluster && !graph) {
            tableContent.push(
              window.modalView.createTextEntry(
                'general-numberOfShards',
                'Shards',
                '',
                'Number of shards the graph is using.',
                '',
                false,
                [
                  {
                    rule: Joi.string().allow('').optional().regex(/^[0-9]*$/),
                    msg: 'Must be a number.'
                  }
                ]
              )
            );
          }

          if (self.counter === 0) {
            if (edgeDefinition.collection) {
              self.removedECollList.push(edgeDefinition.collection);
              self.eCollList.splice(self.eCollList.indexOf(edgeDefinition.collection), 1);
            }
            tableContent.push(
              window.modalView.createSelect2Entry(
                'newEdgeDefinitions' + self.counter,
                'Edge definitions',
                edgeDefinition.collection,
                'An edge definition defines a relation of the graph',
                'Edge definitions',
                true,
                false,
                true,
                1,
                self.eCollList.sort(sorter)
              )
            );
          } else {
            tableContent.push(
              window.modalView.createSelect2Entry(
                'newEdgeDefinitions' + self.counter,
                'Edge definitions',
                edgeDefinition.collection,
                'An edge definition defines a relation of the graph',
                'Edge definitions',
                false,
                true,
                false,
                1,
                self.eCollList.sort(sorter)
              )
            );
          }
          tableContent.push(
            window.modalView.createSelect2Entry(
              'fromCollections' + self.counter,
              'fromCollections',
              edgeDefinition.from,
              'The collections that contain the start vertices of the relation.',
              'fromCollections',
              true,
              false,
              false,
              10,
              collList.sort(sorter)
            )
          );
          tableContent.push(
            window.modalView.createSelect2Entry(
              'toCollections' + self.counter,
              'toCollections',
              edgeDefinition.to,
              'The collections that contain the end vertices of the relation.',
              'toCollections',
              true,
              false,
              false,
              10,
              collList.sort(sorter)
            )
          );
          self.counter++;
        }
      );

      tableContent.push(
        window.modalView.createSelect2Entry(
          'newVertexCollections',
          'Vertex collections',
          orphanCollections,
          'Collections that are part of a graph but not used in an edge definition',
          'Vertex Collections',
          false,
          false,
          false,
          10,
          collList.sort(sorter)
        )
      );

      window.modalView.show(
        'modalGraphTable.ejs', title, buttons, tableContent, undefined, undefined, this.events
      );

      if ($('#tab-createGraph').parent().hasClass('active')) {
        self.hideSmartGraphOptions();
      }

      if (graph) {
        $('.modal-body table').css('border-collapse', 'separate');
        var i;

        $('.modal-body .spacer').remove();
        for (i = 0; i <= this.counter; i++) {
          $('#row_fromCollections' + i).show();
          $('#row_toCollections' + i).show();
          $('#row_newEdgeDefinitions' + i).addClass('first');
          $('#row_fromCollections' + i).addClass('middle');
          $('#row_toCollections' + i).addClass('last');
          $('#row_toCollections' + i).after('<tr id="spacer' + i + '" class="spacer"></tr>');
        }

        $('#graphTab').hide();
        $('#modal-dialog .modal-delete-confirmation').append(
          '<fieldset><input type="checkbox" id="dropGraphCollections" name="" value="">' +
          '<label for="dropGraphCollections">also drop collections?</label>' +
          '</fieldset>'
        );
      }
    },

    resetDisplaySettings: function () {
      var graphName = $('#editGraphName').val();

      var test = new window.GraphSettingsView({
        name: graphName,
        userConfig: window.App.userConfig
      });
      test.setDefaults(true, true);
      test.remove();

      window.modalView.hide();
      arangoHelper.arangoNotification('Graph', 'Reset successful.');
    },

    addRemoveDefinition: function (e) {
      var collList = []; var collections = this.options.collectionCollection.models;

      collections.forEach(function (c) {
        if (c.get('isSystem')) {
          return;
        }
        collList.push(c.id);
      });
      e.stopPropagation();
      var id = $(e.currentTarget).attr('id'); var number;
      if (id.indexOf('addAfter_newEdgeDefinitions') !== -1) {
        this.counter++;
        $('#row_newVertexCollections').before(
          this.edgeDefintionTemplate.render({
            number: this.counter
          })
        );
        $('#newEdgeDefinitions' + this.counter).select2({
          tags: this.eCollList,
          showSearchBox: false,
          minimumResultsForSearch: -1,
          width: '336px',
          maximumSelectionSize: 1
        });
        $('#fromCollections' + this.counter).select2({
          tags: collList,
          showSearchBox: false,
          minimumResultsForSearch: -1,
          width: '336px',
          maximumSelectionSize: 10
        });
        $('#toCollections' + this.counter).select2({
          tags: collList,
          showSearchBox: false,
          minimumResultsForSearch: -1,
          width: '336px',
          maximumSelectionSize: 10
        });
        window.modalView.undelegateEvents();
        window.modalView.delegateEvents(this.events);

        var i;
        $('.modal-body .spacer').remove();
        for (i = 0; i <= this.counter; i++) {
          $('#row_fromCollections' + i).show();
          $('#row_toCollections' + i).show();
          $('#row_newEdgeDefinitions' + i).addClass('first');
          $('#row_fromCollections' + i).addClass('middle');
          $('#row_toCollections' + i).addClass('last');
          $('#row_toCollections' + i).after('<tr id="spacer' + i + '" class="spacer"></tr>');
        }
        return;
      }
      if (id.indexOf('remove_newEdgeDefinitions') !== -1) {
        number = id.split('remove_newEdgeDefinitions')[1];
        $('#row_newEdgeDefinitions' + number).remove();
        $('#row_fromCollections' + number).remove();
        $('#row_toCollections' + number).remove();
        $('#spacer' + number).remove();
      }
    },

    calculateEdgeDefinitionMap: function () {
      var edgeDefinitionMap = {};
      this.collection.models.forEach(function (m) {
        m.get('edgeDefinitions').forEach(function (ed) {
          edgeDefinitionMap[ed.collection] = {
            from: ed.from,
            to: ed.to
          };
        });
      });
      return edgeDefinitionMap;
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, frontendConfig, Backbone, templateEngine, $, window, _ */
(function () {
  'use strict';

  window.GraphSettingsView = Backbone.View.extend({
    el: '#graphSettingsContent',

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      return this;
    },

    general: {
      'graph': {
        type: 'divider',
        name: 'Graph'
      },
      'nodeStart': {
        type: 'string',
        name: 'Startnode',
        desc: 'A valid node id or space seperated list of id\'s. If empty, a random node will be chosen.',
        value: 2
      },
      'layout': {
        type: 'select',
        name: 'Layout',
        desc: 'Different graph algorithms. No overlap is very fast (more than 5000 nodes), force is slower (less than 5000 nodes) and fruchtermann is the slowest (less than 500 nodes).',
        noverlap: {
          name: 'No overlap',
          val: 'noverlap'
        },
        force: {
          name: 'Force',
          val: 'force'
        },
        fruchtermann: {
          name: 'Fruchtermann',
          val: 'fruchtermann'
        }
      },
      'renderer': {
        type: 'select',
        name: 'Renderer',
        desc: 'Canvas enables editing, WebGL is only for displaying a graph but much faster.',
        canvas: {
          name: 'Canvas',
          val: 'canvas'
        },
        webgl: {
          name: 'WebGL (experimental)',
          val: 'webgl'
        }
      },
      'depth': {
        desc: 'Search depth, starting from your start node.',
        type: 'number',
        name: 'Search Depth',
        value: 2
      },
      'limit': {
        desc: 'Limit nodes count. If empty or zero, no limit is set.',
        type: 'number',
        name: 'Limit',
        value: 250
      }
    },

    specific: {
      'nodes': {
        type: 'divider',
        name: 'Nodes'
      },
      'nodeLabel': {
        type: 'string',
        name: 'Label',
        desc: 'Node label. Please choose a valid and available node attribute.',
        default: '_key'
      },
      'nodeLabelByCollection': {
        type: 'select',
        name: 'Add Collection Name',
        desc: 'Append collection name to the label?',
        yes: {
          name: 'Yes',
          val: 'true'
        },
        no: {
          name: 'No',
          val: 'false'
        }
      },
      'nodeColorByCollection': {
        type: 'select',
        name: 'Color By Collections',
        no: {
          name: 'No',
          val: 'false'
        },
        yes: {
          name: 'Yes',
          val: 'true'
        },
        desc: 'Should nodes be colorized by their collection? If enabled, node color and node color attribute will be ignored.'
      },
      'nodeColor': {
        type: 'color',
        name: 'Color',
        desc: 'Default node color. RGB or HEX value.',
        default: '#2ecc71'
      },
      'nodeColorAttribute': {
        type: 'string',
        name: 'Color Attribute',
        desc: 'If an attribute is given, nodes will then be colorized by the attribute. This setting ignores default node color if set.'
      },
      'nodeSizeByEdges': {
        type: 'select',
        name: 'Size By Connections',
        yes: {
          name: 'Yes',
          val: 'true'
        },
        no: {
          name: 'No',
          val: 'false'
        },
        desc: 'Should nodes be sized by their edges count? If enabled, node sizing attribute will be ignored.'
      },
      'nodeSize': {
        type: 'string',
        name: 'Sizing Attribute',
        desc: 'Default node size. Numeric value > 0.'
      },
      'edges': {
        type: 'divider',
        name: 'Edges'
      },
      'edgeLabel': {
        type: 'string',
        name: 'Label',
        desc: 'Default edge label.'
      },
      'edgeLabelByCollection': {
        type: 'select',
        name: 'Add Collection Name',
        desc: 'Set label text by collection. If activated edge label attribute will be ignored.',
        yes: {
          name: 'Yes',
          val: 'true'
        },
        no: {
          name: 'No',
          val: 'false'
        }
      },
      'edgeColorByCollection': {
        type: 'select',
        name: 'Color By Collections',
        no: {
          name: 'No',
          val: 'false'
        },
        yes: {
          name: 'Yes',
          val: 'true'
        },
        desc: 'Should edges be colorized by their collection? If enabled, edge color and edge color attribute will be ignored.'
      },
      'edgeColor': {
        type: 'color',
        name: 'Color',
        desc: 'Default edge color. RGB or HEX value.',
        default: '#cccccc'
      },
      'edgeColorAttribute': {
        type: 'string',
        name: 'Color Attribute',
        desc: 'If an attribute is given, edges will then be colorized by the attribute. This setting ignores default edge color if set.'
      },
      'edgeEditable': {
        type: 'select',
        hide: 'true',
        name: 'Editable',
        yes: {
          name: 'Yes',
          val: 'true'
        },
        no: {
          name: 'No',
          val: 'false'
        },
        desc: 'Should edges be editable?'
      },
      'edgeType': {
        type: 'select',
        name: 'Type',
        desc: 'The type of the edge',
        line: {
          name: 'Line',
          val: 'line'
        },
        arrow: {
          name: 'Arrow',
          val: 'arrow'
        },
        curve: {
          name: 'Curve',
          val: 'curve'
        },
        dotted: {
          name: 'Dotted',
          val: 'dotted'
        },
        dashed: {
          name: 'Dashed',
          val: 'dashed'
        },
        tapered: {
          name: 'Tapered',
          val: 'tapered'
        }
      }
    },

    template: templateEngine.createTemplate('graphSettingsView.ejs'),

    initialize: function (options) {
      this.name = options.name;
      this.userConfig = options.userConfig;
      this.saveCallback = options.saveCallback;

      if (options.noDefinedGraph) {
        this.noDefinedGraph = options.noDefinedGraph;
      }
    },

    events: {
      'click #saveGraphSettings': 'saveGraphSettings',
      'click #restoreGraphSettings': 'setDefaults',
      'keyup #graphSettingsView input': 'checkEnterKey',
      'keyup #graphSettingsView select': 'checkEnterKey',
      'change input[type="range"]': 'saveGraphSettings',
      'change input[type="color"]': 'checkColor',
      'change select': 'saveGraphSettings',
      'focus #graphSettingsView input': 'lastFocus',
      'focus #graphSettingsView select': 'lastFocus',
      'focusout #graphSettingsView input[type="text"]': 'checkinput'
    },

    lastFocus: function (e) {
      this.lastFocussed = e.currentTarget.id;
      this.lastFocussedValue = $(e.currentTarget).val();
    },

    checkinput: function (e) {
      if ((new Date() - this.lastSaved > 500)) {
        if (e.currentTarget.id === this.lastFocussed) {
          if (this.lastFocussedValue !== $(e.currentTarget).val()) {
            this.saveGraphSettings();
          }
        }
      }
    },

    checkEnterKey: function (e) {
      if (e.keyCode === 13) {
        this.saveGraphSettings(e);
      }
    },

    getGraphSettings: function (render) {
      var self = this;
      var combinedName = frontendConfig.db + '_' + this.name;

      this.userConfig.fetch({
        success: function (data) {
          self.graphConfig = data.toJSON().graphs[combinedName];
          if (render) {
            self.continueRender();
          }
        }
      });
    },

    checkColor: function () {
      this.saveGraphSettings(null, true);
    },

    saveGraphSettings: function (event, color, nodeStart, overwrite, silent, userCallback) {
      var self = this;

      var updateCols = function () {
        var nodes = !$('#g_nodeColor').is(':disabled');
        var edges = !$('#g_edgeColor').is(':disabled');

        window.App.graphViewer.updateColors(
          nodes,
          edges,
          $('#g_nodeColor').val(),
          $('#g_edgeColor').val()
        );
      };

      if (!this.noDefinedGraph) {
        // usual graph view mode
        // communication is needed
        self.lastSaved = new Date();
        var combinedName = frontendConfig.db + '_' + this.name;

        var config = {};

        if (overwrite) {
          config[combinedName] = overwrite;
        } else {
          var object = {};

          var id;
          $('#graphSettingsView select').each(function (key, elem) {
            id = elem.id;
            object[id.substr(2, elem.id.length)] = $(elem).val();
          });
          $('#graphSettingsView input').each(function (key, elem) {
            id = elem.id;
            object[id.substr(2, elem.id.length)] = $(elem).val();
          });

          config[combinedName] = object;
        }

        if (nodeStart) {
          config[combinedName].nodeStart = nodeStart;
        }

        var callback = function () {
          if (window.App.graphViewer) {
            // no complete rerender needed
            // LAYOUT
            var value;

            if (event) {
              if (event.currentTarget.id === 'g_layout') {
                window.App.graphViewer.switchLayout($('#g_layout').val());
                return;
                // NODES COLORING
              } else if (event.currentTarget.id === 'g_nodeColorByCollection') {
                value = $('#g_nodeColorByCollection').val();
                if (value === 'true') {
                  window.App.graphViewer.switchNodeColorByCollection(true);
                } else {
                  if ($('#g_nodeColorAttribute').is(':disabled')) {
                    window.App.graphViewer.switchNodeColorByCollection(false);
                  } else {
                    window.App.graphViewer.switchNodeColorByCollection(false, true);
                  }
                }
                return;
                // EDGES COLORING
              } else if (event.currentTarget.id === 'g_edgeColorByCollection') {
                value = $('#g_edgeColorByCollection').val();
                if (value === 'true') {
                  window.App.graphViewer.switchEdgeColorByCollection(true);
                } else {
                  if ($('#g_nodeColorAttribute').is(':disabled')) {
                    window.App.graphViewer.switchEdgeColorByCollection(false);
                  } else {
                    window.App.graphViewer.switchEdgeColorByCollection(false, true);
                  }
                }
                return;
              }
            }

            if (color !== '' && color !== undefined) {
              updateCols();
            } else {
              // complete render necessary - e.g. data needed
              window.App.graphViewer.render(self.lastFocussed);
            }
          } else {
            if (!silent) {
              arangoHelper.arangoNotification('Graph ' + this.name, 'Configuration saved.');
            }
          }
          if (userCallback) {
            userCallback();
          }
        }.bind(this);

        this.userConfig.setItem('graphs', config, callback);
      } else {
        // aql mode - only visual

        var value;
        if (color) {
          updateCols();
        } else if (event.currentTarget.id === 'g_layout') {
          window.App.graphViewer.rerenderAQL($('#g_layout').val(), null);
        } else if (event.currentTarget.id === 'g_nodeColorByCollection') {
          value = $('#g_nodeColorByCollection').val();
          if (value === 'true') {
            window.App.graphViewer.switchNodeColorByCollection(true);
          } else {
            window.App.graphViewer.switchNodeColorByCollection(false);
          }
        } else if (event.currentTarget.id === 'g_edgeColorByCollection') {
          value = $('#g_edgeColorByCollection').val();
          if (value === 'true') {
            window.App.graphViewer.switchEdgeColorByCollection(true);
          } else {
            window.App.graphViewer.switchEdgeColorByCollection(false);
          }
        } else if (event.currentTarget.id === 'g_nodeSizeByEdges') {
          value = $('#g_nodeSizeByEdges').val();
          if (value === 'true') {
            window.App.graphViewer.switchNodeSizeByCollection(true);
          } else {
            window.App.graphViewer.switchNodeSizeByCollection(false);
          }
        } else if (event.currentTarget.id === 'g_edgeType') {
          window.App.graphViewer.switchEdgeType($('#g_edgeType').val());
        }
      }
      this.handleDependencies();
    },

    setDefaults: function (saveOnly, silent, callback) {
      var obj = {
        layout: 'force',
        renderer: 'canvas',
        depth: '2',
        limit: '250',
        nodeColor: '#2ecc71',
        nodeColorAttribute: '',
        nodeColorByCollection: 'true',
        edgeColor: '#cccccc',
        edgeColorAttribute: '',
        edgeColorByCollection: 'false',
        nodeLabel: '_key',
        edgeLabel: '',
        edgeType: 'arrow',
        nodeSize: '',
        nodeSizeByEdges: 'true',
        edgeEditable: 'true',
        nodeLabelByCollection: 'false',
        edgeLabelByCollection: 'false',
        nodeStart: '',
        barnesHutOptimize: true
      };

      if (saveOnly === true) {
        if (silent) {
          this.saveGraphSettings(null, null, null, obj, silent, callback);
        } else {
          this.saveGraphSettings(null, null, null, obj);
        }
      } else {
        this.saveGraphSettings(null, null, null, obj, null);
        this.render();
        window.App.graphViewer.render(this.lastFocussed);
      }
    },

    toggle: function () {
      if ($(this.el).is(':visible')) {
        this.hide();
      } else {
        this.show();
      }
    },

    show: function () {
      $(this.el).show('slide', {direction: 'right'}, 250);
    },

    hide: function () {
      $(this.el).hide('slide', {direction: 'right'}, 250);
    },

    render: function () {
      if (this.noDefinedGraph) {
        // aql render mode
        this.continueRender();
      } else {
        // standard gv mode
        this.getGraphSettings(true);
        this.lastSaved = new Date();
      }
    },

    handleDependencies: function () {
      // node sizing
      if ($('#g_nodeSizeByEdges').val() === 'true') {
        $('#g_nodeSize').prop('disabled', true);
      } else {
        $('#g_nodeSize').removeAttr('disabled');
      }

      // node color
      if ($('#g_nodeColorByCollection').val() === 'true') {
        $('#g_nodeColorAttribute').prop('disabled', true);
        $('#g_nodeColor').prop('disabled', true);
      } else {
        $('#g_nodeColorAttribute').removeAttr('disabled');
        $('#g_nodeColor').removeAttr('disabled');
      }

      if (!this.noDefinedGraph) {
        if ($('#g_nodeColorAttribute').val() !== '') {
          $('#g_nodeColor').prop('disabled', true);
        }
      }

      // edge color
      if ($('#g_edgeColorByCollection').val() === 'true') {
        $('#g_edgeColorAttribute').prop('disabled', true);
        $('#g_edgeColor').prop('disabled', true);
      } else {
        $('#g_edgeColorAttribute').removeAttr('disabled');
        $('#g_edgeColor').removeAttr('disabled');
      }

      if (!this.noDefinedGraph) {
        if ($('#g_edgeColorAttribute').val() !== '') {
          $('#g_edgeColor').prop('disabled', true);
        }
      }
    },

    continueRender: function () {
      $(this.el).html(this.template.render({
        general: this.general,
        specific: this.specific
      }));

      arangoHelper.fixTooltips('.gv-tooltips', 'top');

      if (this.graphConfig) {
        _.each(this.graphConfig, function (val, key) {
          $('#g_' + key).val(val);
        });
      } else {
        if (!this.noDefinedGraph) {
          this.setDefaults(true);
        } else {
          this.fitSettingsAQLMode();
        }
      }

      this.handleDependencies();
    },

    fitSettingsAQLMode: function () {
      var toDisable = [
        'g_nodeStart', 'g_depth', 'g_limit', 'g_renderer',
        'g_nodeLabel', 'g_nodeLabelByCollection', 'g_nodeColorAttribute',
        'g_nodeSize', 'g_edgeLabel', 'g_edgeColorAttribute', 'g_edgeLabelByCollection'
      ];

      _.each(toDisable, function (elem) {
        $('#' + elem).parent().prev().remove();
        $('#' + elem).parent().remove();
      });

      $('#saveGraphSettings').remove();
      $('#restoreGraphSettings').remove();

      // overwrite usual defaults
      $('#g_nodeColorByCollection').val('false');
      $('#g_edgeColorByCollection').val('false');
      $('#g_nodeSizeByEdges').val('false');
      $('#g_edgeType').val('arrow');
      $('#g_layout').val('force');
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, _, frontendConfig, slicePath, icon, Joi, wheelnav, document, sigma, Backbone, templateEngine, $, window */
(function () {
  'use strict';

  window.GraphViewer = Backbone.View.extend({
    el: '#content',

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    template: templateEngine.createTemplate('graphViewer2.ejs'),

    initialize: function (options) {
      var self = this;

      // aql preview only mode
      if (options.id) {
        // dynamically set id if available
        this.setElement(options.id);
        this.graphData = options.data;
        this.aqlMode = true;
      }

      // aql to graph viewer mode
      if (options.noDefinedGraph) {
        this.noDefinedGraph = options.noDefinedGraph;
        this.graphData = options.data;
      }

      this.name = options.name;
      this.userConfig = options.userConfig;
      this.documentStore = options.documentStore;

      if (this.name !== undefined) {
        this.collection.fetch({
          cache: false,
          success: function (data) {
            self.model = self.collection.findWhere({_key: options.name}).toJSON();
          }
        });
      }
    },

    colors: {
      hotaru: ['#364C4A', '#497C7F', '#92C5C0', '#858168', '#CCBCA5'],
      random1: ['#292F36', '#4ECDC4', '#F7FFF7', '#DD6363', '#FFE66D'],
      jans: ['rgba(166, 109, 161, 1)', 'rgba(64, 74, 83, 1)', 'rgba(90, 147, 189, 1)', 'rgba(153,63,0,1)', 'rgba(76,0,92,1)', 'rgba(25,25,25,1)', 'rgba(0,92,49,1)', 'rgba(43,206,72,1)', 'rgba(255,204,153,1)', 'rgba(128,128,128,1)', 'rgba(148,255,181,1)', 'rgba(143,124,0,1)', 'rgba(157,204,0,1)', 'rgba(194,0,136,1)', 'rgba(0,51,128,1)', 'rgba(255,164,5,1)', 'rgba(255,168,187,1)', 'rgba(66,102,0,1)', 'rgba(255,0,16,1)', 'rgba(94,241,242,1)', 'rgba(0,153,143,1)', 'rgba(224,255,102,1)', 'rgba(116,10,255,1)', 'rgba(153,0,0,1)', 'rgba(255,255,128,1)', 'rgba(255,255,0,1)', 'rgba(255,80,5,1)'],
      gv: [
        '#68BDF6',
        '#6DCE9E',
        '#FF756E',
        '#DE9BF9',
        '#FB95AF',
        '#FFD86E',
        '#A5ABB6'
      ]
    },

    activeNodes: [],
    selectedNodes: {},

    aqlMode: false,

    events: {
      'click #downloadPNG': 'downloadPNG',
      'click #loadFullGraph': 'loadFullGraphModal',
      'click #reloadGraph': 'reloadGraph',
      'click #settingsMenu': 'toggleSettings',
      'click #toggleForce': 'toggleLayout',
      'click #selectNodes': 'toggleLasso'
    },

    cursorX: 0,
    cursorY: 0,

    layouting: false,

    model: null,

    viewStates: {
      captureMode: false
    },

    graphConfig: null,
    graphSettings: null,

    downloadPNG: function () {
      var size = parseInt($('#graph-container').width(), 10);
      sigma.plugins.image(this.currentGraph, this.currentGraph.renderers[0], {
        download: true,
        size: size,
        clip: true,
        labels: true,
        background: 'white',
        zoom: false
      });
    },

    loadFullGraphModal: function () {
      var buttons = []; var tableContent = [];

      tableContent.push(
        window.modalView.createReadOnlyEntry(
          'load-full-graph-a',
          'Caution',
          'Really load full graph? If no limit is set, your result set could be too big.')
      );

      buttons.push(
        window.modalView.createSuccessButton('Load full graph', this.loadFullGraph.bind(this))
      );

      window.modalView.show(
        'modalTable.ejs',
        'Load full graph',
        buttons,
        tableContent
      );
    },

    loadFullGraph: function () {
      var self = this;
      var ajaxData = {};

      if (this.graphConfig) {
        ajaxData = _.clone(this.graphConfig);

        // remove not needed params
        delete ajaxData.layout;
        delete ajaxData.edgeType;
        delete ajaxData.renderer;
      }
      ajaxData.mode = 'all';

      $.ajax({
        type: 'GET',
        url: arangoHelper.databaseUrl('/_admin/aardvark/graph/' + encodeURIComponent(this.name)),
        contentType: 'application/json',
        data: ajaxData,
        success: function (data) {
          self.killCurrentGraph();
          self.renderGraph(data);
        },
        error: function (e) {
          console.log(e);
          arangoHelper.arangoError('Graph', 'Could not load full graph.');
        }
      });
      window.modalView.hide();
    },

    resize: function () {
      // adjust container widht + height
      $('#graph-container').width($('.centralContent').width());
      $('#graph-container').height($('.centralRow').height() - 155);
    },

    toggleSettings: function () {
      this.graphSettingsView.toggle();
    },

    render: function (toFocus) {
      this.$el.html(this.template.render({}));

      // render navigation
      $('#subNavigationBar .breadcrumb').html(
        'Graph: ' + this.name
      );

      this.resize();
      this.fetchGraph(toFocus);

      this.initFullscreen();
    },

    initFullscreen: function () {
      var self = this;

      if (window.App.initializedFullscreen === false || window.App.initializedFullscreen === undefined) {
        window.App.initializedFullscreen = true;
        this.isFullscreen = false;

        var exitHandler = function (a) {
          if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement !== null) {
            if (self.isFullscreen === false) {
              self.isFullscreen = true;

              // FULLSCREEN STYLING
              $('#toggleForce').css('bottom', '10px');
              $('#toggleForce').css('right', '10px');

              $('#objectCount').css('bottom', '10px');
              $('#objectCount').css('left', '10px');

              $('.nodeInfoDiv').css('top', '10px');
              $('.nodeInfoDiv').css('left', '10px');
            } else {
              self.isFullscreen = false;

              // NO FULLSCREEN STYLING
              $('#toggleForce').css('bottom', '40px');
              $('#toggleForce').css('right', '40px');

              $('#objectCount').css('bottom', '50px');
              $('#objectCount').css('left', '25px');

              $('.nodeInfoDiv').css('top', '');
              $('.nodeInfoDiv').css('left', '165px');
            }
          }
        };

        if (document.addEventListener) {
          document.addEventListener('webkitfullscreenchange', exitHandler, false);
          document.addEventListener('mozfullscreenchange', exitHandler, false);
          document.addEventListener('fullscreenchange', exitHandler, false);
          document.addEventListener('MSFullscreenChange', exitHandler, false);
        }
      }
    },

    renderAQLPreview: function (data) {
      this.$el.html(this.template.render({}));

      // remove not needed elements
      this.$el.find('.headerBar').remove();

      // set graph box height
      var height = $('.centralRow').height() - 250;
      this.$el.find('#graph-container').css('height', height);

      // render
      this.graphData.modified = this.parseData(this.graphData.original, this.graphData.graphInfo);

      var success = false;
      try {
        this.renderGraph(this.graphData.modified, null, true);
        success = true;
      } catch (ignore) {
      }

      return success;
    },

    renderAQL: function (data) {
      this.$el.html(this.template.render({}));

      // render navigation
      $('#subNavigationBar .breadcrumb').html(
        'AQL Graph'
      );
      $('#subNavigationBar .bottom').html('');
      $('.queries-menu').removeClass('active');

      this.resize();
      this.graphData.modified = this.parseData(this.graphData.original, this.graphData.graphInfo);
      this.renderGraph(this.graphData.modified, null, false);

      this.initFullscreen();

      // init & render graph settings view
      this.graphSettingsView = new window.GraphSettingsView({
        name: this.name,
        userConfig: undefined,
        saveCallback: undefined,
        noDefinedGraph: true
      });
      this.graphSettingsView.render();
    },

    killCurrentGraph: function () {
      for (var i in this.currentGraph.renderers) {
        try {
          this.currentGraph.renderers[i].clear();
          this.currentGraph.kill(i);
        } catch (ignore) {
          // no need to cleanup
        }
      }
    },

    rerenderAQL: function (layout, renderer) {
      this.killCurrentGraph();
      // TODO add WebGL features
      this.renderGraph(this.graphData.modified, null, false, layout, 'canvas');
      if ($('#g_nodeColorByCollection').val() === 'true') {
        this.switchNodeColorByCollection(true);
      } else {
        if ($('#g_nodeColor').is(':disabled')) {
          this.updateColors(true, true, null, null, true);
        } else {
          if (this.ncolor) {
            this.updateColors(true, true, this.ncolor, this.ecolor);
          } else {
            this.updateColors(true, true, '#2ecc71', '#2ecc71');
          }
        }
      }

      if ($('#g_edgeColorByCollection').val() === 'true') {
        this.switchEdgeColorByCollection(true);
      } else {
        if ($('#g_edgeColor').is(':disabled')) {
          this.updateColors(true, true, null, null, true);
        } else {
          if (this.ecolor) {
            this.updateColors(true, true, this.ncolor, this.ecolor);
          } else {
            this.updateColors(true, true, '#2ecc71', '#2ecc71');
          }
        }
      }
    },

    buildCollectionColors: function () {
      var self = this;

      if (!self.collectionColors) {
        self.collectionColors = {};
        var pos = 0;
        var tmpNodes = {};
        var tmpEdges = {};

        _.each(this.currentGraph.graph.nodes(), function (node) {
          tmpNodes[node.id] = undefined;
        });

        _.each(self.currentGraph.graph.edges(), function (edge) {
          tmpEdges[edge.id] = undefined;
        });

        _.each(tmpNodes, function (node, key) {
          if (self.collectionColors[key.split('/')[0]] === undefined) {
            self.collectionColors[key.split('/')[0]] = {color: self.colors.jans[pos]};
            pos++;
          }
        });

        pos = 0;
        _.each(tmpEdges, function (edge, key) {
          if (self.collectionColors[key.split('/')[0]] === undefined) {
            self.collectionColors[key.split('/')[0]] = {color: self.colors.jans[pos]};
            pos++;
          }
        });
      }
    },

    switchNodeColorByCollection: function (boolean, origin) {
      var self = this;
      self.buildCollectionColors();
      if (boolean) {
        self.currentGraph.graph.nodes().forEach(function (n) {
          n.color = self.collectionColors[n.id.split('/')[0]].color;
        });

        self.currentGraph.refresh();
      } else {
        if (origin) {
          this.updateColors(true, null, null, null, origin);
        } else {
          if (this.ncolor) {
            this.updateColors(true, null, this.ncolor, this.ecolor);
          } else {
            this.updateColors(true, null, '#2ecc71', '#2ecc71');
          }
        }
      }
    },

    switchEdgeColorByCollection: function (boolean, origin) {
      var self = this;
      self.buildCollectionColors();

      if (boolean) {
        self.currentGraph.graph.edges().forEach(function (n) {
          n.color = self.collectionColors[n.id.split('/')[0]].color;
        });

        self.currentGraph.refresh();
      } else {
        if (origin) {
          this.updateColors(true, null, null, null, origin);
        } else {
          if (this.ecolor) {
            this.updateColors(null, true, this.ncolor, this.ecolor);
          } else {
            this.updateColors(null, true, '#2ecc71', '#2ecc71');
          }
        }
      }
    },

    buildCollectionSizes: function () {
      var self = this;

      if (!self.nodeEdgesCount) {
        self.nodeEdgesCount = {};
        var handledEdges = {};

        _.each(this.currentGraph.graph.edges(), function (edge) {
          if (handledEdges[edge.id] === undefined) {
            handledEdges[edge.id] = true;

            if (self.nodeEdgesCount[edge.source] === undefined) {
              self.nodeEdgesCount[edge.source] = 1;
            } else {
              self.nodeEdgesCount[edge.source] += 1;
            }

            if (self.nodeEdgesCount[edge.target] === undefined) {
              self.nodeEdgesCount[edge.target] = 1;
            } else {
              self.nodeEdgesCount[edge.target] += 1;
            }
          }
        });
      }
    },

    switchNodeSizeByCollection: function (boolean) {
      var self = this;
      if (boolean) {
        self.buildCollectionSizes();
        self.currentGraph.graph.nodes().forEach(function (n) {
          n.size = self.nodeEdgesCount[n.id];
        });
      } else {
        self.currentGraph.graph.nodes().forEach(function (n) {
          n.size = 15;
        });
      }
      self.currentGraph.refresh();
    },

    switchEdgeType: function (edgeType) {
      var data = {
        nodes: this.currentGraph.graph.nodes(),
        edges: this.currentGraph.graph.edges(),
        settings: {}
      };

      this.killCurrentGraph();
      this.renderGraph(data, null, false, null, null, edgeType);
    },

    switchLayout: function (layout) {
      var data = {
        nodes: this.currentGraph.graph.nodes(),
        edges: this.currentGraph.graph.edges(),
        settings: {}
      };

      this.killCurrentGraph();
      this.renderGraph(data, null, false, layout);

      if ($('#g_nodeColorByCollection').val() === 'true') {
        this.switchNodeColorByCollection(true);
      }
      if ($('#g_edgeColorByCollection').val() === 'true') {
        this.switchEdgeColorByCollection(true);
      } else {
        this.switchEdgeColorByCollection(false);
      }
    },

    parseData: function (data, type) {
      var vertices = {}; var edges = {};
      var color = '#2ecc71';

      var returnObj = {
        nodes: [],
        edges: [],
        settings: {}
      };

      if (this.ncolor) {
        color = this.ncolor;
      }

      if (type === 'object') {
        _.each(data, function (obj) {
          if (obj.edges && obj.vertices) {
            _.each(obj.edges, function (edge) {
              if (edge !== null) {
                edges[edge._id] = {
                  id: edge._id,
                  source: edge._from,
                  // label: edge._key,
                  color: '#cccccc',
                  target: edge._to
                };
              }
            });

            _.each(obj.vertices, function (node) {
              if (node !== null) {
                vertices[node._id] = {
                  id: node._id,
                  label: node._key,
                  size: 0.3,
                  color: color,
                  x: Math.random(),
                  y: Math.random()
                };
              }
            });
          }
        });

        var nodeIds = [];
        _.each(vertices, function (node) {
          returnObj.nodes.push(node);
          nodeIds.push(node.id);
        });

        _.each(edges, function (edge) {
          if (nodeIds.includes(edge.source) && nodeIds.includes(edge.target)) {
            returnObj.edges.push(edge);
          }
          /* how to handle not correct data?
          else {
            console.log('target to from is missing');
          }
          */
        });
      } else if (type === 'array') {
        _.each(data, function (edge) {
          vertices[edge._from] = null;
          vertices[edge._to] = null;

          returnObj.edges.push({
            id: edge._id,
            source: edge._from,
            // label: edge._key,
            color: '#cccccc',
            target: edge._to
          });
        });

        _.each(vertices, function (val, key) {
          returnObj.nodes.push({
            id: key,
            label: key,
            size: 0.3,
            color: color,
            x: Math.random(),
            y: Math.random()
          });
        });
      }

      return returnObj;
    },

    rerender: function () {
      this.fetchGraph();
    },

    fetchGraph: function (toFocus) {
      var self = this;
      // arangoHelper.buildGraphSubNav(self.name, 'Content');
      $(this.el).append(
        '<div id="calculatingGraph" style="position: absolute; left: 25px; top: 130px;">' +
          '<i class="fa fa-circle-o-notch fa-spin" style="margin-right: 10px;"></i>' +
            '<span id="calcText">Fetching graph data. Please wait ... </span></br></br></br>' +
              '<span style="font-weight: 100; opacity: 0.6; font-size: 9pt;">If it`s taking too much time to draw the graph, please navigate to: ' +
                '<a style="font-weight: 500" href="' + window.location.href + '/graphs">Graphs View</a></br>Click the settings icon and reset the display settings.' +
                  'It is possible that the graph is too big to be handled by the browser.</span></div>'
      );

      var continueFetchGraph = function () {
        var ajaxData = {};
        if (self.graphConfig) {
          ajaxData = _.clone(self.graphConfig);

          // remove not needed params - client only
          delete ajaxData.layout;
          delete ajaxData.edgeType;
          delete ajaxData.renderer;
        }

        if (self.tmpStartNode) {
          if (self.graphConfig) {
            if (self.graphConfig.nodeStart.length === 0) {
              ajaxData.nodeStart = self.tmpStartNode;
            }
          } else {
            ajaxData.nodeStart = self.tmpStartNode;
          }
        }

        self.setupSigma();

        self.fetchStarted = new Date();
        $.ajax({
          type: 'GET',
          url: arangoHelper.databaseUrl('/_admin/aardvark/graph/' + encodeURIComponent(self.name)),
          contentType: 'application/json',
          data: ajaxData,
          success: function (data) {
            if (data.empty === true) {
              self.renderGraph(data, toFocus);
            } else {
              if (data.settings) {
                if (data.settings.startVertex && self.graphConfig.startNode === undefined) {
                  if (self.tmpStartNode === undefined) {
                    self.tmpStartNode = data.settings.startVertex._id;
                  }
                }
              }

              self.fetchFinished = new Date();
              self.calcStart = self.fetchFinished;
              $('#calcText').html('Server response took ' + Math.abs(self.fetchFinished.getTime() - self.fetchStarted.getTime()) + ' ms. Initializing graph engine. Please wait ... ');
              // arangoHelper.buildGraphSubNav(self.name, 'Content');
              window.setTimeout(function () {
                self.renderGraph(data, toFocus);
              }, 50);
            }
          },
          error: function (e) {
            try {
              var message;
              if (e.responseJSON.exception) {
                message = e.responseJSON.exception;
                var found = e.responseJSON.exception.search('1205');
                if (found !== -1) {
                  var string = 'Starting point: <span style="font-weight: 400">' + self.graphConfig.nodeStart + '</span> is invalid';
                  $('#calculatingGraph').html(
                    '<div style="font-weight: 300; font-size: 10.5pt"><span style="font-weight: 400">Stopped. </span></br></br>' +
                    string +
                    '. Please <a style="color: #3498db" href="' + window.location.href +
                    '/settings">choose a different start node.</a></div>'
                  );
                } else {
                  $('#calculatingGraph').html('Failed to fetch graph information.');
                }
              } else {
                message = e.responseJSON.errorMessage;
                $('#calculatingGraph').html('Failed to fetch graph information: ' + e.responseJSON.errorMessage);
              }
              arangoHelper.arangoError('Graph', message);
            } catch (ignore) {}
          }
        });
      };

      if (self.graphConfig === undefined || self.graphConfig === null) {
        self.userConfig.fetch({
          success: function (data) {
            var combinedName = frontendConfig.db + '_' + self.name;
            try {
              self.graphConfig = data.toJSON().graphs[combinedName];
              self.getGraphSettings(continueFetchGraph);

              if (self.graphConfig === undefined || self.graphConfig === null) {
                self.graphSettingsView = new window.GraphSettingsView({
                  name: self.name,
                  userConfig: self.userConfig,
                  saveCallback: self.render
                });
                self.graphSettingsView.setDefaults(true, true);
              } else {
                // init settings view
                if (self.graphSettingsView) {
                  self.graphSettingsView.remove();
                }
                self.graphSettingsView = new window.GraphSettingsView({
                  name: self.name,
                  userConfig: self.userConfig,
                  saveCallback: self.render
                });
              }
            } catch (ignore) {
              // continue without config
              self.getGraphSettings(continueFetchGraph);
            }
          }
        });
      } else {
        this.getGraphSettings(continueFetchGraph);
      }
    },

    setupSigma: function () {
      if (this.graphConfig) {
        if (this.graphConfig.edgeLabel) {
          // Initialize package:
          sigma.utils.pkg('sigma.settings');

          var settings = {
            defaultEdgeLabelColor: '#000',
            defaultEdgeLabelActiveColor: '#000',
            defaultEdgeLabelSize: 12,
            edgeLabelSize: 'fixed',
            edgeLabelThreshold: 1,
            edgeLabelSizePowRatio: 1
          };

          // Export the previously designed settings:
          sigma.settings = sigma.utils.extend(sigma.settings || {}, settings);

          // Override default settings:
          sigma.settings.drawEdgeLabels = true;
          sigma.settings.clone = true;
        }
      }
    },

    contextState: {
      createEdge: false,
      _from: false,
      _to: false,
      fromX: false,
      fromY: false
    },

    clearOldContextMenu: function (states) {
      var self = this;

      // clear dom
      $('#nodeContextMenu').remove();
      var string = '<div id="nodeContextMenu" class="nodeContextMenu animated zoomIn"></div>';
      $('#graph-container').append(string);

      // clear state
      if (states) {
        _.each(this.contextState, function (val, key) {
          self.contextState[key] = false;
        });
      }

      // clear events
      var c = document.getElementsByClassName('sigma-mouse')[0];
      c.removeEventListener('mousemove', self.drawLine.bind(this), false);
    },

    trackCursorPosition: function (e) {
      this.cursorX = e.x;
      this.cursorY = e.y;
    },

    deleteNode: function (e, id) {
      var self = this;
      var documentKey;
      var collectionId;
      var documentId;

      if (id) {
        documentKey = id;
      } else {
        documentKey = $('#delete-node-attr-id').text();
      }
      collectionId = documentKey.split('/')[0];
      documentId = documentKey.split('/')[1];

      var url = arangoHelper.databaseUrl(
        '/_api/gharial/' + encodeURIComponent(self.name) + '/vertex/' + encodeURIComponent(documentKey.split('/')[0]) + '/' + encodeURIComponent(documentKey.split('/')[1])
      );

      if ($('#delete-node-edges-attr').val() === 'yes') {
        $.ajax({
          cache: false,
          type: 'DELETE',
          contentType: 'application/json',
          url: url,
          success: function (data) {
            self.currentGraph.graph.dropNode(documentKey);
            self.currentGraph.refresh();
          },
          error: function () {
            arangoHelper.arangoError('Graph', 'Could not delete node.');
          }
        });
      } else {
        var callback = function (error) {
          if (!error) {
            self.currentGraph.graph.dropNode(documentKey);

            // rerender graph
            self.currentGraph.refresh();
          } else {
            arangoHelper.arangoError('Graph', 'Could not delete node.');
          }
        };

        this.documentStore.deleteDocument(collectionId, documentId, callback);
      }
      window.modalView.hide();
    },

    deleteNodes: function () {
      var self = this;

      try {
        var arr = JSON.parse($('#delete-nodes-arr-id').text());
        _.each(arr, function (id) {
          self.deleteNode(null, id);
        });
      } catch (ignore) {
      }
    },

    deleteNodesModal: function () {
      var nodeIds = [];

      _.each(this.selectedNodes, function (id) {
        nodeIds.push(id);
      });

      if (nodeIds.length === 0) {
        arangoHelper.arangoNotification('Graph', 'No nodes selected.');
        return;
      }

      var buttons = []; var tableContent = [];

      tableContent.push(
        window.modalView.createReadOnlyEntry('delete-nodes-arr-id', 'Really delete nodes', JSON.stringify(nodeIds))
      );

      buttons.push(
        window.modalView.createDeleteButton('Delete', this.deleteNodes.bind(this))
      );

      window.modalView.show(
        'modalTable.ejs',
        'Delete nodes',
        buttons,
        tableContent
      );
    },

    deleteNodeModal: function (nodeId) {
      var buttons = []; var tableContent = [];

      tableContent.push(
        window.modalView.createReadOnlyEntry('delete-node-attr-id', 'Really delete node', nodeId)
      );

      if (!this.noDefinedGraph) {
        tableContent.push(
          window.modalView.createSelectEntry(
            'delete-node-edges-attr',
            'Also delete edges?',
            undefined,
            undefined,
            [
              {
                value: 'yes',
                label: 'Yes'
              },
              {
                value: 'no',
                label: 'No'
              }
            ]
          )
        );
      }

      buttons.push(
        window.modalView.createDeleteButton('Delete', this.deleteNode.bind(this))
      );

      window.modalView.show(
        'modalTable.ejs',
        'Delete node',
        buttons,
        tableContent
      );
    },

    addNode: function () {
      var self = this;

      var collection = $('.modal-body #new-node-collection-attr').val();
      var key = $('.modal-body #new-node-key-attr').last().val();

      var callback = function (error, id, msg) {
        if (error) {
          arangoHelper.arangoError('Could not create node', msg);
        } else {
          $('#emptyGraph').remove();
          self.currentGraph.graph.addNode({
            id: id,
            label: id.split('/')[1] || '',
            size: self.graphConfig.nodeSize || 15,
            color: self.graphConfig.nodeColor || self.ncolor || '#2ecc71',
            originalColor: self.graphConfig.nodeColor || self.ncolor || '#2ecc71',
            x: self.addNodeX + self.currentGraph.camera.x,
            y: self.addNodeY + self.currentGraph.camera.y
          });

          window.modalView.hide();
          // rerender graph
          self.currentGraph.refresh();

          // move camera to added node
          self.cameraToNode(self.currentGraph.graph.nodes(id));
        }
      };
      var data = {};
      if (key !== '' && key !== undefined) {
        data._key = key;
      }
      if (this.graphSettings.isSmart) {
        var smartAttribute = $('#new-smart-key-attr').val();
        if (smartAttribute !== '' && smartAttribute !== undefined) {
          data[this.graphSettings.smartGraphAttribute] = smartAttribute;
        } else {
          data[this.graphSettings.smartGraphAttribute] = null;
        }
      }

      this.collection.createNode(self.name, collection, data, callback);
    },

    deleteEdgeModal: function (edgeId) {
      var buttons = []; var tableContent = [];

      tableContent.push(
        window.modalView.createReadOnlyEntry('delete-edge-attr-id', 'Really delete edge', edgeId)
      );

      buttons.push(
        window.modalView.createDeleteButton('Delete', this.deleteEdge.bind(this))
      );

      window.modalView.show(
        'modalTable.ejs',
        'Delete edge',
        buttons,
        tableContent
      );
    },

    deleteEdge: function () {
      var self = this;
      var documentKey = $('#delete-edge-attr-id').text();
      var collectionId = documentKey.split('/')[0];
      var documentId = documentKey.split('/')[1];

      var callback = function (error) {
        if (!error) {
          self.currentGraph.graph.dropEdge(documentKey);

          // rerender graph
          self.currentGraph.refresh();
        } else {
          arangoHelper.arangoError('Graph', 'Could not delete edge.');
        }
      };

      this.documentStore.deleteDocument(collectionId, documentId, callback);
      window.modalView.hide();
    },

    addNodeModal: function () {
      if (this.graphSettings.vertexCollections !== 0) {
        var buttons = []; var tableContent = []; var collections = [];

        _.each(this.graphSettings.vertexCollections, function (val) {
          collections.push({
            label: val.name,
            value: val.name
          });
        });

        tableContent.push(
          window.modalView.createTextEntry(
            'new-node-key-attr',
            '_key',
            undefined,
            'The nodes unique key(optional attribute, leave empty for autogenerated key',
            'is optional: leave empty for autogenerated key',
            false,
            [
              {
                rule: Joi.string().allow('').optional(),
                msg: ''
              }
            ]
          )
        );

        if (this.graphSettings.isSmart) {
          tableContent.push(
            window.modalView.createTextEntry(
              'new-smart-key-attr',
              this.graphSettings.smartGraphAttribute + '*',
              undefined,
              'The attribute value that is used to smartly shard the vertices of a graph. \n' +
              'Every vertex in this Graph has to have this attribute. \n' +
              'Cannot be modified later.',
              'Cannot be modified later.',
              false,
              [
                {
                  rule: Joi.string().allow('').optional(),
                  msg: ''
                }
              ]
            )
          );
        }

        tableContent.push(
          window.modalView.createSelectEntry(
            'new-node-collection-attr',
            'Collection',
            undefined,
            'Please select the destination for the new node.',
            collections
          )
        );

        buttons.push(
          window.modalView.createSuccessButton('Create', this.addNode.bind(this))
        );

        window.modalView.show(
          'modalTable.ejs',
          'Create node',
          buttons,
          tableContent
        );
      } else {
        arangoHelper.arangoError('Graph', 'No valid vertex collections found.');
      }
    },

    addEdge: function () {
      var self = this;
      var from = self.contextState._from;
      var to = self.contextState._to;

      var collection;
      if ($('.modal-body #new-edge-collection-attr').val() === '') {
        collection = $('.modal-body #new-edge-collection-attr').text();
      } else {
        collection = $('.modal-body #new-edge-collection-attr').val();
      }
      var key = $('.modal-body #new-edge-key-attr').last().val();

      var callback = function (error, id, msg) {
        if (!error) {
          var edge = {
            source: from,
            target: to,
            id: id,
            color: self.graphConfig.edgeColor || self.ecolor
          };

          if (self.graphConfig.edgeEditable === 'true') {
            edge.size = 1;
          }
          self.currentGraph.graph.addEdge(edge);

          // rerender graph
          if (self.graphConfig) {
            if (self.graphConfig.edgeType === 'curve') {
              sigma.canvas.edges.autoCurve(self.currentGraph);
            }
          }
          self.currentGraph.refresh();
        } else {
          arangoHelper.arangoError('Could not create edge', msg);
        }

        // then clear states
        self.clearOldContextMenu(true);
        window.modalView.hide();
      };

      var data = {
        _from: from,
        _to: to
      };
      if (key !== '' && key !== undefined) {
        data._key = key;
      }
      this.collection.createEdge(self.name, collection, data, callback);
    },

    addEdgeModal: function (edgeDefinitions) {
      if (edgeDefinitions !== 0) {
        var buttons = []; var tableContent = [];

        tableContent.push(
          window.modalView.createTextEntry(
            'new-edge-key-attr',
            '_key',
            undefined,
            'The edges unique key(optional attribute, leave empty for autogenerated key',
            'is optional: leave empty for autogenerated key',
            false,
            [
              {
                rule: Joi.string().allow('').optional(),
                msg: ''
              }
            ]
          )
        );

        if (edgeDefinitions.length > 1) {
          var collections = [];

          _.each(edgeDefinitions, function (val) {
            collections.push({
              label: val,
              value: val
            });
          });

          tableContent.push(
            window.modalView.createSelectEntry(
              'new-edge-collection-attr',
              'Edge collection',
              undefined,
              'Please select the destination for the new edge.',
              collections
            )
          );
        } else {
          tableContent.push(
            window.modalView.createReadOnlyEntry(
              'new-edge-collection-attr',
              'Edge collection',
              edgeDefinitions[0],
              'The edge collection to be used.'
            )
          );
        }

        buttons.push(
          window.modalView.createSuccessButton('Create', this.addEdge.bind(this))
        );

        window.modalView.show(
          'modalTable.ejs',
          'Create edge',
          buttons,
          tableContent
        );
      } else {
        arangoHelper.arangoError('Graph', 'No valid edge definitions found.');
      }
    },

    updateColors: function (nodes, edges, ncolor, ecolor, origin) {
      var combinedName = frontendConfig.db + '_' + this.name;
      var self = this;

      if (ncolor) {
        self.ncolor = ncolor;
      }
      if (ecolor) {
        self.ecolor = ecolor;
      }

      this.userConfig.fetch({
        success: function (data) {
          if (nodes === true) {
            self.graphConfig = data.toJSON().graphs[combinedName];
            try {
              self.currentGraph.graph.nodes().forEach(function (n) {
                if (origin) {
                  n.color = n.sortColor;
                } else {
                  n.color = ncolor;
                }
              });
            } catch (e) {
              self.graphNotInitialized = true;
              self.tmpGraphArray = [nodes, edges, ncolor, ecolor];
            }
          }

          if (edges === true) {
            try {
              self.currentGraph.graph.edges().forEach(function (e) {
                if (origin) {
                  e.color = e.sortColor;
                } else {
                  e.color = ecolor;
                }
              });
            } catch (ignore) {
              self.graphNotInitialized = true;
              self.tmpGraphArray = [nodes, edges, ncolor, ecolor];
            }
          }

          if (self.currentGraph) {
            self.currentGraph.refresh();
          }
        }
      });
    },

    nodesContextMenuCheck: function (e) {
      this.nodesContextEventState = e;
      this.openNodesDate = new Date();
    },

      // click nodes context menu
      /*
      createNodesContextMenu: function () {
        var self = this;
        var e = self.nodesContextEventState;

        var x = e.clientX - 50;
        var y = e.clientY - 50;
        self.clearOldContextMenu();

        var generateMenu = function (e) {
          var Wheelnav = wheelnav;

          var wheel = new Wheelnav('nodeContextMenu');
          wheel.maxPercent = 1.0;
          wheel.wheelRadius = 50;
          wheel.clockwise = false;
          wheel.colors = self.colors.hotaru;
          wheel.multiSelect = true;
          wheel.clickModeRotate = false;
          wheel.slicePathFunction = slicePath().DonutSlice;
          if (self.viewStates.captureMode) {
            wheel.createWheel([icon.plus, icon.trash]);
          } else {
            wheel.createWheel([icon.trash, icon.arrowleft2]);
          }

          wheel.navItems[0].selected = false;
          wheel.navItems[0].hovered = false;
          // add menu events

          // function 0: remove all selectedNodes
          wheel.navItems[0].navigateFunction = function (e) {
            self.clearOldContextMenu();
            self.deleteNodesModal();
          };

          // function 1: clear contextmenu
          wheel.navItems[1].navigateFunction = function (e) {
            self.clearOldContextMenu();
          };

          // deselect active default entry
          wheel.navItems[0].selected = false;
          wheel.navItems[0].hovered = false;
        };

        $('#nodeContextMenu').css('position', 'fixed');
        $('#nodeContextMenu').css('left', x);
        $('#nodeContextMenu').css('top', y);
        $('#nodeContextMenu').width(100);
        $('#nodeContextMenu').height(100);

        generateMenu(e);
      },
      */

    // right click background context menu
    createContextMenu: function (e) {
      var self = this;
      var x = self.cursorX - 50;
      var y = self.cursorY - 50;
      this.clearOldContextMenu();

      var generateMenu = function (e) {
        var Wheelnav = wheelnav;

        var wheel = new Wheelnav('nodeContextMenu');
        wheel.maxPercent = 1.0;
        wheel.wheelRadius = 50;
        wheel.clockwise = false;
        wheel.colors = self.colors.hotaru;
        wheel.multiSelect = true;
        wheel.clickModeRotate = false;
        wheel.slicePathFunction = slicePath().DonutSlice;
        wheel.createWheel([icon.plus, icon.arrowleft2]);

        // add menu events
        wheel.navItems[0].selected = false;
        wheel.navItems[0].hovered = false;

        // function 0: add node
        wheel.navItems[0].navigateFunction = function (e) {
          self.clearOldContextMenu();
          self.addNodeModal();
        };

        // function 1: exit
        wheel.navItems[1].navigateFunction = function (e) {
          self.clearOldContextMenu();
        };

        // deselect active default entry
        wheel.navItems[0].selected = false;
        wheel.navItems[0].hovered = false;
      };

      $('#nodeContextMenu').css('position', 'fixed');
      $('#nodeContextMenu').css('left', x);
      $('#nodeContextMenu').css('top', y);
      $('#nodeContextMenu').width(100);
      $('#nodeContextMenu').height(100);

      generateMenu(e);
    },

    // click edge context menu
    createEdgeContextMenu: function (edgeId, e) {
      var self = this;
      var x = this.cursorX - 165;
      var y = this.cursorY - 120;

      this.clearOldContextMenu();

      var generateMenu = function (e, edgeId) {
        var hotaru = ['#364C4A', '#497C7F', '#92C5C0', '#858168', '#CCBCA5'];

        var Wheelnav = wheelnav;

        var wheel = new Wheelnav('nodeContextMenu');
        wheel.maxPercent = 1.0;
        wheel.wheelRadius = 50;
        wheel.clockwise = false;
        wheel.colors = hotaru;
        wheel.multiSelect = true;
        wheel.clickModeRotate = false;
        wheel.slicePathFunction = slicePath().DonutSlice;
        wheel.createWheel([icon.edit, icon.trash]);

        // add menu events
        wheel.navItems[0].selected = false;
        wheel.navItems[0].hovered = false;

        // function 0: edit
        wheel.navItems[0].navigateFunction = function (e) {
          self.clearOldContextMenu();
          self.editEdge(edgeId);
        };

        // function 1: delete
        wheel.navItems[1].navigateFunction = function (e) {
          self.clearOldContextMenu();
          self.deleteEdgeModal(edgeId);
        };

        // deselect active default entry
        wheel.navItems[0].selected = false;
        wheel.navItems[0].hovered = false;
      };

      $('#nodeContextMenu').css('left', x + 115);
      $('#nodeContextMenu').css('top', y + 72);
      $('#nodeContextMenu').width(100);
      $('#nodeContextMenu').height(100);

      generateMenu(e, edgeId);
    },

    // click node context menu
    createNodeContextMenu: function (nodeId, e) {
      var self = this;
      var x; var y; var size;

      // case canvas
      _.each(e.data.node, function (val, key) {
        if (key.substr(0, 8) === 'renderer' && key.charAt(key.length - 1) === 'x') {
          x = val;
        }
        if (key.substr(0, 8) === 'renderer' && key.charAt(key.length - 1) === 'y') {
          y = val;
        }
        if (key.substr(0, 8) === 'renderer' && key.charAt(key.length - 1) === 'e') {
          size = val;
        }
      });

      if (x === undefined && y === undefined) {
        // case webgl
        _.each(e.data.node, function (val, key) {
          if (key.substr(0, 8) === 'read_cam' && key.charAt(key.length - 1) === 'x') {
            x = val + $('#graph-container').width() / 2;
          }
          if (key.substr(0, 8) === 'read_cam' && key.charAt(key.length - 1) === 'y') {
            y = val + $('#graph-container').height() / 2;
          }
        });
      }

      var radius = size * 2.5;

      if (radius < 75) {
        radius = 75;
      }

      this.clearOldContextMenu();
      var generateMenu = function (e, nodeId) {
        var hotaru = ['#364C4A', '#497C7F', '#92C5C0', '#858168', '#CCBCA5'];

        var Wheelnav = wheelnav;

        var wheel = new Wheelnav('nodeContextMenu');
        wheel.maxPercent = 1.0;
        wheel.wheelRadius = radius;
        wheel.clockwise = false;
        wheel.colors = hotaru;
        wheel.multiSelect = false;
        wheel.clickModeRotate = false;
        wheel.sliceHoverAttr = {stroke: '#fff', 'stroke-width': 2};
        wheel.slicePathFunction = slicePath().DonutSlice;

        if (!self.noDefinedGraph) {
          wheel.createWheel([
            'imgsrc:img/gv_edit.png',
            'imgsrc:img/gv_trash.png',
            'imgsrc:img/gv_flag.png',
            'imgsrc:img/gv_link.png',
            'imgsrc:img/gv_expand.png'
          ]);
        } else {
          wheel.createWheel([
            'imgsrc:img/gv_edit.png',
            'imgsrc:img/gv_trash.png'
          ]);
        }

        $('#nodeContextMenu').addClass('animated bounceIn');

        window.setTimeout(function () {
          // add menu events

          // function 0: edit
          wheel.navItems[0].navigateFunction = function (e) {
            self.clearOldContextMenu();
            self.editNode(nodeId);
            self.removeHelp();
          };

          // function 1: delete
          wheel.navItems[1].navigateFunction = function (e) {
            self.clearOldContextMenu();
            self.deleteNodeModal(nodeId);
            self.removeHelp();
          };

          if (!self.noDefinedGraph) {
            // function 2: mark as start node
            wheel.navItems[2].navigateFunction = function (e) {
              self.clearOldContextMenu();
              self.setStartNode(nodeId);
              self.removeHelp();
            };

            // function 3: create edge
            wheel.navItems[3].navigateFunction = function (e) {
              self.contextState.createEdge = true;
              self.contextState._from = nodeId;
              self.contextState.fromX = x;
              self.contextState.fromY = y;

              var c = document.getElementsByClassName('sigma-mouse')[0];
              self.drawHelp('Now click destination node, or click background to cancel.');
              c.addEventListener('mousemove', self.drawLine.bind(this), false);

              self.clearOldContextMenu();
              self.removeHelp();
            };

            // function 4: mark as start node
            wheel.navItems[4].navigateFunction = function (e) {
              self.clearOldContextMenu();
              self.expandNode(nodeId);
              self.removeHelp();
            };
          }

          // add menu hover functions

          var descriptions = [
            'Edit the node.',
            'Delete node.'
          ];

          if (!self.noDefinedGraph) {
            descriptions.push('Set as startnode.');
            descriptions.push('Draw edge.');
            descriptions.push('Expand the node.');
          }

          // hover functions
          _.each(descriptions, function (val, key) {
            wheel.navItems[key].navTitle.mouseover(function () { self.drawHelp(val); });
            wheel.navItems[key].navTitle.mouseout(function () { self.removeHelp(); });
          });

          // deselect active default entry
          wheel.navItems[0].selected = false;
          wheel.navItems[0].hovered = false;
        }, 300);
      };

      var offset = $('#graph-container').offset();
      $('#nodeContextMenu').width(radius * 2);
      $('#nodeContextMenu').height(radius * 2);
      // $('#nodeContextMenu').css('left', e.data.captor.clientX - radius);
      // $('#nodeContextMenu').css('top', e.data.captor.clientY - radius);
      // $('#nodeContextMenu').css('left', x + 150 + 15 - radius);
      // $('#nodeContextMenu').css('top', y + 60 + 42 + 15 - radius);
      $('#nodeContextMenu').css('left', x + offset.left - radius);
      $('#nodeContextMenu').css('top', y + offset.top - radius);

      generateMenu(e, nodeId);
    },

    drawHelp: function (val) {
      if (document.getElementById('helpTooltip') === null) {
        $(this.el).append('<div id="helpTooltip" class="helpTooltip"><span>' + val + '</span></div>');
      } else {
        $('#helpTooltip span').text(val);
      }

      $('#helpTooltip').show();
    },

    removeHelp: function () {
      $('#helpTooltip').remove();
    },

    clearMouseCanvas: function () {
      var c = document.getElementsByClassName('sigma-mouse')[0];
      var ctx = c.getContext('2d');
      ctx.clearRect(0, 0, $(c).width(), $(c).height());
    },

    expandNode: function (id) {
      var self = this;
      var ajaxData = {};

      if (this.graphConfig) {
        ajaxData = _.clone(this.graphConfig);

        // remove not needed params
        delete ajaxData.layout;
        delete ajaxData.edgeType;
        delete ajaxData.renderer;
      }

      ajaxData.query = 'FOR v, e, p IN 1..1 ANY "' + id + '" GRAPH "' + self.name + '" RETURN p';

      $.ajax({
        type: 'GET',
        url: arangoHelper.databaseUrl('/_admin/aardvark/graph/' + encodeURIComponent(this.name)),
        contentType: 'application/json',
        data: ajaxData,
        success: function (data) {
          self.checkExpand(data, id);
        },
        error: function (e) {
          arangoHelper.arangoError('Graph', 'Could not expand node: ' + id + '.');
        }
      });

      self.removeHelp();
    },

    checkExpand: function (data, origin) {
      var self = this;
      var newNodes = data.nodes;
      var newEdges = data.edges;
      var existingNodes = this.currentGraph.graph.nodes();

      var found;
      var newNodeCounter = 0;
      var newEdgeCounter = 0;

      _.each(newNodes, function (newNode) {
        found = false;
        _.each(existingNodes, function (existingNode) {
          if (found === false) {
            if (newNode.id === existingNode.id) {
              if (existingNode.id === origin) {
                existingNode.label = existingNode.label + ' (expanded)';
              }
              found = true;
            } else {
              found = false;
            }
          }
        });

        if (found === false) {
          newNode.originalColor = newNode.color;
          self.currentGraph.graph.addNode(newNode);
          newNodeCounter++;
        }
      });

      _.each(newEdges, function (edge) {
        if (self.currentGraph.graph.edges(edge.id) === undefined) {
          edge.originalColor = edge.color;
          self.currentGraph.graph.addEdge(edge);
          newEdgeCounter++;
        }
      });

      $('#nodesCount').text(parseInt($('#nodesCount').text(), 10) + newNodeCounter);
      $('#edgesCount').text(parseInt($('#edgesCount').text(), 10) + newEdgeCounter);

      // rerender graph
      if (newNodeCounter > 0 || newEdgeCounter > 0) {
        if (self.algorithm === 'force') {
          self.startLayout(true, origin);
        } else if (self.algorithm === 'fruchtermann') {
          sigma.layouts.fruchtermanReingold.start(self.currentGraph);
          self.currentGraph.refresh();
          self.cameraToNode(origin, 1000);
        } else if (self.algorithm === 'noverlap') {
          self.startLayout(true, origin); // TODO: tmp bugfix, rerender with noverlap currently not possible
          // self.currentGraph.startNoverlap();
        }
      }
    },

    cameraToNode: function (node, timeout) {
      var self = this;

      if (typeof node === 'string') {
        node = self.currentGraph.graph.nodes(node);
      }

      var animateFunc = function (node) {
        sigma.misc.animation.camera(self.currentGraph.camera, {
          x: node.x,
          y: node.y
        }, {
          duration: 1000
        });
      };

      if (timeout) {
        window.setTimeout(function () {
          animateFunc(node);
        }, timeout);
      } else {
        animateFunc(node);
      }
    },

    drawLine: function (e) {
      var context = window.App.graphViewer.contextState;

      if (context.createEdge) {
        var fromX = context.fromX;
        var fromY = context.fromY;
        var toX = e.offsetX;
        var toY = e.offsetY;

        var c = document.getElementsByClassName('sigma-mouse')[0];
        var ctx = c.getContext('2d');
        ctx.clearRect(0, 0, $(c).width(), $(c).height());
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = this.newEdgeColor;
        ctx.stroke();
      }
    },

    getGraphSettings: function (callback) {
      var self = this;

      this.userConfig.fetch({
        success: function (data) {
          var combinedName = frontendConfig.db + '_' + self.name;
          self.graphConfig = data.toJSON().graphs[combinedName];

          // init settings view
          if (self.graphSettingsView) {
            self.graphSettingsView.remove();
          }
          self.graphSettingsView = new window.GraphSettingsView({
            name: self.name,
            userConfig: self.userConfig,
            saveCallback: self.render
          });

          var continueFunction = function () {
            self.graphSettingsView.render();

            if (callback) {
              callback(self.graphConfig);
            }
          };

          if (self.graphConfig === undefined) {
            self.graphSettingsView.setDefaults(true, true);
            self.userConfig.fetch({
              success: function (data) {
                self.graphConfig = data.toJSON().graphs[combinedName];
                continueFunction();
              }
            });
          } else {
            continueFunction();
          }
        }
      });
    },

    setStartNode: function (id) {
      this.graphConfig.nodeStart = id;
      this.graphSettingsView.saveGraphSettings(undefined, undefined, id);
    },

    editNode: function (id) {
      var callback = function (a, b) {
      };
      arangoHelper.openDocEditor(id, 'doc', callback);
    },

    editEdge: function (id) {
      var callback = function () {};
      arangoHelper.openDocEditor(id, 'edge', callback);
    },

    reloadGraph: function () {
      Backbone.history.loadUrl(Backbone.history.fragment);
    },

    getEdgeDefinitionCollections: function (fromCollection, toCollection) {
      var array = [];

      _.each(this.model.edgeDefinitions, function (edgeDefinition) {
        _.each(edgeDefinition.from, function (from) {
          if (from === fromCollection) {
            _.each(edgeDefinition.to, function (to) {
              if (to === toCollection) {
                array.push(edgeDefinition.collection);
              }
            });
          }
        });
      });

      return array;
    },

    initializeGraph: function (sigmaInstance, graph) {
      // var self = this;
      // sigmaInstance.graph.read(graph);
      sigmaInstance.refresh();

      /*
         this.Sigma.plugins.Lasso = sigma.plugins.lasso;

         var lasso = new this.Sigma.plugins.Lasso(sigmaInstance, sigmaInstance.renderers[0], {
         'strokeStyle': 'black',
         'lineWidth': 1,
         'fillWhileDrawing': true,
         'fillStyle': 'rgba(41, 41, 41, 0.2)',
         'cursor': 'crosshair'
         });

      // Listen for selectedNodes event
      lasso.bind('selectedNodes', function (event) {
      // Do something with the selected nodes
      var nodes = event.data;

      if (nodes.length === 0) {
      self.selectedNodes = [];
      } else {
      _.each(nodes, function (val, key) {
      self.selectedNodes[key] = val.id;
      });
      }

      var style = 'position: absolute; right: 25px; bottom: 45px;';

      if (!$('#deleteNodes').is(':visible')) {
      $(self.el).append(
      '<button style=" ' + style + ' "id="deleteNodes" class="button-danger fadeIn animated">Delete selected nodes</button>'
      );
      var c = document.getElementById('deleteNodes');
      c.addEventListener('click', self.deleteNodesModal.bind(self), false);
      }

      self.activeNodes = nodes;
      sigmaInstance.refresh();
      });

      return lasso;
      */
    },

    renderGraph: function (graph, toFocus, aqlMode, layout, renderer, edgeType) {
      var self = this;
      this.graphSettings = graph.settings;

      var color = '#2ecc71';

      if (self.ncolor) {
        color = self.ncolor;
      }

      if (graph.edges) {
        if (graph.nodes) {
          if (graph.nodes.length === 0 && graph.edges.length === 0) {
            graph.nodes.push({
              id: graph.settings.startVertex._id,
              label: graph.settings.startVertex._key,
              size: 10,
              color: color,
              x: Math.random(),
              y: Math.random()
            });
          }

          var style = 'position: absolute; left: 25px; bottom: 50px;';
          if (!this.aqlMode) {
            $('#graph-container').append(
              '<div id="objectCount" style="' + style + ' animated fadeIn">' +
                '<span style="margin-right: 10px" class="arangoState"><span id="nodesCount">' + graph.nodes.length + '</span> nodes</span>' +
                '<span class="arangoState"><span id="edgesCount">' + graph.edges.length + '</span> edges</span>' +
              '</div>'
            );
          }
        }
      }
      this.Sigma = sigma;

      // defaults
      if (!layout) {
        self.algorithm = 'force';
      } else {
        self.algorithm = layout;
      }
      if (!renderer) {
        self.renderer = 'canvas';
      } else {
        self.renderer = renderer;
      }

      if (this.graphConfig) {
        if (this.graphConfig.layout) {
          if (!layout) {
            self.algorithm = this.graphConfig.layout;
          }
        }

        if (this.graphConfig.renderer) {
          if (!renderer) {
            self.renderer = this.graphConfig.renderer;
          }
        }
      }

      if (self.renderer === 'canvas') {
        self.isEditable = true;
      }

      // sigmajs graph settings
      var settings = {
        scalingMode: 'inside',
        borderSize: 3,
        defaultNodeBorderColor: '#8c8c8c',
        doubleClickEnabled: false,
        minNodeSize: 5,
        labelThreshold: 9,
        maxNodeSize: 15,
        batchEdgesDrawing: true,
        minEdgeSize: 1,
        maxEdgeSize: 1,
        enableEdgeHovering: true,
        edgeHoverColor: '#8c8c8c',
        defaultEdgeHoverColor: '#8c8c8c',
        defaultEdgeType: 'arrow',
        edgeHoverSizeRatio: 2.5,
        edgeHoverExtremities: true,
        nodesPowRatio: 0.5,
        // edgesPowRatio: 1.5,
        // lasso settings
        autoRescale: true,
        mouseEnabled: true,
        touchEnabled: true,
        approximateLabelWidth: true,
        font: 'Roboto'
      };

      // halo settings
      // settings.nodeHaloColor = '#FF7A7A';
      settings.nodeHaloColor = 'rgba(146,197,192, 0.8)';
      settings.nodeHaloStroke = false;
      settings.nodeHaloStrokeColor = '#000';
      settings.nodeHaloStrokeWidth = 0;
      settings.nodeHaloSize = 25;
      settings.nodeHaloClustering = false;
      settings.nodeHaloClusteringMaxRadius = 1000;
      settings.edgeHaloColor = '#fff';
      settings.edgeHaloSize = 10;
      settings.drawHalo = true;

      if (self.renderer === 'canvas') {
        settings.autoCurveSortByDirection = true;
      }

      // adjust display settings for big graphs
      if (graph.nodes) {
        if (graph.nodes.length > 250) {
          settings.hideEdgesOnMove = true;
        }
      }

      if (this.graphConfig) {
        if (this.graphConfig.edgeType) {
          settings.defaultEdgeType = this.graphConfig.edgeType;
        }
      }

      if (edgeType) {
        settings.defaultEdgeType = edgeType;
      }
      if (settings.defaultEdgeType === 'arrow') {
        settings.minArrowSize = 7;
      }

      if (aqlMode) {
        // aql editor settings
        self.renderer = 'canvas';

        if (graph.nodes.length < 500) {
          self.algorithm = 'fruchtermann';
        } else {
          settings.scalingMode = 'outside';
        }

        settings.drawEdgeLabels = false;
        settings.minNodeSize = 2;
        settings.maxNodeSize = 8;
      }

      // adjust display settings for webgl renderer
      if (self.renderer === 'webgl') {
        settings.enableEdgeHovering = false;
      }

      // create sigma graph
      var s = new this.Sigma({
        graph: graph,
        container: 'graph-container',
        renderer: {
          container: document.getElementById('graph-container'),
          type: self.renderer
        },
        settings: settings
      });
      this.currentGraph = s;

      if (!this.aqlMode) {
        sigma.plugins.fullScreen({
          container: 'graph-container',
          btnId: 'graph-fullscreen-btn'
        });
      }

      s.graph.nodes().forEach(function (n) {
        n.originalColor = n.color;
      });
      s.graph.edges().forEach(function (e) {
        e.originalColor = e.color;
      });

      if (self.algorithm === 'noverlap') {
        var noverlapListener = s.configNoverlap({
          nodeMargin: 0.1,
          scaleNodes: 1.05,
          gridSize: 75,
          easing: 'quadraticInOut', // animation transition function
          duration: 1500 // animation duration
        });

        noverlapListener.bind('start stop interpolate', function (e) {
          if (e.type === 'start') {
          }
          if (e.type === 'interpolate') {
          }
        });
      } else if (self.algorithm === 'fruchtermann') {
        var frListener = sigma.layouts.fruchtermanReingold.configure(s, {
          iterations: 100,
          easing: 'quadraticInOut',
          duration: 1500
        });

        frListener.bind('start stop interpolate', function (e) {});
      }

      // for canvas renderer allow graph editing
      if (!self.aqlMode) {
        var showAttributes = function (e, node) {
          $('.nodeInfoDiv').remove();

          if (self.contextState.createEdge === false) {
            if (window.location.hash.indexOf('graph') > -1) {
              var callback = function (error, data, id) {
                if (!error) {
                  var attributes = '';
                  attributes += '<span class="title">ID </span> <span class="nodeId">' + data.documents[0]._id + '</span>';
                  if (Object.keys(data.documents[0]).length > 3) {
                    attributes += '<span class="title">ATTRIBUTES </span>';
                  }
                  _.each(data.documents[0], function (value, key) {
                    if (key !== '_key' && key !== '_id' && key !== '_rev' && key !== '_from' && key !== '_to') {
                      attributes += '<span class="nodeAttribute">' + key + '</span>';
                    }
                  });
                  var string = '<div id="nodeInfoDiv" class="nodeInfoDiv" style="display: none;">' + attributes + '</div>';

                  $('#graph-container').append(string);
                  if (self.isFullscreen) {
                    $('.nodeInfoDiv').css('top', '10px');
                    $('.nodeInfoDiv').css('left', '10px');
                  }
                  $('#nodeInfoDiv').fadeIn('slow');
                } else {
                  // node not available any more
                  self.currentGraph.graph.dropNode(id);
                  // rerender graph
                  self.currentGraph.refresh();
                }
              };

              if (node) {
                self.documentStore.getDocument(e.data.node.id.split('/')[0], e.data.node.id.split('/')[1], callback);
              } else {
                self.documentStore.getDocument(e.data.edge.id.split('/')[0], e.data.edge.id.split('/')[1], callback);
              }
            }
          }
        };

        s.bind('clickNode', function (e) {
          if (self.contextState.createEdge === true) {
            self.clearMouseCanvas();
            self.removeHelp();

            // create the edge
            self.contextState._to = e.data.node.id;
            var fromCollection = self.contextState._from.split('/')[0];
            var toCollection = self.contextState._to.split('/')[0];

            // validate edgeDefinitions
            var foundEdgeDefinitions = self.getEdgeDefinitionCollections(fromCollection, toCollection);
            if (foundEdgeDefinitions.length === 0) {
              arangoHelper.arangoNotification('Graph', 'No valid edge definition found.');
            } else {
              self.addEdgeModal(foundEdgeDefinitions, self.contextState._from, self.contextState._to);
              self.clearOldContextMenu(false);
            }
          } else {
            if (!self.dragging) {
              if (self.contextState.createEdge === true) {
                self.newEdgeColor = '#ff0000';
              } else {
                self.newEdgeColor = '#000000';
              }

              // halo on active nodes:
              if (self.renderer === 'canvas') {
                self.currentGraph.renderers[0].halo({
                  nodes: self.currentGraph.graph.nodes(),
                  nodeHaloColor: '#DF0101',
                  nodeHaloSize: 100
                });
              }

              showAttributes(e, true);
              self.activeNodes = [e.data.node];

              if (self.renderer === 'canvas') {
                s.renderers[0].halo({
                  nodes: [e.data.node]
                });
              }

              self.createNodeContextMenu(e.data.node.id, e);
            }
          }
        });

        if (!self.noDefinedGraph) {
          s.bind('clickStage', function (e) {
            if (e.data.captor.isDragging) {
              self.clearOldContextMenu(true);
              self.clearMouseCanvas();
            } else if (self.contextState.createEdge === true) {
              self.clearOldContextMenu(true);
              self.clearMouseCanvas();
              self.removeHelp();
            } else {
              // stage menu
              if (!$('#nodeContextMenu').is(':visible')) {
                // var offset = $('#graph-container').offset();
                self.addNodeX = e.data.captor.x;
                self.addNodeY = e.data.captor.y;
                // self.calculateAddNodePosition(self.cursorX, self.cursorY);
                // self.addNodeX = sigma.utils.getX(e) - offset.left / 2;
                // self.addNodeY = sigma.utils.getY(e) - offset.top / 2;
                // self.addNodeX = e.data.captor.x;
                // self.addNodeY = e.data.captor.y;
                self.createContextMenu(e);
                self.clearMouseCanvas();
              } else {
                // cleanup
                self.clearOldContextMenu(true);
                self.clearMouseCanvas();
              }

              // remember halo
              s.renderers[0].halo({
                nodes: self.activeNodes
              });
            }
          });
        } else {
          s.bind('clickStage', function (e) {
            self.clearOldContextMenu(true);
            self.clearMouseCanvas();
            self.removeHelp();
          });
        }
      }

      if (self.renderer === 'canvas') {
        // render parallel edges
        if (this.graphConfig) {
          if (this.graphConfig.edgeType === 'curve') {
            sigma.canvas.edges.autoCurve(s);
          }
        }

        s.bind('clickEdge', function (e) {
          showAttributes(e, false);
        });

        s.renderers[0].bind('render', function (e) {
          s.renderers[0].halo({
            nodes: self.activeNodes
          });
        });

        var unhighlightNodes = function () {
          self.nodeHighlighted = false;
          self.activeNodes = [];

          s.graph.nodes().forEach(function (n) {
            n.color = n.originalColor;
          });

          s.graph.edges().forEach(function (e) {
            e.color = e.originalColor;
          });

          $('.nodeInfoDiv').remove();
          s.refresh({ skipIndexation: true });
        };

        s.bind('rightClickStage', function (e) {
          self.nodeHighlighted = 'undefinedid';
          unhighlightNodes();
        });

        s.bind('rightClickNode', function (e) {
          if (self.nodeHighlighted !== e.data.node.id) {
            var nodeId = e.data.node.id;
            var toKeep = s.graph.neighbors(nodeId);
            toKeep[nodeId] = e.data.node;

            s.graph.nodes().forEach(function (n) {
              if (toKeep[n.id]) {
                n.color = n.originalColor;
              } else {
                n.color = '#eee';
              }
            });

            s.graph.edges().forEach(function (e) {
              if (toKeep[e.source] && toKeep[e.target]) {
                e.color = 'rgb(64, 74, 83)';
              } else {
                e.color = '#eee';
              }
            });

            self.nodeHighlighted = true;
            s.refresh({ skipIndexation: true });
          } else {
            unhighlightNodes();
          }
        });

        if (this.graphConfig) {
          if (this.graphConfig.edgeEditable) {
            s.bind('clickEdge', function (e) {
              var edgeId = e.data.edge.id;
              self.createEdgeContextMenu(edgeId, e);
            });
          }
        }
      }

      // Initialize the dragNodes plugin:
      if (self.algorithm === 'noverlap') {
        s.startNoverlap();
        // allow draggin nodes
      } else if (self.algorithm === 'force') {
        // add buttons for start/stopping calculation
        var style2 = 'color: rgb(64, 74, 83); cursor: pointer; position: absolute; right: 30px; bottom: 40px; z-index: 9999;';

        if (self.aqlMode) {
          style2 = 'color: rgb(64, 74, 83); cursor: pointer; position: absolute; right: 30px; margin-top: 10px; margin-right: -15px';
        }

        $('#graph-container').after(
          '<div id="toggleForce" style="' + style2 + '">' +
            '<i style="margin-right: 5px;" class="fa fa-pause"></i><span> Stop layout</span>' +
          '</div>'
        );
        self.startLayout();

        // suggestion rendering time
        var duration = 250;
        var adjust = 500;
        if (graph.nodes) {
          duration = graph.nodes.length;
          if (aqlMode) {
            if (duration < 250) {
              duration = 250;
            } else {
              duration += adjust;
            }
          } else {
            if (duration <= 250) {
              duration = 500;
            }
            duration += adjust;
          }
        }

        if (graph.empty) {
          arangoHelper.arangoNotification('Graph', 'Your graph is empty. Click inside the white window to create your first node.');
        }

        window.setTimeout(function () {
          self.stopLayout();
        }, duration);
      } else if (self.algorithm === 'fruchtermann') {
        // Start the Fruchterman-Reingold algorithm:
        sigma.layouts.fruchtermanReingold.start(s);
      }

      if (self.algorithm !== 'force') {
        self.reInitDragListener();
      }

      // add listener to keep track of cursor position
      var c = document.getElementsByClassName('sigma-mouse')[0];
      c.addEventListener('mousemove', self.trackCursorPosition.bind(this), false);

      // focus last input box if available
      if (toFocus) {
        $('#' + toFocus).focus();
        $('#graphSettingsContent').animate({
          scrollTop: $('#' + toFocus).offset().top
        }, 2000);
      }

      /*
         var enableLasso = function () {
         self.graphLasso = self.initializeGraph(s, graph);
         self.graphLasso.activate();
         self.graphLasso.deactivate();
         };

      // init graph lasso
      if (this.graphConfig) {
      if (this.graphConfig.renderer === 'canvas') {
      enableLasso();
      } else {
      $('#selectNodes').parent().hide();
      }
      } else {
      if (renderer === 'canvas') {
      enableLasso();
      } else {
      $('#selectNodes').parent().hide();
      }
      }
      */

      /* if (self.graphLasso) {
      // add lasso event
      // Toggle lasso activation on Alt + l
      window.App.listenerFunctions['graphViewer'] = this.keyUpFunction.bind(this);
      } */

      // clear up info div
      $('#calculatingGraph').fadeOut('slow');

      if (!aqlMode) {
        if (self.graphConfig) {
          if (self.graphConfig.nodeSizeByEdges === 'false') {
            // make nodes a bit bigger
            // var maxNodeSize = s.settings('maxNodeSize');
            // var factor = 1;
            // var length = s.graph.nodes().length;

            /*
               factor = 0.35;
               maxNodeSize = maxNodeSize * factor;
               s.settings('maxNodeSize', maxNodeSize);
               s.refresh({});
               */
          }
        }
      }

      self.calcFinished = new Date();
      // console.log('Client side calculation took ' + Math.abs(self.calcFinished.getTime() - self.calcStart.getTime()) + ' ms');
      if (graph.empty === true) {
        $('.sigma-background').before('<span id="emptyGraph" style="position: absolute; margin-left: 10px; margin-top: 10px;">The graph is empty. Please right-click to add a node.<span>');
      }
      if (self.graphNotInitialized === true) {
        self.updateColors(self.tmpGraphArray);
        self.graphNotInitialized = false;
        self.tmpGraphArray = [];
      }

      if (self.algorithm === 'force') {
        $('#toggleForce').fadeIn('fast');
      } else {
        $('#toggleForce').fadeOut('fast');
      }
    },

    reInitDragListener: function () {
      var self = this;

      if (this.dragListener !== undefined) {
        sigma.plugins.killDragNodes(this.currentGraph);
        this.dragListener = {};
      }

      // drag nodes listener
      this.dragListener = sigma.plugins.dragNodes(this.currentGraph, this.currentGraph.renderers[0]);

      this.dragListener.bind('drag', function (event) {
        self.dragging = true;
      });

      this.dragListener.bind('drop', function (event) {
        window.setTimeout(function () {
          self.dragging = false;
        }, 400);
      });
    },

    keyUpFunction: function (event) {
      var self = this;
      switch (event.keyCode) {
        case 76:
          if (event.altKey) {
            self.toggleLasso();
          }
          break;
      }
    },

    toggleLayout: function () {
      if (this.layouting) {
        this.stopLayout();
      } else {
        this.startLayout();
      }
    },

    /*
toggleLasso: function () {
var self = this;

if (this.graphLasso.isActive) {
var y = document.getElementById('deleteNodes');
y.removeEventListener('click', self.deleteNodesModal, false);
$('#deleteNodes').remove();

    // remove event
    var c = document.getElementsByClassName('sigma-lasso')[0];
    c.removeEventListener('mouseup', this.nodesContextMenuCheck.bind(this), false);

    $('#selectNodes').removeClass('activated');
    this.graphLasso.deactivate();

    // clear selected nodes state
    this.selectedNodes = {};
    this.activeNodes = [];
    this.currentGraph.refresh({ skipIndexation: true });
    } else {
    $('#selectNodes').addClass('activated');
    this.graphLasso.activate();

    // add event
    var x = document.getElementsByClassName('sigma-lasso')[0];
    x.addEventListener('mouseup', self.nodesContextMenuCheck.bind(this), false);
    }
    },
    */

    startLayout: function (kill, origin) {
      var self = this;
      this.currentGraph.settings('drawLabels', false);
      this.currentGraph.settings('drawEdgeLabels', false);
      sigma.plugins.killDragNodes(this.currentGraph);

      if (kill === true) {
        this.currentGraph.killForceAtlas2();

        window.setTimeout(function () {
          self.stopLayout();

          if (origin) {
            self.currentGraph.refresh({ skipIndexation: true });
            // self.cameraToNode(origin, 1000);
          }
        }, 500);
      }

      $('#toggleForce .fa').removeClass('fa-play').addClass('fa-pause');
      $('#toggleForce span').html('Stop layout');
      this.layouting = true;
      if (this.aqlMode) {
        this.currentGraph.startForceAtlas2({
          worker: true
        });
      } else {
        this.currentGraph.startForceAtlas2({
          worker: true
        });
      }
      // sigma.plugins.dragNodes(this.currentGraph, this.currentGraph.renderers[0]);
    },

    stopLayout: function () {
      $('#toggleForce .fa').removeClass('fa-pause').addClass('fa-play');
      $('#toggleForce span').html('Resume layout');
      this.layouting = false;
      this.currentGraph.stopForceAtlas2();
      this.currentGraph.settings('drawLabels', true);
      this.currentGraph.settings('drawEdgeLabels', true);
      this.currentGraph.refresh({ skipIndexation: true });
      this.reInitDragListener();
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, templateEngine, window */
(function () {
  'use strict';

  window.HelpUsView = Backbone.View.extend({
    el: '#content',

    template: templateEngine.createTemplate('helpUsView.ejs'),

    render: function () {
      this.$el.html(this.template.render({}));
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global _, arangoHelper, Backbone, window, templateEngine, $ */

(function () {
  'use strict';

  window.IndicesView = Backbone.View.extend({
    el: '#content',

    initialize: function (options) {
      this.collectionName = options.collectionName;
      this.model = this.collection;
    },

    template: templateEngine.createTemplate('indicesView.ejs'),

    events: {
    },

    render: function () {
      var self = this;

      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_api/engine'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          $(self.el).html(self.template.render({
            model: self.model,
            supported: data.supports.indexes
          }));

          self.breadcrumb();
          window.arangoHelper.buildCollectionSubNav(self.collectionName, 'Indexes');

          self.getIndex();
        },
        error: function () {
          arangoHelper.arangoNotification('Index', 'Could not fetch index information.');
        }
      });
    },

    breadcrumb: function () {
      $('#subNavigationBar .breadcrumb').html(
        'Collection: ' + this.collectionName
      );
    },

    getIndex: function () {
      var callback = function (error, data, id) {
        if (error) {
          window.arangoHelper.arangoError('Index', data.errorMessage);
        } else {
          this.renderIndex(data, id);
        }
      }.bind(this);

      this.model.getIndex(callback);
    },

    createIndex: function () {
      // e.preventDefault()
      var self = this;
      var indexType = $('#newIndexType').val();
      var postParameter = {};
      var fields;
      var unique;
      var sparse;

      switch (indexType) {
        case 'Geo':
          // HANDLE ARRAY building
          fields = $('#newGeoFields').val();
          var geoJson = self.checkboxToValue('#newGeoJson');
          postParameter = {
            type: 'geo',
            fields: self.stringToArray(fields),
            geoJson: geoJson
          };
          break;
        case 'Persistent':
          fields = $('#newPersistentFields').val();
          unique = self.checkboxToValue('#newPersistentUnique');
          sparse = self.checkboxToValue('#newPersistentSparse');
          postParameter = {
            type: 'persistent',
            fields: self.stringToArray(fields),
            unique: unique,
            sparse: sparse
          };
          break;
        case 'Hash':
          fields = $('#newHashFields').val();
          unique = self.checkboxToValue('#newHashUnique');
          sparse = self.checkboxToValue('#newHashSparse');
          postParameter = {
            type: 'hash',
            fields: self.stringToArray(fields),
            unique: unique,
            sparse: sparse
          };
          break;
        case 'Fulltext':
          fields = ($('#newFulltextFields').val());
          var minLength = parseInt($('#newFulltextMinLength').val(), 10) || 0;
          postParameter = {
            type: 'fulltext',
            fields: self.stringToArray(fields),
            minLength: minLength
          };
          break;
        case 'Skiplist':
          fields = $('#newSkiplistFields').val();
          unique = self.checkboxToValue('#newSkiplistUnique');
          sparse = self.checkboxToValue('#newSkiplistSparse');
          postParameter = {
            type: 'skiplist',
            fields: self.stringToArray(fields),
            unique: unique,
            sparse: sparse
          };
          break;
      }

      var callback = function (error, msg) {
        if (error) {
          if (msg) {
            var message = JSON.parse(msg.responseText);
            arangoHelper.arangoError('Document error', message.errorMessage);
          } else {
            arangoHelper.arangoError('Document error', 'Could not create index.');
          }
        }
        // toggle back
        self.toggleNewIndexView();

        // rerender
        self.render();
      };

      this.model.createIndex(postParameter, callback);
    },

    bindIndexEvents: function () {
      this.unbindIndexEvents();
      var self = this;

      $('#indexEditView #addIndex').bind('click', function () {
        self.toggleNewIndexView();

        $('#cancelIndex').unbind('click');
        $('#cancelIndex').bind('click', function () {
          self.toggleNewIndexView();
          self.render();
        });

        $('#createIndex').unbind('click');
        $('#createIndex').bind('click', function () {
          self.createIndex();
        });
      });

      $('#newIndexType').bind('change', function () {
        self.selectIndexType();
      });

      $('.deleteIndex').bind('click', function (e) {
        self.prepDeleteIndex(e);
      });

      $('#infoTab a').bind('click', function (e) {
        $('#indexDeleteModal').remove();
        if ($(e.currentTarget).html() === 'Indexes' && !$(e.currentTarget).parent().hasClass('active')) {
          $('#newIndexView').hide();
          $('#indexEditView').show();

          $('#indexHeaderContent #modal-dialog .modal-footer .button-danger').hide();
          $('#indexHeaderContent #modal-dialog .modal-footer .button-success').hide();
          $('#indexHeaderContent #modal-dialog .modal-footer .button-notification').hide();
        }
        if ($(e.currentTarget).html() === 'General' && !$(e.currentTarget).parent().hasClass('active')) {
          $('#indexHeaderContent #modal-dialog .modal-footer .button-danger').show();
          $('#indexHeaderContent #modal-dialog .modal-footer .button-success').show();
          $('#indexHeaderContent #modal-dialog .modal-footer .button-notification').show();
          var elem2 = $('.index-button-bar2')[0];
          // $('#addIndex').detach().appendTo(elem)
          if ($('#cancelIndex').is(':visible')) {
            $('#cancelIndex').detach().appendTo(elem2);
            $('#createIndex').detach().appendTo(elem2);
          }
        }
      });
    },

    prepDeleteIndex: function (e) {
      var self = this;
      this.lastTarget = e;

      this.lastId = $(this.lastTarget.currentTarget).parent().parent().first().children().first().text();
      // window.modalView.hide()

      // delete modal
      $('#content #modal-dialog .modal-footer').after(
        '<div id="indexDeleteModal" style="display:block;" class="alert alert-error modal-delete-confirmation">' +
        '<strong>Really delete?</strong>' +
        '<button id="indexConfirmDelete" class="button-danger pull-right modal-confirm-delete">Yes</button>' +
        '<button id="indexAbortDelete" class="button-neutral pull-right">No</button>' +
        '</div>'
      );
      $('#indexHeaderContent #indexConfirmDelete').unbind('click');
      $('#indexHeaderContent #indexConfirmDelete').bind('click', function () {
        $('#indexHeaderContent #indexDeleteModal').remove();
        self.deleteIndex();
      });

      $('#indexHeaderContent #indexAbortDelete').unbind('click');
      $('#indexHeaderContent #indexAbortDelete').bind('click', function () {
        $('#indexHeaderContent #indexDeleteModal').remove();
      });
    },

    unbindIndexEvents: function () {
      $('#indexHeaderContent #indexEditView #addIndex').unbind('click');
      $('#indexHeaderContent #newIndexType').unbind('change');
      $('#indexHeaderContent #infoTab a').unbind('click');
      $('#indexHeaderContent .deleteIndex').unbind('click');
    },

    deleteIndex: function () {
      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('Could not delete index');
          $("tr th:contains('" + this.lastId + "')").parent().children().last().html(
            '<span class="deleteIndex icon_arangodb_roundminus"' +
            ' data-original-title="Delete index" title="Delete index"></span>'
          );
          this.model.set('locked', false);
        } else if (!error && error !== undefined) {
          $("tr th:contains('" + this.lastId + "')").parent().remove();
          this.model.set('locked', false);
        }
      }.bind(this);

      this.model.set('locked', true);
      this.model.deleteIndex(this.lastId, callback);

      $("tr th:contains('" + this.lastId + "')").parent().children().last().html(
        '<i class="fa fa-circle-o-notch fa-spin"></i>'
      );
    },
    renderIndex: function (data, id) {
      this.index = data;

      // get pending jobs
      var checkState = function (error, data) {
        if (error) {
          arangoHelper.arangoError('Jobs', 'Could not read pending jobs.');
        } else {
          var readJob = function (error, data, job) {
            if (error) {
              if (data.responseJSON.code === 404) {
                // delete non existing aardvark job
                arangoHelper.deleteAardvarkJob(job);
              } else if (data.responseJSON.code === 400) {
                // index job failed -> print error
                arangoHelper.arangoError('Index creation failed', data.responseJSON.errorMessage);
                // delete non existing aardvark job
                arangoHelper.deleteAardvarkJob(job);
              } else if (data.responseJSON.code === 204) {
                // job is still in quere or pending
                arangoHelper.arangoMessage('Index', 'There is at least one new index in the queue or in the process of being created.');
              }
            } else {
              arangoHelper.deleteAardvarkJob(job);
            }
          };

          _.each(data, function (job) {
            if (job.collection === id) {
              $.ajax({
                type: 'PUT',
                cache: false,
                url: arangoHelper.databaseUrl('/_api/job/' + job.id),
                contentType: 'application/json',
                success: function (data, a, b) {
                  readJob(false, data, job.id);
                },
                error: function (data) {
                  readJob(true, data, job.id);
                }
              });
            }
          });
        }
      };

      arangoHelper.getAardvarkJobs(checkState);

      var cssClass = 'collectionInfoTh modal-text';
      if (this.index) {
        var fieldString = '';
        var actionString = '';

        _.each(this.index.indexes, function (v) {
          if (v.type === 'primary' || v.type === 'edge') {
            actionString = '<span class="icon_arangodb_locked" ' +
              'data-original-title="No action"></span>';
          } else {
            actionString = '<span class="deleteIndex icon_arangodb_roundminus" ' +
              'data-original-title="Delete index" title="Delete index"></span>';
          }

          if (v.fields !== undefined) {
            fieldString = v.fields.join(', ');
          }

          // cut index id
          var position = v.id.indexOf('/');
          var indexId = v.id.substr(position + 1, v.id.length);
          var selectivity = (
          v.hasOwnProperty('selectivityEstimate')
            ? (v.selectivityEstimate * 100).toFixed(2) + '%'
            : 'n/a'
          );
          var sparse = (v.hasOwnProperty('sparse') ? v.sparse : 'n/a');

          $('#collectionEditIndexTable').append(
            '<tr>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + indexId + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + v.type + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + v.unique + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + sparse + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + selectivity + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + fieldString + '</th>' +
            '<th class=' + JSON.stringify(cssClass) + '>' + actionString + '</th>' +
            '</tr>'
          );
        });
      }
      this.bindIndexEvents();
    },

    selectIndexType: function () {
      $('.newIndexClass').hide();
      var type = $('#newIndexType').val();
      if (type === null) {
        type = $('#newIndexType').children().first().attr('value');
        $('#newIndexType').val(type);
      }
      $('#newIndexType' + type).show();
    },

    resetIndexForms: function () {
      $('#indexHeader input').val('').prop('checked', false);
      $('#newIndexType').val('Geo').prop('selected', true);
      this.selectIndexType();
    },

    toggleNewIndexView: function () {
      var elem = $('.index-button-bar2')[0];

      if ($('#indexEditView').is(':visible')) {
        $('#indexEditView').hide();
        $('#newIndexView').show();
        $('#cancelIndex').detach().appendTo('#indexHeaderContent #modal-dialog .modal-footer');
        $('#createIndex').detach().appendTo('#indexHeaderContent #modal-dialog .modal-footer');
      } else {
        $('#indexEditView').show();
        $('#newIndexView').hide();
        $('#cancelIndex').detach().appendTo(elem);
        $('#createIndex').detach().appendTo(elem);
      }

      arangoHelper.fixTooltips('.icon_arangodb, .arangoicon', 'right');
      this.resetIndexForms();
    },

    stringToArray: function (fieldString) {
      var fields = [];
      fieldString.split(',').forEach(function (field) {
        field = field.replace(/(^\s+|\s+$)/g, '');
        if (field !== '') {
          fields.push(field);
        }
      });
      return fields;
    },

    checkboxToValue: function (id) {
      return $(id).prop('checked');
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, Backbone, window, $ */

(function () {
  'use strict';

  window.InfoView = Backbone.View.extend({
    el: '#content',

    initialize: function (options) {
      this.collectionName = options.collectionName;
      this.model = this.collection;
    },

    events: {
    },

    render: function () {
      this.breadcrumb();
      window.arangoHelper.buildCollectionSubNav(this.collectionName, 'Info');

      this.renderInfoView();
    },

    breadcrumb: function () {
      $('#subNavigationBar .breadcrumb').html(
        'Collection: ' + this.collectionName
      );
    },

    renderInfoView: function () {
      if (this.model.get('locked')) {
        return 0;
      }
      var callbackRev = function (error, revision, figures) {
        if (error) {
          arangoHelper.arangoError('Figures', 'Could not get revision.');
        } else {
          var buttons = [];
          var tableContent = {
            figures: figures,
            revision: revision,
            model: this.model
          };
          window.modalView.show(
            'modalCollectionInfo.ejs',
            'Collection: ' + this.model.get('name'),
            buttons,
            tableContent, null, null,
            null, null,
            null, 'content'
          );
        }
      }.bind(this);

      var callback = function (error, data) {
        if (error) {
          arangoHelper.arangoError('Figures', 'Could not get figures.');
        } else {
          var figures = data;
          this.model.getRevision(callbackRev, figures);
        }
      }.bind(this);

      this.model.getFigures(callback);
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, arangoHelper, $, _, window, templateEngine */

(function () {
  'use strict';

  window.LoggerView = Backbone.View.extend({
    el: '#content',
    logsel: '#logEntries',
    id: '#logContent',
    initDone: false,

    pageSize: 20,
    currentPage: 0,

    logTopics: {},
    logLevels: [],

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    initialize: function (options) {
      var self = this;

      if (options) {
        this.options = options;
      }

      this.collection.setPageSize(this.pageSize);

      if (!this.initDone) {
        // first fetch all log topics + topics
        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/log/level'),
          contentType: 'application/json',
          processData: false,
          success: function (data) {
            self.logTopics = data;

            /*
            _.each(self.logTopics, function (topic, name) {
              if (self.logLevels.indexOf(topic.toLowerCase()) === -1) {
                self.logLevels.push(topic.toLowerCase());
                console.log(topic);
              }
            });
            */
            _.each(['fatal', 'error', 'warning', 'info', 'debug'], function (level) {
              self.logLevels.push(level);
            });

            self.initDone = true;
          }
        });
      }
    },

    currentLoglevel: undefined,
    defaultLoglevel: 'info',

    events: {
      'click #logLevelSelection': 'renderLogLevel',
      'click #logTopicSelection': 'renderLogTopic',
      'click #logFilters': 'resetFilters',
      'click #loadMoreEntries': 'loadMoreEntries'
    },

    template: templateEngine.createTemplate('loggerView.ejs'),
    templateEntries: templateEngine.createTemplate('loggerViewEntries.ejs'),

    renderLogTopic: function (e) {
      var self = this;

      if (!this.logTopicOptions) {
        this.logTopicOptions = {};
      }

      var active;
      _.each(this.logTopics, function (topic, name) {
        if (self.logTopicOptions[name]) {
          active = self.logTopicOptions[name].active;
        }
        self.logTopicOptions[name] = {
          name: name,
          active: active || false
        };
      });

      var pos = $(e.currentTarget).position();
      pos.right = '30';

      this.logTopicView = new window.FilterSelectView({
        name: 'Topic',
        options: self.logTopicOptions,
        position: pos,
        callback: self.logTopicCallbackFunction.bind(this),
        multiple: true
      });
      this.logTopicView.render();
    },

    loadMoreEntries: function () {
      this.convertModelToJSON();
    },

    logTopicCallbackFunction: function (options) {
      console.log(options);
      this.logTopicOptions = options;
      this.applyFilter();
    },

    logLevelCallbackFunction: function (options) {
      this.logLevelOptions = options;
      this.applyFilter();
    },

    resetFilters: function () {
      _.each(this.logTopicOptions, function (option) {
        option.active = false;
      });
      _.each(this.logLevelOptions, function (option) {
        option.active = false;
      });
      this.applyFilter();
    },

    isFilterActive: function (filterobj) {
      var active = false;
      _.each(filterobj, function (obj) {
        if (obj.active) {
          active = true;
        }
      });
      return active;
    },

    changeButton: function (btn) {
      if (!btn) {
        $('#logTopicSelection').addClass('button-default').removeClass('button-success');
        $('#logLevelSelection').addClass('button-default').removeClass('button-success');
        $('#logFilters').hide();
        $('#filterDesc').html('');
      } else {
        if (btn === 'level') {
          $('#logLevelSelection').addClass('button-success').removeClass('button-default');
          $('#logTopicSelection').addClass('button-default').removeClass('button-success');
          $('#filterDesc').html(btn);
        } else if (btn === 'topic') {
          $('#logTopicSelection').addClass('button-success').removeClass('button-default');
          $('#logLevelSelection').addClass('button-default').removeClass('button-success');
          $('#filterDesc').html(btn);
        } else if (btn === 'both') {
          $('#logTopicSelection').addClass('button-success').removeClass('button-default');
          $('#logLevelSelection').addClass('button-success').removeClass('button-default');
          $('#filterDesc').html('level, topic');
        }
        $('#logFilters').show();
      }
    },

    applyFilter: function () {
      var self = this;
      var isLevel = this.isFilterActive(this.logLevelOptions);
      var isTopic = this.isFilterActive(this.logTopicOptions);

      if (isLevel && isTopic) {
        // both filters active
        _.each($('#logEntries').children(), function (entry) {
          if (self.logLevelOptions[$(entry).attr('level')].active === false || self.logTopicOptions[$(entry).attr('topic')].active === false) {
            $(entry).hide();
          } else if (self.logLevelOptions[$(entry).attr('level')].active && self.logTopicOptions[$(entry).attr('topic')].active) {
            $(entry).show();
          }
        });
        this.changeButton('both');
      } else if (isLevel && !isTopic) {
        // only level filter active
        _.each($('#logEntries').children(), function (entry) {
          if (self.logLevelOptions[$(entry).attr('level')].active === false) {
            $(entry).hide();
          } else {
            $(entry).show();
          }
        });
        this.changeButton('level');
      } else if (!isLevel && isTopic) {
        // only topic filter active
        _.each($('#logEntries').children(), function (entry) {
          if (self.logTopicOptions[$(entry).attr('topic')].active === false) {
            $(entry).hide();
          } else {
            $(entry).show();
          }
        });
        this.changeButton('topic');
      } else if (!isLevel && !isTopic) {
        _.each($('#logEntries').children(), function (entry) {
          $(entry).show();
        });
        this.changeButton();
      }

      var count = 0;
      _.each($('#logEntries').children(), function (elem) {
        if ($(elem).css('display') === 'block') {
          count++;
        }
      });
      if (count === 1) {
        $('.logBorder').css('visibility', 'hidden');
        $('#noLogEntries').hide();
      } else if (count === 0) {
        $('#noLogEntries').show();
      } else {
        $('.logBorder').css('visibility', 'visible');
        $('#noLogEntries').hide();
      }
    },

    renderLogLevel: function (e) {
      var self = this;

      if (!this.logLevelOptions) {
        this.logLevelOptions = {};
      }

      var active;
      _.each(this.logLevels, function (name) {
        if (self.logLevelOptions[name]) {
          active = self.logLevelOptions[name].active;
        }
        self.logLevelOptions[name] = {
          name: name,
          active: active || false
        };

        var color = arangoHelper.statusColors[name];

        if (color) {
          self.logLevelOptions[name].color = color;
        }
      });

      var pos = $(e.currentTarget).position();
      pos.right = '115';

      this.logLevelView = new window.FilterSelectView({
        name: 'Level',
        options: self.logLevelOptions,
        position: pos,
        callback: self.logLevelCallbackFunction.bind(this),
        multiple: false
      });
      this.logLevelView.render();
    },

    setActiveLoglevel: function (e) {

    },

    initTotalAmount: function () {
      var self = this;
      this.collection.fetch({
        data: $.param(
          {test: true}
        ),
        success: function () {
          self.convertModelToJSON();
        }
      });
      this.fetchedAmount = true;
    },

    invertArray: function (array) {
      var rtnArr = [];
      var counter = 0;
      var i;

      for (i = array.length - 1; i >= 0; i--) {
        rtnArr[counter] = array[i];
        counter++;
      }
      return rtnArr;
    },

    convertModelToJSON: function () {
      if (!this.fetchedAmount) {
        this.initTotalAmount();
        return;
      }

      this.collection.page = this.currentPage;
      this.currentPage++;

      var self = this;
      var date;
      var entries = [];
      this.collection.fetch({
        success: function (settings) {
          self.collection.each(function (model) {
            date = new Date(model.get('timestamp') * 1000);
            entries.push({
              status: model.getLogStatus(),
              date: arangoHelper.formatDT(date),
              timestamp: model.get('timestamp'),
              msg: model.get('text'),
              topic: model.get('topic')
            });
          });
          // invert order
          self.renderLogs(self.invertArray(entries), settings.lastInverseOffset);
        }
      });
    },

    render: function () {
      var self = this;
      this.currentPage = 0;

      if (this.initDone) {
        // render static content
        $(this.el).html(this.template.render({}));

        // fetch dyn. content
        this.convertModelToJSON();
      } else {
        window.setTimeout(function () {
          self.render();
        }, 100);
      }
      return this;
    },

    renderLogs: function (entries, offset) {
      _.each(entries, function (entry) {
        if (entry.msg.indexOf('{' + entry.topic + '}') > -1) {
          entry.msg = entry.msg.replace('{' + entry.topic + '}', '');
        }
      });

      if (this.currentPage === 0) {
        // render initial
        $(this.logsel).html(this.templateEntries.render({
          entries: entries
        }));
      } else {
        // append
        $(this.logsel).append(this.templateEntries.render({
          entries: entries
        }));
      }

      if (offset <= 0) {
        $('#loadMoreEntries').attr('disabled', true);
      } else {
        $('#loadMoreEntries').attr('disabled', false);
      }
      arangoHelper.createTooltips();
      this.applyFilter();
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, document, _, arangoHelper, window, setTimeout, $, templateEngine, frontendConfig */

(function () {
  'use strict';
  window.LoginView = Backbone.View.extend({
    el: '#content',
    el2: '.header',
    el3: '.footer',
    loggedIn: false,
    loginCounter: 0,

    events: {
      'keyPress #loginForm input': 'keyPress',
      'click #submitLogin': 'validate',
      'submit #dbForm': 'goTo',
      'click #logout': 'logout',
      'change #loginDatabase': 'renderDBS'
    },

    template: templateEngine.createTemplate('loginView.ejs'),

    render: function (loggedIn) {
      var self = this;
      $(this.el).html(this.template.render({}));
      $(this.el2).hide();
      $(this.el3).hide();

      var continueRender = function (user, errCallback) {
        var url;
        if (!user) {
          url = arangoHelper.databaseUrl('/_api/database/user');
        } else {
          url = arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(user) + '/database', '_system');
        }

        if (frontendConfig.authenticationEnabled === false) {
          $('#logout').hide();
          $('.login-window #databases').css('height', '90px');
        }

        $('#loginForm').hide();
        $('.login-window #databases').show();

        $.ajax(url).success(function (permissions) {
          var successFunc = function (availableDbs) {
            //  enable db select and login button
            $('#loginDatabase').html('');
            // fill select with allowed dbs
            _.each(permissions.result, function (rule, db) {
              if (errCallback) {
                if (availableDbs) {
                  if (availableDbs.indexOf(db) > -1) {
                    $('#loginDatabase').append(
                      '<option>' + db + '</option>'
                    );
                  }
                } else {
                  $('#loginDatabase').append(
                    '<option>' + db + '</option>'
                  );
                }
              } else {
                if (availableDbs) {
                  if (availableDbs.indexOf(rule) > -1) {
                    $('#loginDatabase').append(
                      '<option>' + rule + '</option>'
                    );
                  }
                } else {
                  $('#loginDatabase').append(
                    '<option>' + rule + '</option>'
                  );
                }
              }
            });

            self.renderDBS();
          };

          // fetch available dbs
          var availableDbs;
          try {
            $.ajax(arangoHelper.databaseUrl('/_api/database/user')).success(function (dbs) {
              availableDbs = dbs.result;
              successFunc(availableDbs);
            });
          } catch (ignore) {
            successFunc();
          }
        }).error(function () {
          if (errCallback) {
            errCallback();
          } else {
            console.log('could not fetch user db data');
          }
        });
      };

      if (frontendConfig.authenticationEnabled && loggedIn !== true) {
        var usr = arangoHelper.getCurrentJwtUsername();
        if (usr !== null && usr !== 'undefined' && usr !== undefined) {
          // try if existent jwt is valid
          var errCallback = function () {
            self.collection.logout();
            window.setTimeout(function () {
              $('#loginUsername').focus();
            }, 300);
          };
          continueRender(arangoHelper.getCurrentJwtUsername(), errCallback);
        } else {
          window.setTimeout(function () {
            $('#loginUsername').focus();
          }, 300);
        }
      } else {
        continueRender();
      }

      $('.bodyWrapper').show();
      self.checkVersion();

      return this;
    },

    checkVersion: function () {
      var self = this;
      window.setTimeout(function () {
        var a = document.getElementById('loginSVG');
        var svgDoc = a.contentDocument;
        var svgItem;

        if (frontendConfig.isEnterprise !== undefined) {
          if (frontendConfig.isEnterprise) {
            svgItem = svgDoc.getElementById('logo-enterprise');
          } else {
            svgItem = svgDoc.getElementById('logo-community');
          }
          svgItem.setAttribute('visibility', 'visible');
        } else {
          self.checkVersion();
        }
      }, 150);
    },

    clear: function () {
      $('#loginForm input').removeClass('form-error');
      $('.wrong-credentials').hide();
    },

    keyPress: function (e) {
      if (e.ctrlKey && e.keyCode === 13) {
        e.preventDefault();
        this.validate();
      } else if (e.metaKey && e.keyCode === 13) {
        e.preventDefault();
        this.validate();
      }
    },

    validate: function (event) {
      event.preventDefault();
      this.clear();

      var username = $('#loginUsername').val();
      var password = $('#loginPassword').val();

      if (!username) {
        // do not send unneccessary requests if no user is given
        return;
      }

      this.collection.login(username, password, this.loginCallback.bind(this, username, password));
    },

    loginCallback: function (username, password, error) {
      var self = this;

      if (error) {
        if (self.loginCounter === 0) {
          self.loginCounter++;
          self.collection.login(username, password, this.loginCallback.bind(this, username));
          return;
        }
        self.loginCounter = 0;
        $('.wrong-credentials').show();
        $('#loginDatabase').html('');
        $('#loginDatabase').append(
          '<option>_system</option>'
        );
      } else {
        self.renderDBSelection(username);
      }
    },

    renderDBSelection: function (username) {
      var self = this;
      var url = arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(username) + '/database', '_system');

      if (frontendConfig.authenticationEnabled === false) {
        url = arangoHelper.databaseUrl('/_api/database/user');
      }

      $('.wrong-credentials').hide();
      self.loggedIn = true;

      // get list of allowed dbs
      $.ajax(url).success(function (permissions) {
        // HANDLE PERMISSIONS
        _.each(permissions.result, function (value, key) {
          if (value !== 'rw') {
            delete permissions.result[key];
          }
        });

        $('#loginForm').hide();
        $('.login-window #databases').show();

        // enable db select and login button
        $('#loginDatabase').html('');

        var successFunc = function (availableDbs) {
          if (availableDbs) {
            _.each(permissions.result, function (db, key) {
              if (availableDbs.indexOf(key) > -1) {
                $('#loginDatabase').append(
                  '<option>' + key + '</option>'
                );
              }
            });
          } else {
            // fill select with allowed dbs
            _.each(permissions.result, function (db, key) {
              $('#loginDatabase').append(
                '<option>' + key + '</option>'
              );
            });
          }

          self.renderDBS();
        };

        // fetch available dbs
        try {
          $.ajax(arangoHelper.databaseUrl('/_api/database/user')).success(function (dbs) {
            successFunc(dbs.result);
          });
        } catch (ignore) {
          successFunc();
        }
      }).error(function () {
        $('.wrong-credentials').show();
      });
    },

    renderDBS: function () {
      if ($('#loginDatabase').children().length === 0) {
        $('#dbForm').remove();
        $('.login-window #databases').prepend(
          '<div class="no-database">You do not have permission to a database.</div>'
        );
      } else {
        var db = $('#loginDatabase').val();
        $('#goToDatabase').html('Select DB: ' + db);
        window.setTimeout(function () {
          $('#goToDatabase').focus();
        }, 300);
      }
    },

    logout: function () {
      this.collection.logout();
    },

    goTo: function (e) {
      e.preventDefault();
      var username = $('#loginUsername').val();
      var database = $('#loginDatabase').val();
      window.App.dbSet = database;

      var callback2 = function (error) {
        if (error) {
          arangoHelper.arangoError('User', 'Could not fetch user settings');
        }
      };

      var path = window.location.protocol + '//' + window.location.host +
        frontendConfig.basePath + '/_db/' + database + '/_admin/aardvark/index.html';

      window.location.href = path;

      // show hidden divs
      $(this.el2).show();
      $(this.el3).show();
      $('.bodyWrapper').show();
      $('.navbar').show();

      $('#currentUser').text(username);
      this.collection.loadUserSettings(callback2);
    }

  });
}());

/* jshint browser: true */
/* global Backbone, $, window, setTimeout, Joi, _, arangoHelper */
/* global templateEngine */

(function () {
  'use strict';

  var createButtonStub = function (type, title, cb, confirm) {
    return {
      type: type,
      title: title,
      callback: cb,
      confirm: confirm
    };
  };

  var createTextStub = function (type, label, value, info, placeholder, mandatory, joiObj,
    addDelete, addAdd, maxEntrySize, tags) {
    var obj = {
      type: type,
      label: label
    };
    if (value !== undefined) {
      obj.value = value;
    }
    if (info !== undefined) {
      obj.info = info;
    }
    if (placeholder !== undefined) {
      obj.placeholder = placeholder;
    }
    if (mandatory !== undefined) {
      obj.mandatory = mandatory;
    }
    if (addDelete !== undefined) {
      obj.addDelete = addDelete;
    }
    if (addAdd !== undefined) {
      obj.addAdd = addAdd;
    }
    if (maxEntrySize !== undefined) {
      obj.maxEntrySize = maxEntrySize;
    }
    if (tags !== undefined) {
      obj.tags = tags;
    }
    if (joiObj) {
      // returns true if the string contains the match
      obj.validateInput = function () {
        // return regexp.test(el.val())
        return joiObj;
      };
    }
    return obj;
  };

  window.ModalView = Backbone.View.extend({
    _validators: [],
    _validateWatchers: [],
    baseTemplate: templateEngine.createTemplate('modalBase.ejs'),
    tableTemplate: templateEngine.createTemplate('modalTable.ejs'),
    el: '#modalPlaceholder',
    contentEl: '#modalContent',
    hideFooter: false,
    confirm: {
      list: '#modal-delete-confirmation',
      yes: '#modal-confirm-delete',
      no: '#modal-abort-delete'
    },
    enabledHotkey: false,
    enableHotKeys: true,

    buttons: {
      SUCCESS: 'success',
      NOTIFICATION: 'notification',
      DELETE: 'danger',
      NEUTRAL: 'neutral',
      CLOSE: 'close'
    },
    tables: {
      READONLY: 'readonly',
      TEXT: 'text',
      BLOB: 'blob',
      PASSWORD: 'password',
      SELECT: 'select',
      SELECT2: 'select2',
      CHECKBOX: 'checkbox'
    },

    initialize: function () {
      Object.freeze(this.buttons);
      Object.freeze(this.tables);
    },

    createModalHotkeys: function () {
      // submit modal
      $(this.el).unbind('keydown');
      $(this.el).unbind('return');
      $(this.el).bind('keydown', 'return', function () {
        $('.createModalDialog .modal-footer .button-success').click();
      });

      $('.modal-body input').unbind('keydown');
      $('.modal-body input').unbind('return');
      $('.modal-body input', $(this.el)).bind('keydown', 'return', function () {
        $('.createModalDialog .modal-footer .button-success').click();
      });

      $('.modal-body select').unbind('keydown');
      $('.modal-body select').unbind('return');
      $('.modal-body select', $(this.el)).bind('keydown', 'return', function () {
        $('.createModalDialog .modal-footer .button-success').click();
      });
    },

    createInitModalHotkeys: function () {
      var self = this;
      // navigate through modal buttons
      // left cursor
      $(this.el).bind('keydown', 'left', function () {
        self.navigateThroughButtons('left');
      });
      // right cursor
      $(this.el).bind('keydown', 'right', function () {
        self.navigateThroughButtons('right');
      });
    },

    navigateThroughButtons: function (direction) {
      var hasFocus = $('.createModalDialog .modal-footer button').is(':focus');
      if (hasFocus === false) {
        if (direction === 'left') {
          $('.createModalDialog .modal-footer button').first().focus();
        } else if (direction === 'right') {
          $('.createModalDialog .modal-footer button').last().focus();
        }
      } else if (hasFocus === true) {
        if (direction === 'left') {
          $(':focus').prev().focus();
        } else if (direction === 'right') {
          $(':focus').next().focus();
        }
      }
    },

    createCloseButton: function (title, cb) {
      var self = this;
      return createButtonStub(this.buttons.CLOSE, title, function () {
        self.hide();
        if (cb) {
          cb();
        }
      });
    },

    createSuccessButton: function (title, cb) {
      return createButtonStub(this.buttons.SUCCESS, title, cb);
    },

    createNotificationButton: function (title, cb) {
      return createButtonStub(this.buttons.NOTIFICATION, title, cb);
    },

    createDeleteButton: function (title, cb, confirm) {
      return createButtonStub(this.buttons.DELETE, title, cb, confirm);
    },

    createNeutralButton: function (title, cb) {
      return createButtonStub(this.buttons.NEUTRAL, title, cb);
    },

    createDisabledButton: function (title) {
      var disabledButton = createButtonStub(this.buttons.NEUTRAL, title);
      disabledButton.disabled = true;
      return disabledButton;
    },

    createReadOnlyEntry: function (id, label, value, info, addDelete, addAdd) {
      var obj = createTextStub(this.tables.READONLY, label, value, info, undefined, undefined,
        undefined, addDelete, addAdd);
      obj.id = id;
      return obj;
    },

    createTextEntry: function (id, label, value, info, placeholder, mandatory, regexp) {
      var obj = createTextStub(this.tables.TEXT, label, value, info, placeholder, mandatory,
        regexp);
      obj.id = id;
      return obj;
    },

    createBlobEntry: function (id, label, value, info, placeholder, mandatory, regexp) {
      var obj = createTextStub(this.tables.BLOB, label, value, info, placeholder, mandatory,
        regexp);
      obj.id = id;
      return obj;
    },

    createSelect2Entry: function (
      id, label, value, info, placeholder, mandatory, addDelete, addAdd, maxEntrySize, tags) {
      var obj = createTextStub(this.tables.SELECT2, label, value, info, placeholder,
        mandatory, undefined, addDelete, addAdd, maxEntrySize, tags);
      obj.id = id;
      return obj;
    },

    createPasswordEntry: function (id, label, value, info, placeholder, mandatory, regexp) {
      var obj = createTextStub(this.tables.PASSWORD, label, value, info, placeholder, mandatory, regexp);
      obj.id = id;
      return obj;
    },

    createCheckboxEntry: function (id, label, value, info, checked) {
      var obj = createTextStub(this.tables.CHECKBOX, label, value, info);
      obj.id = id;
      if (checked) {
        obj.checked = checked;
      }
      if (value) {
        obj.checked = value;
      }

      return obj;
    },

    createSelectEntry: function (id, label, selected, info, options) {
      var obj = createTextStub(this.tables.SELECT, label, null, info);
      obj.id = id;
      if (selected) {
        obj.selected = selected;
      }
      obj.options = options;
      return obj;
    },

    createOptionEntry: function (label, value) {
      return {
        label: label,
        value: value || label
      };
    },

    show: function (templateName, title, buttons, tableContent, advancedContent,
      extraInfo, events, noConfirm, tabBar, divID) {
      var self = this;
      var lastBtn;
      var confirmMsg;
      var closeButtonFound = false;

      buttons = buttons || [];
      noConfirm = Boolean(noConfirm);
      this.clearValidators();
      if (buttons.length > 0) {
        buttons.forEach(function (b) {
          if (b.type === self.buttons.CLOSE) {
            closeButtonFound = true;
          }
          if (b.type === self.buttons.DELETE) {
            confirmMsg = confirmMsg || b.confirm;
          }
        });
        if (!closeButtonFound) {
          // Insert close as second from right
          lastBtn = buttons.pop();
          buttons.push(self.createCloseButton('Cancel'));
          buttons.push(lastBtn);
        }
      } else {
        buttons.push(self.createCloseButton('Close'));
      }
      if (!divID) {
        $(this.el).html(this.baseTemplate.render({
          title: title,
          buttons: buttons,
          hideFooter: this.hideFooter,
          confirm: confirmMsg,
          tabBar: tabBar
        }));
      } else {
        // render into custom div
        $('#' + divID).html(this.baseTemplate.render({
          title: title,
          buttons: buttons,
          hideFooter: this.hideFooter,
          confirm: confirmMsg,
          tabBar: tabBar
        }));
        // remove not needed modal elements
        $('#' + divID + ' #modal-dialog').removeClass('fade hide modal');
        $('#' + divID + ' .modal-header').remove();
        $('#' + divID + ' .modal-tabbar').remove();
        $('#' + divID + ' .modal-tabbar').remove();
        $('#' + divID + ' .button-close').remove();
        if ($('#' + divID + ' .modal-footer').children().length === 0) {
          $('#' + divID + ' .modal-footer').remove();
        }
      }
      _.each(buttons, function (b, i) {
        if (b.disabled || !b.callback) {
          return;
        }
        if (b.type === self.buttons.DELETE && !noConfirm) {
          var string = '#modalButton' + i;
          if (divID) {
            string = '#' + divID + ' #modalButton' + i;
          }
          $(string).bind('click', function () {
            if (divID) {
              $('#' + divID + ' ' + self.confirm.yes).unbind('click');
              $('#' + divID + ' ' + self.confirm.yes).bind('click', b.callback);
              $('#' + divID + ' ' + self.confirm.list).css('display', 'block');
            } else {
              $(self.confirm.yes).unbind('click');
              $(self.confirm.yes).bind('click', b.callback);
              $(self.confirm.list).css('display', 'block');
            }
          });
          return;
        }
        if (divID) {
          $('#' + divID + ' ' + '#modalButton' + i).bind('click', b.callback);
        } else {
          $('#modalButton' + i).bind('click', b.callback);
        }
      });

      if (divID) {
        $('#' + divID + ' ' + this.confirm.no).bind('click', function () {
          $('#' + divID + ' ' + self.confirm.list).css('display', 'none');
        });
      } else {
        $(this.confirm.no).bind('click', function () {
          $(self.confirm.list).css('display', 'none');
        });
      }

      var template;
      if (typeof templateName === 'string') {
        template = templateEngine.createTemplate(templateName);
        if (divID) {
          $('#' + divID + ' .createModalDialog .modal-body').html(template.render({
            content: tableContent,
            advancedContent: advancedContent,
            info: extraInfo
          }));
        } else {
          $('#modalPlaceholder .createModalDialog .modal-body').html(template.render({
            content: tableContent,
            advancedContent: advancedContent,
            info: extraInfo
          }));
        }
      } else {
        var counter = 0;
        _.each(templateName, function (v) {
          template = templateEngine.createTemplate(v);
          $('.createModalDialog .modal-body .tab-content #' + tabBar[counter]).html(template.render({
            content: tableContent,
            advancedContent: advancedContent,
            info: extraInfo
          }));

          counter++;
        });
      }

      arangoHelper.createTooltips('.createModalDialog .modalTooltips', 'left');

      var completeTableContent = tableContent || [];
      if (advancedContent && advancedContent.content) {
        completeTableContent = completeTableContent.concat(advancedContent.content);
      }

      _.each(completeTableContent, function (row) {
        self.modalBindValidation(row);
        if (row.type === self.tables.SELECT2) {
          // handle select2
          $('#' + row.id).select2({
            tags: row.tags || [],
            showSearchBox: false,
            minimumResultsForSearch: -1,
            width: '336px',
            maximumSelectionSize: row.maxEntrySize || 8
          });
        }
      });

      if (events) {
        this.events = events;
        this.delegateEvents();
      }

      if ($('#accordion2')) {
        $('#accordion2 .accordion-toggle').bind('click', function () {
          if ($('#collapseOne').is(':visible')) {
            $('#collapseOne').hide();
            setTimeout(function () {
              $('.accordion-toggle').addClass('collapsed');
            }, 100);
          } else {
            $('#collapseOne').show();
            setTimeout(function () {
              $('.accordion-toggle').removeClass('collapsed');
            }, 100);
          }
        });
        $('#collapseOne').hide();
        setTimeout(function () {
          $('.accordion-toggle').addClass('collapsed');
        }, 100);
      }

      if (!divID) {
        $('#modal-dialog').modal('show');
      }

      // enable modal hotkeys after rendering is complete
      if (this.enabledHotkey === false) {
        this.createInitModalHotkeys();
        this.enabledHotkey = true;
      }
      if (this.enableHotKeys) {
        this.createModalHotkeys();
      }

      // if input-field is available -> autofocus first one
      var focus;
      if (divID) {
        focus = $('#' + divID + ' ' + '#modal-dialog').find('input');
      } else {
        focus = $('#modal-dialog').find('input');
      }
      if (focus) {
        setTimeout(function () {
          if (divID) {
            focus = $('#' + divID + ' ' + '#modal-dialog');
          } else {
            focus = $('#modal-dialog');
          }
          if (focus.length > 0) {
            focus = focus.find('input');
            if (focus.length > 0) {
              $(focus[0]).focus();
            }
          }
        }, 400);
      }
    },

    modalBindValidation: function (entry) {
      var self = this;
      if (entry.hasOwnProperty('id') &&
          entry.hasOwnProperty('validateInput')) {
        var validCheck = function () {
          var $el = $('#' + entry.id);
          var validation = entry.validateInput($el);
          var error = false;
          _.each(validation, function (validator) {
            var value = $el.val();
            if (!validator.rule) {
              validator = {rule: validator};
            }
            if (typeof validator.rule === 'function') {
              try {
                validator.rule(value);
              } catch (e) {
                error = validator.msg || e.message;
              }
            } else {
              var result = Joi.validate(value, validator.rule);
              if (result.error) {
                error = validator.msg || result.error.message;
              }
            }
            if (error) {
              return false;
            }
          });
          if (error) {
            return error;
          }
        };
        var $el = $('#' + entry.id);
        // catch result of validation and act
        $el.on('keyup focusout', function () {
          var msg = validCheck();
          var errorElement = $el.next()[0];
          if (msg) {
            $el.addClass('invalid-input');
            if (errorElement) {
              // error element available
              $(errorElement).text(msg);
            } else {
              // error element not available
              $el.after('<p class="errorMessage">' + msg + '</p>');
            }
            $('.createModalDialog .modal-footer .button-success')
              .prop('disabled', true)
              .addClass('disabled');
          } else {
            $el.removeClass('invalid-input');
            if (errorElement) {
              $(errorElement).remove();
            }
            self.modalTestAll();
          }
        });
        this._validators.push(validCheck);
        this._validateWatchers.push($el);
      }
    },

    modalTestAll: function () {
      var tests = _.map(this._validators, function (v) {
        return v();
      });
      var invalid = _.any(tests);
      if (invalid) {
        $('.createModalDialog .modal-footer .button-success')
          .prop('disabled', true)
          .addClass('disabled');
      } else {
        $('.createModalDialog .modal-footer .button-success')
          .prop('disabled', false)
          .removeClass('disabled');
      }
      return !invalid;
    },

    clearValidators: function () {
      this._validators = [];
      _.each(this._validateWatchers, function (w) {
        w.unbind('keyup focusout');
      });
      this._validateWatchers = [];
    },

    hide: function () {
      this.clearValidators();
      $('#modal-dialog').modal('hide');
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, templateEngine, $, window, arangoHelper, _ */
(function () {
  'use strict';
  window.NavigationView = Backbone.View.extend({
    el: '#navigationBar',
    subEl: '#subNavigationBar',

    events: {
      'change #arangoCollectionSelect': 'navigateBySelect',
      'click .tab': 'navigateByTab',
      'click li': 'switchTab',
      'click .arangodbLogo': 'selectMenuItem',
      'mouseenter .dropdown > *': 'showDropdown',
      'click .shortcut-icons p': 'showShortcutModal',
      'mouseleave .dropdown': 'hideDropdown'
    },

    renderFirst: true,
    activeSubMenu: undefined,

    changeDB: function () {
      window.location.hash = '#login';
    },

    initialize: function (options) {
      var self = this;

      this.userCollection = options.userCollection;
      this.currentDB = options.currentDB;
      this.dbSelectionView = new window.DBSelectionView({
        collection: options.database,
        current: this.currentDB
      });
      this.userBarView = new window.UserBarView({
        userCollection: this.userCollection
      });
      this.notificationView = new window.NotificationView({
        collection: options.notificationCollection
      });
      this.statisticBarView = new window.StatisticBarView({
        currentDB: this.currentDB
      });

      this.isCluster = options.isCluster;

      this.handleKeyboardHotkeys();

      Backbone.history.on('all', function () {
        self.selectMenuItem();
      });
    },

    showShortcutModal: function () {
      arangoHelper.hotkeysFunctions.showHotkeysModal();
    },

    handleSelectDatabase: function () {
      this.dbSelectionView.render($('#dbSelect'));
    },

    template: templateEngine.createTemplate('navigationView.ejs'),
    templateSub: templateEngine.createTemplate('subNavigationView.ejs'),

    render: function () {
      var self = this;

      $(this.el).html(this.template.render({
        currentDB: this.currentDB,
        isCluster: this.isCluster
      }));

      if (this.currentDB.get('name') !== '_system') {
        $('#dashboard').parent().remove();
      }

      $(this.subEl).html(this.templateSub.render({
        currentDB: this.currentDB.toJSON()
      }));

      this.dbSelectionView.render($('#dbSelect'));
      // this.notificationView.render($("#notificationBar"))

      var callback = function (error) {
        if (!error) {
          this.userBarView.render();
        }
      }.bind(this);

      this.userCollection.whoAmI(callback);
      // this.statisticBarView.render($("#statisticBar"))

      if (this.renderFirst) {
        this.renderFirst = false;

        this.selectMenuItem();

        $('.arangodbLogo').on('click', function () {
          self.selectMenuItem();
        });

        $('#dbStatus').on('click', function () {
          self.changeDB();
        });
      }

      self.resize();

      if (window.frontendConfig.isEnterprise === true) {
        $('#ArangoDBLogo').after('<span id="enterpriseLabel" style="display: none">Enterprise Edition</span>');
        $('#enterpriseLabel').fadeIn('slow');
      } else {
        $('#ArangoDBLogo').after('<span id="communityLabel" style="display: none">Community Edition</span>');
        $('#communityLabel').fadeIn('slow');
        $('.enterprise-menu').show();
      }

      return this;
    },

    resize: function () {
      // set menu sizes - responsive
      var height = $(window).height() - $('.subMenuEntries').first().height();
      $('#navigationBar').css('min-height', height);
      $('#navigationBar').css('height', height);
    },

    navigateBySelect: function () {
      var navigateTo = $('#arangoCollectionSelect').find('option:selected').val();
      window.App.navigate(navigateTo, {trigger: true});
    },

    handleKeyboardHotkeys: function () {
      arangoHelper.enableKeyboardHotkeys(true);
    },

    navigateByTab: function (e) {
      var tab = e.target || e.srcElement;
      var navigateTo = tab.id;
      var dropdown = false;

      if (navigateTo === 'enterprise') {
        return;
      }

      if ($(tab).hasClass('fa')) {
        return;
      }

      if (navigateTo === '') {
        navigateTo = $(tab).attr('class');
      }

      if (navigateTo === 'links') {
        dropdown = true;
        $('#link_dropdown').slideToggle(1);
        e.preventDefault();
      } else if (navigateTo === 'tools') {
        dropdown = true;
        $('#tools_dropdown').slideToggle(1);
        e.preventDefault();
      } else if (navigateTo === 'dbselection') {
        dropdown = true;
        $('#dbs_dropdown').slideToggle(1);
        e.preventDefault();
      }

      if (!dropdown) {
        window.App.navigate(navigateTo, {trigger: true});
        e.preventDefault();
      }
    },

    handleSelectNavigation: function () {
      var self = this;
      $('#arangoCollectionSelect').change(function () {
        self.navigateBySelect();
      });
    },

    subViewConfig: {
      documents: 'collections',
      collection: 'collections'
    },

    subMenuConfig: {
      cluster: [
        {
          name: 'Dashboard',
          view: undefined,
          active: true
        },
        {
          name: 'Logs',
          view: undefined,
          disabled: true
        }
      ],
      collections: [
        {
          name: '',
          view: undefined,
          active: false
        }
      ],
      queries: [
        {
          name: 'Editor',
          route: 'query',
          active: true
        },
        {
          name: 'Running Queries',
          route: 'queryManagement',
          params: {
            active: true
          },
          active: undefined
        },
        {
          name: 'Slow Query History',
          route: 'queryManagement',
          params: {
            active: false
          },
          active: undefined
        }
      ]
    },

    renderSubMenu: function (id) {
      var self = this;

      if (id === undefined) {
        if (window.isCluster) {
          id = 'cluster';
        } else {
          id = 'dashboard';
        }
      }

      if (this.subMenuConfig[id]) {
        $(this.subEl + ' .bottom').html('');
        var cssclass = '';

        _.each(this.subMenuConfig[id], function (menu) {
          if (menu.active) {
            cssclass = 'active';
          } else {
            cssclass = '';
          }
          if (menu.disabled) {
            cssclass = 'disabled';
          }

          $(self.subEl + ' .bottom').append(
            '<li class="subMenuEntry ' + cssclass + '"><a>' + menu.name + '</a></li>'
          );
          if (!menu.disabled) {
            $(self.subEl + ' .bottom').children().last().bind('click', function (elem) {
              $('#subNavigationBar .breadcrumb').html('');
              self.activeSubMenu = menu;
              self.renderSubView(menu, elem);
            });
          }
        });
      } else {
        $(self.subEl + ' .bottom').append(
          '<li class="subMenuEntry</li>'
        );
      }
    },

    renderSubView: function (menu, element) {
      // trigger routers route
      if (window.App[menu.route]) {
        if (window.App[menu.route].resetState) {
          window.App[menu.route].resetState();
        }
        window.App[menu.route]();
      }

      // select active sub view entry
      $(this.subEl + ' .bottom').children().removeClass('active');
      $(element.currentTarget).addClass('active');
    },

    switchTab: function (e) {
      var id = $(e.currentTarget).children().first().attr('id');

      if (id === 'enterprise') {
        window.open('https://www.arangodb.com/download-arangodb-enterprise/', '_blank');
        return;
      }

      if (id) {
        this.selectMenuItem(id + '-menu');
      }
    },

    /*
    breadcrumb: function (name) {

      if (window.location.hash.split('/')[0] !== '#collection') {
        $('#subNavigationBar .breadcrumb').html(
          '<a class="activeBread" href="#' + name + '">' + name + '</a>'
        )
      }

    },
    */

    selectMenuItem: function (menuItem, noMenuEntry) {
      if (menuItem === undefined) {
        menuItem = window.location.hash.split('/')[0];
        menuItem = menuItem.substr(1, menuItem.length - 1);
      }

      // Location for selecting MainView Primary Navigaation Entry
      if (menuItem === '') {
        if (window.App.isCluster) {
          menuItem = 'cluster';
        } else {
          menuItem = 'dashboard';
        }
      } else if (menuItem === 'cNodes' || menuItem === 'dNodes') {
        menuItem = 'nodes';
      }
      try {
        this.renderSubMenu(menuItem.split('-')[0]);
      } catch (e) {
        this.renderSubMenu(menuItem);
      }

      // this.breadcrumb(menuItem.split('-')[0])

      $('.navlist li').removeClass('active');
      if (typeof menuItem === 'string') {
        if (noMenuEntry) {
          $('.' + this.subViewConfig[menuItem] + '-menu').addClass('active');
        } else if (menuItem) {
          $('.' + menuItem).addClass('active');
          $('.' + menuItem + '-menu').addClass('active');
        }
      }
      arangoHelper.hideArangoNotifications();
    },

    showSubDropdown: function (e) {
      $(e.currentTarget).find('.subBarDropdown').toggle();
    },

    showDropdown: function (e) {
      var tab = e.target || e.srcElement;
      var navigateTo = tab.id;
      if (navigateTo === 'links' || navigateTo === 'link_dropdown' || e.currentTarget.id === 'links') {
        $('#link_dropdown').fadeIn(1);
      } else if (navigateTo === 'tools' || navigateTo === 'tools_dropdown' || e.currentTarget.id === 'tools') {
        $('#tools_dropdown').fadeIn(1);
      } else if (navigateTo === 'dbselection' || navigateTo === 'dbs_dropdown' || e.currentTarget.id === 'dbselection') {
        $('#dbs_dropdown').fadeIn(1);
      }
    },

    hideDropdown: function (e) {
      // var tab = e.target || e.srcElement;
      // tab = $(tab).parent();
      $('#link_dropdown').fadeOut(1);
      $('#tools_dropdown').fadeOut(1);
      $('#dbs_dropdown').fadeOut(1);
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, $, Backbone, templateEngine, window */
(function () {
  'use strict';

  window.NodeInfoView = Backbone.View.extend({
    el: '#content',

    template: templateEngine.createTemplate('nodeInfoView.ejs'),

    initialize: function (options) {
      if (window.App.isCluster) {
        this.nodeId = options.nodeId;
        this.dbServers = options.dbServers;
        this.coordinators = options.coordinators;
      }
    },

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    render: function () {
      this.$el.html(this.template.render({entries: []}));

      var callback = function () {
        this.continueRender();
        this.breadcrumb(arangoHelper.getCoordinatorShortName(this.nodeId));
        $(window).trigger('resize');
      }.bind(this);

      if (!this.initCoordDone) {
        this.waitForCoordinators();
      }

      if (!this.initDBDone) {
        this.waitForDBServers(callback);
      } else {
        this.nodeId = window.location.hash.split('/')[1];
        this.coordinator = this.coordinators.findWhere({name: this.coordname});
        callback();
      }
    },

    continueRender: function () {
      var model;
      if (this.coordinator) {
        model = this.coordinator.toJSON();
      } else {
        model = this.dbServer.toJSON();
      }

      var renderObj = {};
      if (model.name) {
        renderObj.Name = model.name;
      }
      if (model.address) {
        renderObj.Address = model.address;
      }
      if (model.status) {
        renderObj.Status = model.status;
      }
      if (model.protocol) {
        renderObj.Protocol = model.protocol;
      }
      if (model.role) {
        renderObj.Role = model.role;
      }
      this.$el.html(this.template.render({entries: renderObj}));
    },

    breadcrumb: function (name) {
      $('#subNavigationBar .breadcrumb').html('Node: ' + name);
    },

    waitForCoordinators: function (callback) {
      var self = this;

      window.setTimeout(function () {
        if (self.coordinators.length === 0) {
          self.waitForCoordinators(callback);
        } else {
          self.coordinator = self.coordinators.findWhere({name: self.nodeId});
          self.initCoordDone = true;
          if (callback) {
            callback();
          }
        }
      }, 200);
    },

    waitForDBServers: function (callback) {
      var self = this;

      window.setTimeout(function () {
        if (self.dbServers.length === 0) {
          self.waitForDBServers(callback);
        } else {
          self.initDBDone = true;

          self.dbServers.each(function (model) {
            if (model.get('id') === self.nodeId) {
              self.dbServer = model;
            }
          });

          callback();
        }
      }, 200);
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, Backbone, templateEngine, $, window, _ */
(function () {
  'use strict';

  window.NodesView = Backbone.View.extend({
    el: '#content',
    template: templateEngine.createTemplate('nodesView.ejs'),
    interval: 10000,
    knownServers: [],

    events: {
      'click #nodesContent .coords-nodes .pure-table-row': 'navigateToNode',
      'click #nodesContent .dbs-nodes .pure-table-row': 'navigateToNode',
      'click #nodesContent .coords-nodes .pure-table-row .fa-trash-o': 'deleteNode',
      'click #nodesContent .dbs-nodes .pure-table-row .fa-trash-o': 'deleteNode',
      'click #addCoord': 'addCoord',
      'click #removeCoord': 'removeCoord',
      'click #addDBs': 'addDBs',
      'click #removeDBs': 'removeDBs',
      'click .abortClusterPlan': 'abortClusterPlanModal',
      'keyup #plannedCoords': 'checkKey',
      'keyup #plannedDBs': 'checkKey'
    },

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    checkKey: function (e) {
      if (e.keyCode === 13) {
        var self = this;

        var callbackFunction = function (e) {
          var number;
          if (e.target.id === 'plannedCoords') {
            try {
              number = JSON.parse($('#plannedCoords').val());
              if (typeof number === 'number') {
                window.modalView.hide();
                self.setCoordSize(number);
              } else {
                arangoHelper.arangoError('Error', 'Invalid value. Must be a number.');
              }
            } catch (e) {
              arangoHelper.arangoError('Error', 'Invalid value. Must be a number.');
            }
          } else if (e.target.id === 'plannedDBs') {
            try {
              number = JSON.parse($('#plannedCoords').val());
              if (typeof number === 'number') {
                window.modalView.hide();
                self.setDBsSize(number);
              } else {
                arangoHelper.arangoError('Error', 'Invalid value. Must be a number.');
              }
            } catch (e) {
              arangoHelper.arangoError('Error', 'Invalid value. Must be a number.');
            }
          }
        };

        this.changePlanModal(callbackFunction.bind(null, e));
      }
    },

    changePlanModal: function (func, element) {
      var buttons = []; var tableContent = [];
      tableContent.push(
        window.modalView.createReadOnlyEntry(
          'plan-confirm-button',
          'Caution',
          'You are changing the cluster plan. Continue?',
          undefined,
          undefined,
          false,
          /[<>&'"]/
        )
      );
      buttons.push(
        window.modalView.createSuccessButton('Yes', func.bind(this, element))
      );
      window.modalView.show('modalTable.ejs', 'Modify Cluster Size', buttons, tableContent);
    },

    initialize: function () {
      var self = this;
      clearInterval(this.intervalFunction);

      if (window.App.isCluster) {
        this.updateServerTime();

        // start polling with interval
        this.intervalFunction = window.setInterval(function () {
          if (window.location.hash === '#nodes') {
            self.render(false);
          }
        }, this.interval);
      }
    },

    deleteNode: function (elem) {
      if ($(elem.currentTarget).hasClass('noHover')) {
        return;
      }
      var self = this;
      var name = $(elem.currentTarget.parentNode.parentNode).attr('node').slice(0, -5);
      if (window.confirm('Do you want to delete this node?')) {
        $.ajax({
          type: 'POST',
          url: arangoHelper.databaseUrl('/_admin/cluster/removeServer'),
          contentType: 'application/json',
          async: true,
          data: JSON.stringify(name),
          success: function (data) {
            self.render(false);
          },
          error: function () {
            if (window.location.hash === '#nodes') {
              arangoHelper.arangoError('Cluster', 'Could not fetch cluster information');
            }
          }
        });
      }
      return false;
    },

    navigateToNode: function (elem) {
      var name = $(elem.currentTarget).attr('node').slice(0, -5);

      if ($(elem.currentTarget).hasClass('noHover')) {
        return;
      }

      window.App.navigate('#node/' + encodeURIComponent(name), {trigger: true});
    },

    render: function (navi) {
      if (window.location.hash === '#nodes') {
        var self = this;

        if ($('#content').is(':empty')) {
          arangoHelper.renderEmpty('Please wait. Requesting cluster information...', 'fa fa-spin fa-circle-o-notch');
        }

        if (navi !== false) {
          arangoHelper.buildNodesSubNav('Overview');
        }

        var scalingFunc = function (nodes) {
          $.ajax({
            type: 'GET',
            url: arangoHelper.databaseUrl('/_admin/cluster/numberOfServers'),
            contentType: 'application/json',
            success: function (data) {
              if (window.location.hash === '#nodes') {
                self.continueRender(nodes, data);
              }
            }
          });
        };

        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/cluster/health'),
          contentType: 'application/json',
          processData: false,
          async: true,
          success: function (data) {
            if (window.location.hash === '#nodes') {
              scalingFunc(data.Health);
            }
          },
          error: function () {
            if (window.location.hash === '#nodes') {
              arangoHelper.arangoError('Cluster', 'Could not fetch cluster information');
            }
          }
        });
      }
    },

    continueRender: function (nodes, scaling) {
      var coords = {};
      var dbs = {};
      var scale = false;

      _.each(nodes, function (node, name) {
        if (node.Role === 'Coordinator') {
          coords[name] = node;
        } else if (node.Role === 'DBServer') {
          dbs[name] = node;
        }
      });

      if (scaling.numberOfDBServers !== null && scaling.numberOfCoordinators !== null) {
        scale = true;
      }

      var callback = function (scaleProperties) {
        this.$el.html(this.template.render({
          coords: coords,
          dbs: dbs,
          scaling: scale,
          scaleProperties: scaleProperties,
          plannedDBs: scaling.numberOfDBServers,
          plannedCoords: scaling.numberOfCoordinators
        }));

        if (!scale) {
          $('.title').css('position', 'relative');
          $('.title').css('top', '-4px');
          $('.sectionHeader .information').css('margin-top', '-3px');
        }
      }.bind(this);

      this.renderCounts(scale, callback);
    },

    updatePlanned: function (data) {
      if (data.numberOfCoordinators) {
        $('#plannedCoords').val(data.numberOfCoordinators);
        this.renderCounts(true);
      }
      if (data.numberOfDBServers) {
        $('#plannedDBs').val(data.numberOfDBServers);
        this.renderCounts(true);
      }
    },

    setCoordSize: function (number) {
      var self = this;
      var data = {
        numberOfCoordinators: number
      };

      $.ajax({
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_admin/cluster/numberOfServers'),
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function () {
          self.updatePlanned(data);
        },
        error: function () {
          arangoHelper.arangoError('Scale', 'Could not set coordinator size.');
        }
      });
    },

    setDBsSize: function (number) {
      var self = this;
      var data = {
        numberOfDBServers: number
      };

      $.ajax({
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_admin/cluster/numberOfServers'),
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function () {
          self.updatePlanned(data);
        },
        error: function () {
          arangoHelper.arangoError('Scale', 'Could not set coordinator size.');
        }
      });
    },

    abortClusterPlanModal: function () {
      var buttons = []; var tableContent = [];
      tableContent.push(
        window.modalView.createReadOnlyEntry(
          'plan-abort-button',
          'Caution',
          'You are aborting the planned cluster plan. All pending servers are going to be removed. Continue?',
          undefined,
          undefined,
          false,
          /[<>&'"]/
        )
      );
      buttons.push(
        window.modalView.createSuccessButton('Yes', this.abortClusterPlan.bind(this))
      );
      window.modalView.show('modalTable.ejs', 'Modify Cluster Size', buttons, tableContent);
    },

    abortClusterPlan: function () {
      window.modalView.hide();
      try {
        var coords = JSON.parse($('#infoCoords > .positive > span').text());
        var dbs = JSON.parse($('#infoDBs > .positive > span').text());
        this.setCoordSize(coords);
        this.setDBsSize(dbs);
      } catch (ignore) {
        arangoHelper.arangoError('Plan', 'Could not abort Cluster Plan');
      }
    },

    renderCounts: function (scale, callback) {
      var self = this;
      var renderFunc = function (id, ok, pending, error) {
        var string = '<span class="positive"><span>' + ok + '</span><i class="fa fa-check-circle"></i></span>';
        if (pending && scale === true) {
          string = string + '<span class="warning"><span>' + pending +
            '</span><i class="fa fa-circle-o-notch fa-spin"></i></span><button class="abortClusterPlan button-navbar button-default">Abort</button>';
        }
        if (error) {
          string = string + '<span class="negative"><span>' + error + '</span><i class="fa fa-exclamation-circle"></i></span>';
        }
        $(id).html(string);

        if (!scale) {
          $('.title').css('position', 'relative');
          $('.title').css('top', '-4px');
        }
      };

      var callbackFunction = function (nodes) {
        var coordsErrors = 0;
        var coords = 0;
        var coordsPending = 0;
        var dbs = 0;
        var dbsErrors = 0;
        var dbsPending = 0;

        _.each(nodes, function (node) {
          if (node.Role === 'Coordinator') {
            if (node.Status === 'GOOD') {
              coords++;
            } else {
              coordsErrors++;
            }
          } else if (node.Role === 'DBServer') {
            if (node.Status === 'GOOD') {
              dbs++;
            } else {
              dbsErrors++;
            }
          }
        });

        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/cluster/numberOfServers'),
          contentType: 'application/json',
          processData: false,
          success: function (data) {
            coordsPending = Math.abs((coords + coordsErrors) - data.numberOfCoordinators);
            dbsPending = Math.abs((dbs + dbsErrors) - data.numberOfDBServers);

            if (callback) {
              callback({
                coordsPending: coordsPending,
                coordsOk: coords,
                coordsErrors: coordsErrors,
                dbsPending: dbsPending,
                dbsOk: dbs,
                dbsErrors: dbsErrors
              });
            } else {
              renderFunc('#infoDBs', dbs, dbsPending, dbsErrors);
              renderFunc('#infoCoords', coords, coordsPending, coordsErrors);
            }

            if (!self.isPlanFinished()) {
              $('.scaleGroup').addClass('no-hover');
              $('#plannedCoords').attr('disabled', 'disabled');
              $('#plannedDBs').attr('disabled', 'disabled');
            }
          }
        });
      };

      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_admin/cluster/health'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          callbackFunction(data.Health);
        }
      });
    },

    isPlanFinished: function () {
      var boolean;

      if ($('#infoDBs').find('.warning').length > 0) {
        boolean = false;
      } else if ($('#infoCoords').find('.warning').length > 0) {
        boolean = false;
      } else {
        boolean = true;
      }

      return boolean;
    },

    addCoord: function () {
      var func = function () {
        window.modalView.hide();
        this.setCoordSize(this.readNumberFromID('#plannedCoords', true));
      };

      if (this.isPlanFinished()) {
        this.changePlanModal(func.bind(this));
      } else {
        arangoHelper.arangoNotification('Cluster Plan', 'Planned state not yet finished.');
        $('.noty_buttons .button-danger').remove();
      }
    },

    removeCoord: function () {
      var func = function () {
        window.modalView.hide();
        this.setCoordSize(this.readNumberFromID('#plannedCoords', false, true));
      };

      if (this.isPlanFinished()) {
        this.changePlanModal(func.bind(this));
      } else {
        arangoHelper.arangoNotification('Cluster Plan', 'Planned state not yet finished.');
        $('.noty_buttons .button-danger').remove();
      }
    },

    addDBs: function () {
      var func = function () {
        window.modalView.hide();
        this.setDBsSize(this.readNumberFromID('#plannedDBs', true));
      };

      if (this.isPlanFinished()) {
        this.changePlanModal(func.bind(this));
      } else {
        arangoHelper.arangoNotification('Cluster Plan', 'Planned state not yet finished.');
        $('.noty_buttons .button-danger').remove();
      }
    },

    removeDBs: function () {
      var func = function () {
        window.modalView.hide();
        this.setDBsSize(this.readNumberFromID('#plannedDBs', false, true));
      };

      if (this.isPlanFinished()) {
        this.changePlanModal(func.bind(this));
      } else {
        arangoHelper.arangoNotification('Cluster Plan', 'Planned state not yet finished.');
        $('.noty_buttons .button-danger').remove();
      }
    },

    readNumberFromID: function (id, increment, decrement) {
      var value = $(id).val();
      var parsed = false;

      try {
        parsed = JSON.parse(value);
      } catch (ignore) {}

      if (increment) {
        parsed++;
      }
      if (decrement) {
        if (parsed !== 1) {
          parsed--;
        }
      }

      return parsed;
    },

    updateServerTime: function () {
      this.serverTime = new Date().getTime();
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, templateEngine, arangoHelper, $, window */
(function () {
  'use strict';

  window.NodeView = Backbone.View.extend({
    el: '#content',
    template: templateEngine.createTemplate('nodeView.ejs'),
    interval: 5000,
    dashboards: [],

    events: {
    },

    initialize: function (options) {
      if (window.App.isCluster) {
        this.coordinators = options.coordinators;
        this.dbServers = options.dbServers;
        this.coordname = options.coordname;
        this.updateServerTime();

        // start polling with interval
        /*
        window.setInterval(function () {
          if (window.location.hash.indexOf('#node/') === 0) {
          }
        }, this.interval);
       */
      }
    },

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    breadcrumb: function (name) {
      $('#subNavigationBar .breadcrumb').html('Node: ' + name);
    },

    render: function () {
      this.$el.html(this.template.render({coords: []}));

      var callback = function () {
        this.continueRender();
        this.breadcrumb(arangoHelper.getCoordinatorShortName(this.coordname));
        // window.arangoHelper.buildNodeSubNav(this.coordname, 'Dashboard', 'Logs')
        $(window).trigger('resize');
      }.bind(this);

      if (!this.initCoordDone) {
        this.waitForCoordinators();
      }

      if (!this.initDBDone) {
        this.waitForDBServers(callback);
      } else {
        this.coordname = window.location.hash.split('/')[1];
        this.coordinator = this.coordinators.findWhere({name: this.coordname});
        callback();
      }
    },

    continueRender: function () {
      var self = this;
      var dashboard;

      if (this.coordinator) {
        dashboard = this.coordinator.get('name');
        // coordinator
        this.dashboards[this.coordinator.get('name')] = new window.DashboardView({
          dygraphConfig: window.dygraphConfig,
          database: window.App.arangoDatabase,
          serverToShow: {
            raw: this.coordinator.get('address'),
            isDBServer: false,
            endpoint: this.coordinator.get('protocol') + '://' + this.coordinator.get('address'),
            target: this.coordinator.get('name')
          }
        });
      } else {
        // db server
        var attributes = this.dbServer.toJSON();
        dashboard = attributes.name;
        this.dashboards[attributes.name] = new window.DashboardView({
          dygraphConfig: null,
          database: window.App.arangoDatabase,
          serverToShow: {
            raw: attributes.address,
            isDBServer: true,
            endpoint: attributes.endpoint,
            id: attributes.id,
            name: attributes.name,
            status: attributes.status,
            target: attributes.id
          }
        });
      }
      this.dashboards[dashboard].render();
      window.setTimeout(function () {
        self.dashboards[dashboard].resize();
      }, 500);
    },

    waitForCoordinators: function (callback) {
      var self = this;

      window.setTimeout(function () {
        if (self.coordinators.length === 0) {
          self.waitForCoordinators(callback);
        } else {
          self.coordinator = self.coordinators.findWhere({name: self.coordname});
          self.initCoordDone = true;
          if (callback) {
            callback();
          }
        }
      }, 200);
    },

    waitForDBServers: function (callback) {
      var self = this;

      window.setTimeout(function () {
        if (self.dbServers[0].length === 0) {
          self.waitForDBServers(callback);
        } else {
          self.initDBDone = true;
          self.dbServer = self.dbServers[0];

          self.dbServer.each(function (model) {
            var id = model.get('id');
            if (id === window.location.hash.split('/')[1]) {
              self.dbServer = self.dbServer.findWhere({id: id});
            }
          });

          callback();
        }
      }, 200);
    },

    updateServerTime: function () {
      this.serverTime = new Date().getTime();
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global frontendConfig, Backbone, templateEngine, $, window, noty, arangoHelper */
(function () {
  'use strict';

  window.NotificationView = Backbone.View.extend({
    events: {
      'click .navlogo #stat_hd': 'toggleNotification',
      'click .notificationItem .fa': 'removeNotification',
      'click #removeAllNotifications': 'removeAllNotifications'
    },

    initialize: function () {
      this.collection.bind('add', this.renderNotifications.bind(this));
      this.collection.bind('remove', this.renderNotifications.bind(this));
      this.collection.bind('reset', this.renderNotifications.bind(this));

      window.setTimeout(function () {
        if (frontendConfig.authenticationEnabled === false && frontendConfig.isCluster === false && arangoHelper.showAuthDialog() === true) {
          window.arangoHelper.arangoWarning(
            'Warning', 'Authentication is disabled. Do not use this setup in production mode.'
          );
        }
      }, 2000);
    },

    notificationItem: templateEngine.createTemplate('notificationItem.ejs'),

    el: '#notificationBar',

    template: templateEngine.createTemplate('notificationView.ejs'),

    toggleNotification: function () {
      var counter = this.collection.length;
      if (counter !== 0) {
        $('#notification_menu').toggle();
      }
    },

    removeAllNotifications: function () {
      $.noty.clearQueue();
      $.noty.closeAll();
      this.collection.reset();
      $('#notification_menu').hide();
    },

    removeNotification: function (e) {
      var cid = e.target.id;
      this.collection.get(cid).destroy();
    },

    renderNotifications: function (a, b, event) {
      if (event) {
        if (event.add) {
          var latestModel = this.collection.at(this.collection.length - 1);
          var message = latestModel.get('title');
          var time = 5000;
          var closeWidth = ['click'];
          var buttons;

          if (latestModel.get('content')) {
            message = message + ': ' + latestModel.get('content');
          }

          if (latestModel.get('type') === 'error') {
            time = false;
            closeWidth = ['button'];
            buttons = [{
              addClass: 'button-danger',
              text: 'Close',
              onClick: function ($noty) {
                $noty.close();
              }
            }];
          } else if (latestModel.get('type') === 'warning') {
            time = 15000;
            buttons = [
              {
                addClass: 'button-warning',
                text: 'Close',
                onClick: function ($noty) {
                  $noty.close();
                }
              },
              {
                addClass: 'button-danger',
                text: "Don't show again.",
                onClick: function ($noty) {
                  $noty.close();
                  window.arangoHelper.doNotShowAgain();
                }
              }
            ];
          }

          $.noty.clearQueue();
          $.noty.closeAll();

          noty({
            theme: 'relax',
            text: message,
            template: '<div class="noty_message arango_message">' +
              '<div><i class="fa fa-close"></i></div><span class="noty_text arango_text"></span>' +
              '<div class="noty_close arango_close"></div></div>',
            maxVisible: 1,
            closeWith: ['click'],
            type: latestModel.get('type'),
            layout: 'bottom',
            timeout: time,
            buttons: buttons,
            animation: {
              open: {height: 'show'},
              close: {height: 'hide'},
              easing: 'swing',
              speed: 200,
              closeWith: closeWidth
            }
          });

          if (latestModel.get('type') === 'success') {
            latestModel.destroy();
            return;
          }
        }
      }

      $('#stat_hd_counter').text(this.collection.length);
      if (this.collection.length === 0) {
        $('#stat_hd').removeClass('fullNotification');
        $('#notification_menu').hide();
      } else {
        $('#stat_hd').addClass('fullNotification');
      }

      $('.innerDropdownInnerUL').html(this.notificationItem.render({
        notifications: this.collection
      }));
      $('.notificationInfoIcon').tooltip({
        position: {
          my: 'left top',
          at: 'right+55 top-1'
        }
      });
    },

    render: function () {
      $(this.el).html(this.template.render({
        notifications: this.collection
      }));

      this.renderNotifications();
      this.delegateEvents();

      return this.el;
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, window, setTimeout */
/* global templateEngine */

(function () {
  'use strict';

  window.ProgressView = Backbone.View.extend({
    template: templateEngine.createTemplate('progressBase.ejs'),

    el: '#progressPlaceholder',

    el2: '#progressPlaceholderIcon',

    toShow: false,
    lastDelay: 0,

    action: function () {},

    events: {
      'click .progress-action button': 'performAction'
    },

    performAction: function () {
      if (typeof this.action === 'function') {
        this.action();
      }
      window.progressView.hide();
    },

    initialize: function () {},

    showWithDelay: function (delay, msg, action, button) {
      var self = this;
      self.toShow = true;
      self.lastDelay = delay;

      setTimeout(function () {
        if (self.toShow === true) {
          self.show(msg, action, button);
        }
      }, self.lastDelay);
    },

    show: function (msg, callback, buttonText) {
      $(this.el).html(this.template.render({}));
      $('.progress-text').text(msg);

      if (!buttonText) {
        $('.progress-action').html('<button class="button-danger">Cancel</button>');
      } else {
        $('.progress-action').html('<button class="button-danger">' + buttonText + '</button>');
      }

      if (!callback) {
        this.action = this.hide();
      } else {
        this.action = callback;
      }
      // $(".progress-action").html(button)
      // this.action = action

      $(this.el).show();
    // $(this.el2).html('<i class="fa fa-spinner fa-spin"></i>')
    },

    hide: function () {
      var self = this;
      self.toShow = false;

      $(this.el).hide();

      this.action = function () {};
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, setTimeout, window, arangoHelper, templateEngine */

(function () {
  'use strict';
  window.QueryManagementView = Backbone.View.extend({
    el: '#content',

    id: '#queryManagementContent',

    templateActive: templateEngine.createTemplate('queryManagementViewActive.ejs'),
    templateSlow: templateEngine.createTemplate('queryManagementViewSlow.ejs'),
    table: templateEngine.createTemplate('arangoTable.ejs'),
    active: true,
    shouldRender: true,
    timer: 0,
    refreshRate: 2000,

    initialize: function () {
      var self = this;
      this.activeCollection = new window.QueryManagementActive();
      this.slowCollection = new window.QueryManagementSlow();
      this.convertModelToJSON(true);

      window.setInterval(function () {
        if (window.location.hash === '#queries' && window.VISIBLE && self.shouldRender &&
          arangoHelper.getCurrentSub().route === 'queryManagement') {
          if (self.active) {
            if ($('#arangoQueryManagementTable').is(':visible')) {
              self.convertModelToJSON(true);
            }
          } else {
            if ($('#arangoQueryManagementTable').is(':visible')) {
              self.convertModelToJSON(false);
            }
          }
        }
      }, self.refreshRate);
    },

    events: {
      'click #deleteSlowQueryHistory': 'deleteSlowQueryHistoryModal',
      'click #arangoQueryManagementTable .fa-minus-circle': 'deleteRunningQueryModal'
    },

    tableDescription: {
      id: 'arangoQueryManagementTable',
      titles: ['ID', 'Query String', 'Runtime', 'Started', ''],
      rows: [],
      unescaped: [false, false, false, false, true]
    },

    deleteRunningQueryModal: function (e) {
      this.killQueryId = $(e.currentTarget).attr('data-id');
      var buttons = [];
      var tableContent = [];

      tableContent.push(
        window.modalView.createReadOnlyEntry(
          undefined,
          'Running Query',
          'Do you want to kill the running query?',
          undefined,
          undefined,
          false,
          undefined
        )
      );

      buttons.push(
        window.modalView.createDeleteButton('Kill', this.killRunningQuery.bind(this))
      );

      window.modalView.show(
        'modalTable.ejs',
        'Kill Running Query',
        buttons,
        tableContent
      );

      $('.modal-delete-confirmation strong').html('Really kill?');
    },

    killRunningQuery: function () {
      this.collection.killRunningQuery(this.killQueryId, this.killRunningQueryCallback.bind(this));
      window.modalView.hide();
    },

    killRunningQueryCallback: function () {
      this.convertModelToJSON(true);
      this.renderActive();
    },

    deleteSlowQueryHistoryModal: function () {
      var buttons = [];
      var tableContent = [];

      tableContent.push(
        window.modalView.createReadOnlyEntry(
          undefined,
          'Slow Query Log',
          'Do you want to delete the slow query log entries?',
          undefined,
          undefined,
          false,
          undefined
        )
      );

      buttons.push(
        window.modalView.createDeleteButton('Delete', this.deleteSlowQueryHistory.bind(this))
      );

      window.modalView.show(
        'modalTable.ejs',
        'Delete Slow Query Log',
        buttons,
        tableContent
      );
    },

    deleteSlowQueryHistory: function () {
      this.collection.deleteSlowQueryHistory(this.slowQueryCallback.bind(this));
      window.modalView.hide();
    },

    slowQueryCallback: function () {
      this.convertModelToJSON(false);
      this.renderSlow();
    },

    render: function () {
      var options = arangoHelper.getCurrentSub();
      if (options.params.active) {
        this.active = true;
        this.convertModelToJSON(true);
      } else {
        this.active = false;
        this.convertModelToJSON(false);
      }
    },

    addEvents: function () {
      var self = this;
      $('#queryManagementContent tbody').on('mousedown', function () {
        clearTimeout(self.timer);
        self.shouldRender = false;
      });
      $('#queryManagementContent tbody').on('mouseup', function () {
        self.timer = window.setTimeout(function () {
          self.shouldRender = true;
        }, 3000);
      });
    },

    renderActive: function () {
      this.$el.html(this.templateActive.render({}));
      $(this.id).append(this.table.render({content: this.tableDescription}));
      $('#activequeries').addClass('arango-active-tab');
      this.addEvents();
    },

    renderSlow: function () {
      this.$el.html(this.templateSlow.render({}));
      $(this.id).append(this.table.render({
        content: this.tableDescription
      }));
      $('#slowqueries').addClass('arango-active-tab');
      this.addEvents();
    },

    convertModelToJSON: function (active) {
      var self = this;
      var rowsArray = [];

      if (active === true) {
        this.collection = this.activeCollection;
      } else {
        this.collection = this.slowCollection;
      }

      this.collection.fetch({
        success: function () {
          self.collection.each(function (model) {
            var button = '';
            if (active) {
              button = '<i data-id="' + model.get('id') + '" class="fa fa-minus-circle"></i>';
            }
            rowsArray.push([
              model.get('id'),
              model.get('query'),
              model.get('runTime').toFixed(2) + ' s',
              model.get('started'),
              button
            ]);
          });

          var message = 'No running queries.';
          if (!active) {
            message = 'No slow queries.';
          }

          if (rowsArray.length === 0) {
            rowsArray.push([
              message,
              '',
              '',
              '',
              ''
            ]);
          }

          self.tableDescription.rows = rowsArray;

          if (active) {
            self.renderActive();
          } else {
            self.renderSlow();
          }
        }
      });
    }

  });
}());

/* jshint browser: true */

/* jshint unused: false */
/* global Backbone, $, setTimeout, localStorage, ace, Storage, window, _, console, btoa */
/* global _, arangoHelper, numeral, templateEngine, Joi */

(function () {
  'use strict';
  window.QueryView = Backbone.View.extend({
    el: '#content',
    bindParamId: '#bindParamEditor',
    myQueriesId: '#queryTable',
    template: templateEngine.createTemplate('queryView.ejs'),
    table: templateEngine.createTemplate('arangoTable.ejs'),

    outputDiv: '#outputEditors',
    outputTemplate: templateEngine.createTemplate('queryViewOutput.ejs'),
    outputCounter: 0,

    allowUpload: false,
    renderComplete: false,

    customQueries: [],
    cachedQueries: {},
    queriesHistory: {},
    graphViewers: [],
    queries: [],

    state: {
      lastQuery: {
        query: undefined,
        bindParam: undefined
      }
    },

    graphs: [],

    settings: {
      aqlWidth: undefined
    },

    currentQuery: {},
    initDone: false,

    bindParamRegExp: /@(@?\w+\d*)/,
    bindParamTableObj: {},
    bindParamMode: 'table',

    bindParamTableDesc: {
      id: 'arangoBindParamTable',
      titles: ['Key', 'Value'],
      rows: []
    },

    myQueriesTableDesc: {
      id: 'arangoMyQueriesTable',
      titles: ['Name', 'Actions'],
      rows: []
    },

    execPending: false,

    aqlEditor: null,
    queryPreview: null,

    initialize: function () {
      this.refreshAQL();
    },

    allowParamToggle: true,

    events: {
      'click #executeQuery': 'executeQuery',
      'click #explainQuery': 'explainQuery',
      'click #clearQuery': 'clearQuery',
      'click .outputEditorWrapper #downloadQueryResult': 'downloadQueryResult',
      'click .outputEditorWrapper #downloadCsvResult': 'downloadCsvResult',
      'click .outputEditorWrapper .switchAce span': 'switchAce',
      'click .outputEditorWrapper .closeResult': 'closeResult',
      'click #toggleQueries1': 'toggleQueries',
      'click #toggleQueries2': 'toggleQueries',
      'click #createNewQuery': 'createAQL',
      'click #saveCurrentQuery': 'addAQL',
      'click #updateCurrentQuery': 'updateAQL',
      'click #exportQuery': 'exportCustomQueries',
      'click #importQuery': 'openImportDialog',
      'click #removeResults': 'removeResults',
      'click #querySpotlight': 'showSpotlight',
      'click #deleteQuery': 'selectAndDeleteQueryFromTable',
      'click #explQuery': 'selectAndExplainQueryFromTable',
      'click .closeProfile': 'closeProfile',
      'keydown #arangoBindParamTable input': 'updateBindParams',
      'change #arangoBindParamTable input': 'updateBindParams',
      'click #arangoMyQueriesTable tbody tr': 'showQueryPreview',
      'dblclick #arangoMyQueriesTable tbody tr': 'selectQueryFromTable',
      'click #arangoMyQueriesTable #copyQuery': 'selectQueryFromTable',
      'click #closeQueryModal': 'closeExportDialog',
      'click #confirmQueryImport': 'importCustomQueries',
      'click #switchTypes': 'toggleBindParams',
      'click #arangoMyQueriesTable #runQuery': 'selectAndRunQueryFromTable'
    },

    clearQuery: function () {
      this.aqlEditor.setValue('', 1);
    },

    closeProfile: function (e) {
      var count = $(e.currentTarget).parent().attr('counter');

      _.each($('.queryProfile'), function (elem) {
        if ($(elem).attr('counter') === count) {
          $(elem).fadeOut('fast').remove();
        }
      });
    },

    toggleBindParams: function () {
      if (this.allowParamToggle) {
        $('#bindParamEditor').toggle();
        $('#bindParamAceEditor').toggle();

        if ($('#switchTypes').text() === 'JSON') {
          this.bindParamMode = 'json';
          $('#switchTypes').text('Table');
          this.updateQueryTable();
          this.bindParamAceEditor.setValue(JSON.stringify(this.bindParamTableObj, null, '\t'), 1);
          this.deselect(this.bindParamAceEditor);
        } else {
          this.bindParamMode = 'table';
          $('#switchTypes').text('JSON');
          this.renderBindParamTable();
        }
      } else {
        arangoHelper.arangoError('Bind parameter', 'Could not parse bind parameter');
      }
      this.resize();
    },

    openExportDialog: function () {
      $('#queryImportDialog').modal('show');
    },

    closeExportDialog: function () {
      $('#queryImportDialog').modal('hide');
    },

    initQueryImport: function () {
      var self = this;
      self.allowUpload = false;
      $('#importQueries').change(function (e) {
        self.files = e.target.files || e.dataTransfer.files;
        self.file = self.files[0];

        self.allowUpload = true;
        $('#confirmQueryImport').removeClass('disabled');
      });
    },

    importCustomQueries: function () {
      var self = this;
      if (this.allowUpload === true) {
        var callback = function () {
          this.collection.fetch({
            success: function () {
              self.updateLocalQueries();
              self.updateQueryTable();
              self.resize();
              self.allowUpload = false;
              $('#confirmQueryImport').addClass('disabled');
              $('#queryImportDialog').modal('hide');
            },
            error: function (data) {
              arangoHelper.arangoError('Custom Queries', data.responseText);
            }
          });
        }.bind(this);

        self.collection.saveImportQueries(self.file, callback.bind(this));
      }
    },

    removeResults: function () {
      var self = this;
      this.cachedQueries = {};
      this.queriesHistory = {};

      _.each($('.outputEditorWrapper'), function (v) {
        self.closeAceResults(v.id.replace(/^\D+/g, ''));
      });
    },

    getCustomQueryParameterByName: function (qName) {
      return this.collection.findWhere({name: qName}).get('parameter');
    },

    getCustomQueryValueByName: function (qName) {
      var obj;

      if (qName) {
        obj = this.collection.findWhere({name: qName});
      }
      if (obj) {
        obj = obj.get('value');
      } else {
        _.each(this.queries, function (query) {
          if (query.name === qName) {
            obj = query.value;
          }
        });
      }
      return obj;
    },

    openImportDialog: function () {
      $('#queryImportDialog').modal('show');
    },

    closeImportDialog: function () {
      $('#queryImportDialog').modal('hide');
    },

    exportCustomQueries: function () {
      var name;

      $.ajax('whoAmI?_=' + Date.now()).success(function (data) {
        name = data.user;

        if (name === null || name === false) {
          name = 'root';
        }
        var url = 'query/download/' + encodeURIComponent(name);
        arangoHelper.download(url);
      });
    },

    toggleQueries: function (e) {
      if (e) {
        if (e.currentTarget.id === 'toggleQueries1') {
          this.updateQueryTable();
          $('#bindParamAceEditor').hide();
          $('#bindParamEditor').show();
          $('#switchTypes').text('JSON');
          $('.aqlEditorWrapper').first().width($(window).width() * 0.33);
          this.queryPreview.setValue('No query selected.', 1);
          this.deselect(this.queryPreview);
        } else {
          $('#updateCurrentQuery').hide();
          if (this.settings.aqlWidth === undefined) {
            $('.aqlEditorWrapper').first().width($(window).width() * 0.33);
          } else {
            $('.aqlEditorWrapper').first().width(this.settings.aqlWidth);
          }

          if (localStorage.getItem('lastOpenQuery') !== 'undefined') {
            $('#updateCurrentQuery').show();
          }
        }
      } else {
        if (this.settings.aqlWidth === undefined) {
          $('.aqlEditorWrapper').first().width($(window).width() * 0.33);
        } else {
          $('.aqlEditorWrapper').first().width(this.settings.aqlWidth);
        }
      }
      this.resize();

      var divs = [
        'aqlEditor', 'queryTable', 'previewWrapper', 'querySpotlight',
        'bindParamEditor', 'toggleQueries1', 'toggleQueries2', 'createNewQuery',
        'saveCurrentQuery', 'querySize', 'executeQuery', 'switchTypes',
        'explainQuery', 'importQuery', 'exportQuery'
      ];
      _.each(divs, function (div) {
        $('#' + div).toggle();
      });
      this.resize();
    },

    showQueryPreview: function (e) {
      $('#arangoMyQueriesTable tr').removeClass('selected');
      $(e.currentTarget).addClass('selected');

      var name = this.getQueryNameFromTable(e);
      this.queryPreview.setValue(this.getCustomQueryValueByName(name), 1);
      this.deselect(this.queryPreview);
    },

    getQueryNameFromTable: function (e) {
      var name;
      if ($(e.currentTarget).is('tr')) {
        name = $(e.currentTarget).children().first().text();
      } else if ($(e.currentTarget).is('span')) {
        name = $(e.currentTarget).parent().parent().prev().text();
      }
      return name;
    },

    deleteQueryModal: function (name) {
      var buttons = [];
      var tableContent = [];
      tableContent.push(
        window.modalView.createReadOnlyEntry(
          undefined,
          name,
          'Do you want to delete the query?',
          undefined,
          undefined,
          false,
          undefined
        )
      );
      buttons.push(
        window.modalView.createDeleteButton('Delete', this.deleteAQL.bind(this, name))
      );
      window.modalView.show(
        'modalTable.ejs', 'Delete Query', buttons, tableContent
      );
    },

    selectAndDeleteQueryFromTable: function (e) {
      var name = this.getQueryNameFromTable(e);
      this.deleteQueryModal(name);
    },

    selectAndExplainQueryFromTable: function (e) {
      this.selectQueryFromTable(e, false);
      this.explainQuery();
    },

    selectAndRunQueryFromTable: function (e) {
      this.selectQueryFromTable(e, false);
      this.executeQuery();
    },

    selectQueryFromTable: function (e, toggle) {
      var name = this.getQueryNameFromTable(e);
      var self = this;

      if (toggle === undefined) {
        this.toggleQueries();
      }

      var lastQueryName = localStorage.getItem('lastOpenQuery');
      // backup the last query
      this.state.lastQuery.query = this.aqlEditor.getValue();
      this.state.lastQuery.bindParam = this.bindParamTableObj;

      this.aqlEditor.setValue(this.getCustomQueryValueByName(name), 1);
      this.fillBindParamTable(this.getCustomQueryParameterByName(name));
      this.updateBindParams();

      this.currentQuery = this.collection.findWhere({name: name});

      if (this.currentQuery) {
        localStorage.setItem('lastOpenQuery', this.currentQuery.get('name'));
      }

      $('#updateCurrentQuery').show();

      // render a button to revert back to last query
      $('#lastQuery').remove();

      if (lastQueryName !== name) {
        $('#queryContent .arangoToolbarTop .pull-left')
          .append('<span id="lastQuery" class="clickable">Previous Query</span>');

        this.breadcrumb(name);
      }

      $('#lastQuery').hide().fadeIn(500)
        .on('click', function () {
          $('#updateCurrentQuery').hide();
          self.aqlEditor.setValue(self.state.lastQuery.query, 1);
          self.fillBindParamTable(self.state.lastQuery.bindParam);
          self.updateBindParams();

          self.collection.each(function (model) {
            model = model.toJSON();

            if (model.value === self.state.lastQuery.query) {
              self.breadcrumb(model.name);
            } else {
              self.breadcrumb();
            }
          });

          $('#lastQuery').fadeOut(500, function () {
            $(this).remove();
          });
        }
      );
    },

    deleteAQL: function (name) {
      var callbackRemove = function (error) {
        if (error) {
          arangoHelper.arangoError('Query', 'Could not delete query.');
        } else {
          this.updateLocalQueries();
          this.updateQueryTable();
          this.resize();
          window.modalView.hide();
        }
      }.bind(this);

      var toDelete = this.collection.findWhere({name: name});

      this.collection.remove(toDelete);
      this.collection.saveCollectionQueries(callbackRemove);
    },

    switchAce: function (e) {
      // check if button is disabled
      var count = $(e.currentTarget).attr('counter');
      var elem = e.currentTarget;

      if ($(elem).hasClass('disabled')) {
        return;
      }

      _.each($(elem).parent().children(), function (child) {
        $(child).removeClass('active');
      });

      var string = $(elem).attr('val');
      $(elem).addClass('active');
      $(elem).text(string.charAt(0).toUpperCase() + string.slice(1));

      // refactor this
      if (string === 'JSON') {
        $('#outputEditor' + count).show();

        $('#outputGraph' + count).hide();
        $('#outputTable' + count).hide();
      } else if (string === 'Table') {
        $('#outputTable' + count).show();

        $('#outputGraph' + count).hide();
        $('#outputEditor' + count).hide();
      } else if (string === 'Graph') {
        $('#outputGraph' + count).show();

        $('#outputTable' + count).hide();
        $('#outputEditor' + count).hide();
      }

      // deselect editors
      this.deselect(ace.edit('outputEditor' + count));
    },

    downloadQueryResult: function (e) {
      var counter = $(e.currentTarget).attr('counter');
      var query = this.queriesHistory[counter].sentQuery;

      if (query !== '' && query !== undefined && query !== null) {
        var url;
        if (Object.keys(this.queriesHistory[counter].bindParam).length === 0) {
          url = 'query/result/download/' + encodeURIComponent(btoa(JSON.stringify({
            query: query
          })));
        } else {
          url = 'query/result/download/' + encodeURIComponent(btoa(JSON.stringify({
            query: query,
            bindVars: this.queriesHistory[counter].bindParam
          })));
        }
        arangoHelper.download(url);
      } else {
        arangoHelper.arangoError('Query error', 'Could not download the result.');
      }
    },

    downloadCsvResult: function (e) {
      var counter = $(e.currentTarget).attr('counter');
      var array = [];

      var newRow = [];
      _.each($('#outputEditorWrapper' + counter + ' .arango-table tr'), function (row) {
        _.each($(row).children(), function (elem) {
          try {
            newRow.push(JSON.parse($(elem).html()));
          } catch (ignore) {
            newRow.push($(elem).html());
          }
        });

        array.push(newRow);
        newRow = [];
      });

      if (array.length > 0) {
        var url = 'query/result/csv/' + encodeURIComponent(btoa(JSON.stringify({array: array})));
        arangoHelper.download(url);
      } else {
        arangoHelper.arangoError('Query error', 'Could not download the result.');
      }
    },

    explainQuery: function () {
      if (this.verifyQueryAndParams()) {
        return;
      }

      this.lastSentQueryString = this.aqlEditor.getValue();

      this.$(this.outputDiv).prepend(this.outputTemplate.render({
        counter: this.outputCounter,
        type: 'Explain'
      }));

      var counter = this.outputCounter;
      var outputEditor = ace.edit('outputEditor' + counter);

      outputEditor.setReadOnly(true);
      outputEditor.getSession().setMode('ace/mode/json');
      outputEditor.setOption('vScrollBarAlwaysVisible', true);
      this.setEditorAutoHeight(outputEditor);

      // Store sent query and bindParameter
      this.queriesHistory[counter] = {
        sentQuery: this.aqlEditor.getValue(),
        bindParam: this.bindParamTableObj
      };

      this.fillExplain(outputEditor, counter);
      this.outputCounter++;
    },

    fillExplain: function (outputEditor, counter) {
      var self = this;
      var queryData = this.readQueryData();

      if (queryData === 'false') {
        return;
      }

      $('#outputEditorWrapper' + counter + ' .queryExecutionTime').text('');
      this.execPending = false;

      if (queryData) {
        var afterResult = function () {
          $('#outputEditorWrapper' + counter + ' #spinner').remove();
          $('#outputEditor' + counter).css('opacity', '1');
          $('#outputEditorWrapper' + counter + ' .fa-close').show();
          $('#outputEditorWrapper' + counter + ' .switchAce').show();
        };

        $.ajax({
          type: 'POST',
          url: arangoHelper.databaseUrl('/_admin/aardvark/query/explain/'),
          data: queryData,
          contentType: 'application/json',
          processData: false,
          success: function (data) {
            if (data.msg.includes('errorMessage')) {
              self.removeOutputEditor(counter);
              arangoHelper.arangoError('Explain', data.msg);
            } else {
              // cache explain results
              self.cachedQueries[counter] = data;

              outputEditor.setValue(data.msg, 1);
              self.deselect(outputEditor);
              $.noty.clearQueue();
              $.noty.closeAll();
              self.handleResult(counter);

              // SCROLL TO RESULT BOX
              $('.centralRow').animate({ scrollTop: $('#queryContent').height() }, 'fast');
            }
            afterResult();
          },
          error: function (data) {
            try {
              var temp = JSON.parse(data.responseText);
              arangoHelper.arangoError('Explain', temp.errorMessage);
            } catch (e) {
              arangoHelper.arangoError('Explain', 'ERROR');
            }
            self.handleResult(counter);
            self.removeOutputEditor(counter);
            afterResult();
          }
        });
      }
    },

    removeOutputEditor: function (counter) {
      $('#outputEditorWrapper' + counter).hide();
      $('#outputEditorWrapper' + counter).remove();
      if ($('.outputEditorWrapper').length === 0) {
        $('#removeResults').hide();
      }
    },

    getCachedQueryAfterRender: function () {
      if (this.renderComplete === false) {
        // get cached query if available
        var queryObject = this.getCachedQuery();
        var self = this;

        if (queryObject !== null && queryObject !== undefined && queryObject !== '') {
          this.aqlEditor.setValue(queryObject.query, 1);

          var queryName = localStorage.getItem('lastOpenQuery');

          if (queryName !== undefined && queryName !== 'undefined') {
            try {
              var query = this.collection.findWhere({name: queryName}).toJSON();
              if (query.value === queryObject.query) {
                self.breadcrumb(queryName);
                $('#updateCurrentQuery').show();
              }
            } catch (ignore) {
            }
          }

          // reset undo history for initial text value
          this.aqlEditor.getSession().setUndoManager(new ace.UndoManager());

          if (queryObject.parameter !== '' || queryObject !== undefined) {
            try {
              // then fill values into input boxes
              self.bindParamTableObj = JSON.parse(queryObject.parameter);

              var key;
              _.each($('#arangoBindParamTable input'), function (element) {
                key = $(element).attr('name');
                if (typeof self.bindParamTableObj[key] === 'object') {
                  $(element).val(JSON.parse(self.bindParamTableObj[key]));
                } else {
                  $(element).val(self.bindParamTableObj[key]);
                }
              });

              // resave cached query
              self.setCachedQuery(self.aqlEditor.getValue(), JSON.stringify(self.bindParamTableObj));
            } catch (ignore) {}
          }
        }
        this.renderComplete = true;
      }
    },

    getCachedQuery: function () {
      if (Storage !== 'undefined') {
        var cache = localStorage.getItem('cachedQuery');
        if (cache !== undefined) {
          var query = JSON.parse(cache);
          this.currentQuery = query;
          try {
            this.bindParamTableObj = JSON.parse(query.parameter);
          } catch (ignore) {}
          return query;
        }
      }
    },

    setCachedQuery: function (query, vars) {
      if (query !== '') {
        if (Storage !== 'undefined') {
          var myObject = {
            query: query,
            parameter: vars
          };
          this.currentQuery = myObject;
          localStorage.setItem('cachedQuery', JSON.stringify(myObject));
        }
      }
    },

    closeAceResults: function (counter, target) {
      var self = this;
      ace.edit('outputEditor' + counter).destroy();
      $('#outputEditorWrapper' + this.outputCounter).hide();

      var cleanup = function (target) {
        $(target).hide('fast', function () {
          // remove dom
          $(target).remove();
          if ($('.outputEditorWrapper').length === 0) {
            self.cachedQueries = {};
            $('#removeResults').hide();
          }
        });
      };

      if (target) {
        cleanup(target);
      } else {
        _.each($('#outputEditors').children(), function (elem) {
          cleanup(elem);
        });
      }
    },

    closeResult: function (e) {
      var self = this;
      var target = $('#' + $(e.currentTarget).attr('element')).parent();
      var id = $(target).attr('id');
      var counter = id.replace(/^\D+/g, '');

      // remove unused ace editor instances
      self.closeAceResults(counter, target);

      delete this.cachedQueries[counter];
      delete this.queriesHistory[counter];
    },

    fillSelectBoxes: function () {
      // fill select box with # of results
      var querySize = 1000;
      var sizeBox = $('#querySize');
      sizeBox.empty();

      [ 100, 250, 500, 1000, 2500, 5000, 10000, 'all' ].forEach(function (value) {
        sizeBox.append('<option value="' + _.escape(value) + '"' +
          (querySize === value ? ' selected' : '') +
          '>' + _.escape(value) + ' results</option>');
      });
    },

    render: function () {
      this.refreshAQL();
      this.renderComplete = false;
      this.$el.html(this.template.render({}));

      this.afterRender();

      if (!this.initDone) {
        // init aql editor width
        this.settings.aqlWidth = $('.aqlEditorWrapper').width();
      }

      if (this.bindParamMode === 'json') {
        this.toggleBindParams();
      }

      this.initDone = true;
      this.renderBindParamTable(true);
      this.restoreCachedQueries();
      this.delegateEvents();
    },

    cleanupGraphs: function () {
      if (this.graphViewers !== undefined || this.graphViewers !== null) {
        _.each(this.graphViewers, function (graphView) {
          if (graphView !== undefined) {
            graphView.killCurrentGraph();
            graphView.remove();
          }
        });
        $('canvas').remove();

        this.graphViewers = null;
        this.graphViewers = [];
      }
    },

    afterRender: function () {
      var self = this;
      this.initAce();
      this.initTables();
      this.fillSelectBoxes();
      this.makeResizeable();
      this.initQueryImport();

      // set height of editor wrapper
      $('.inputEditorWrapper').height($(window).height() / 10 * 5 + 25);
      window.setTimeout(function () {
        self.resize();
      }, 10);
      self.deselect(self.aqlEditor);
    },

    restoreCachedQueries: function () {
      var self = this;

      if (Object.keys(this.cachedQueries).length > 0) {
        _.each(this.cachedQueries, function (query, counter) {
          self.renderQueryResultBox(counter, null, true);
          self.renderQueryResult(query, counter, true);

          if (query.sentQuery) {
            self.bindQueryResultButtons(null, counter);
          }
        });
        $('#removeResults').show();
      }
    },

    showSpotlight: function (type) {
      var callback, cancelCallback;

      if (type === undefined || type.type === 'click') {
        type = 'aql';
      }

      if (type === 'aql') {
        callback = function (string) {
          this.aqlEditor.insert(string);
          $('#aqlEditor .ace_text-input').focus();
        }.bind(this);

        cancelCallback = function () {
          $('#aqlEditor .ace_text-input').focus();
        };
      } else {
        var focused = $(':focus');
        callback = function (string) {
          var old = $(focused).val();
          $(focused).val(old + string);
          $(focused).focus();
        };

        cancelCallback = function () {
          $(focused).focus();
        };
      }

      window.spotlightView.show(callback, cancelCallback, type);
    },

    resize: function () {
      this.resizeFunction();
    },

    resizeFunction: function () {
      if ($('#toggleQueries1').is(':visible')) {
        this.aqlEditor.resize();
        $('#arangoBindParamTable thead').css('width', $('#bindParamEditor').width());
        $('#arangoBindParamTable thead th').css('width', $('#bindParamEditor').width() / 2);
        $('#arangoBindParamTable tr').css('width', $('#bindParamEditor').width());
        $('#arangoBindParamTable tbody').css('height', $('#aqlEditor').height() - 35);
        $('#arangoBindParamTable tbody').css('width', $('#bindParamEditor').width());
        $('#arangoBindParamTable tbody tr').css('width', $('#bindParamEditor').width());
        $('#arangoBindParamTable tbody td').css('width', $('#bindParamEditor').width() / 2);
      } else {
        this.queryPreview.resize();
        $('#arangoMyQueriesTable thead').css('width', $('#queryTable').width());
        $('#arangoMyQueriesTable thead th').css('width', $('#queryTable').width() / 2);
        $('#arangoMyQueriesTable tr').css('width', $('#queryTable').width());
        $('#arangoMyQueriesTable tbody').css('height', $('#queryTable').height() - 35);
        $('#arangoMyQueriesTable tbody').css('width', $('#queryTable').width());
        $('#arangoMyQueriesTable tbody td').css('width', $('#queryTable').width() / 2);
      }
    },

    makeResizeable: function () {
      var self = this;

      $('.aqlEditorWrapper').resizable({
        resize: function () {
          self.resizeFunction();
          self.settings.aqlWidth = $('.aqlEditorWrapper').width();
        },
        handles: 'e'
      });

      $('.inputEditorWrapper').resizable({
        resize: function () {
          self.resizeFunction();
        },
        handles: 's'
      });

      // one manual start
      this.resizeFunction();
    },

    initTables: function () {
      this.$(this.bindParamId).html(this.table.render({content: this.bindParamTableDesc}));
      this.$(this.myQueriesId).html(this.table.render({content: this.myQueriesTableDesc}));
    },

    checkType: function (val) {
      var type = 'stringtype';

      try {
        val = JSON.parse(val);
        if (val instanceof Array) {
          type = 'arraytype';
        } else {
          type = typeof val + 'type';
        }
      } catch (ignore) {}

      return type;
    },

    updateBindParams: function (e) {
      var id;
      var self = this;

      if (e) {
        id = $(e.currentTarget).attr('name');
        // this.bindParamTableObj[id] = $(e.currentTarget).val()
        this.bindParamTableObj[id] = arangoHelper.parseInput(e.currentTarget);

        var types = [
          'arraytype', 'objecttype', 'booleantype', 'numbertype', 'stringtype'
        ];
        _.each(types, function (type) {
          $(e.currentTarget).removeClass(type);
        });
        $(e.currentTarget).addClass(self.checkType($(e.currentTarget).val()));
      } else {
        _.each($('#arangoBindParamTable input'), function (element) {
          id = $(element).attr('name');
          self.bindParamTableObj[id] = arangoHelper.parseInput(element);
        });
      }
      this.setCachedQuery(this.aqlEditor.getValue(), JSON.stringify(this.bindParamTableObj));

      // fire execute if return was pressed
      if (e) {
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 13) {
          e.preventDefault();
          this.executeQuery();
        }
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 32) {
          e.preventDefault();
          this.showSpotlight('bind');
        }
      }
    },

    parseQuery: function (query) {
      var STATE_NORMAL = 0;
      var STATE_STRING_SINGLE = 1;
      var STATE_STRING_DOUBLE = 2;
      var STATE_STRING_TICK = 3;
      var STATE_COMMENT_SINGLE = 4;
      var STATE_COMMENT_MULTI = 5;
      var STATE_BIND = 6;
      var STATE_STRING_BACKTICK = 7;

      query += ' ';
      var self = this;
      var start;
      var state = STATE_NORMAL;
      var n = query.length;
      var i, c;

      var bindParams = [];

      for (i = 0; i < n; ++i) {
        c = query.charAt(i);

        switch (state) {
          case STATE_NORMAL:
            if (c === '@') {
              state = STATE_BIND;
              start = i;
            } else if (c === "'") {
              state = STATE_STRING_SINGLE;
            } else if (c === '"') {
              state = STATE_STRING_DOUBLE;
            } else if (c === '`') {
              state = STATE_STRING_TICK;
            } else if (c === '´') {
              state = STATE_STRING_BACKTICK;
            } else if (c === '/') {
              if (i + 1 < n) {
                if (query.charAt(i + 1) === '/') {
                  state = STATE_COMMENT_SINGLE;
                  ++i;
                } else if (query.charAt(i + 1) === '*') {
                  state = STATE_COMMENT_MULTI;
                  ++i;
                }
              }
            }
            break;
          case STATE_COMMENT_SINGLE:
            if (c === '\r' || c === '\n') {
              state = STATE_NORMAL;
            }
            break;
          case STATE_COMMENT_MULTI:
            if (c === '*') {
              if (i + 1 <= n && query.charAt(i + 1) === '/') {
                state = STATE_NORMAL;
                ++i;
              }
            }
            break;
          case STATE_STRING_SINGLE:
            if (c === '\\') {
              ++i;
            } else if (c === "'") {
              state = STATE_NORMAL;
            }
            break;
          case STATE_STRING_DOUBLE:
            if (c === '\\') {
              ++i;
            } else if (c === '"') {
              state = STATE_NORMAL;
            }
            break;
          case STATE_STRING_TICK:
            if (c === '`') {
              state = STATE_NORMAL;
            }
            break;
          case STATE_STRING_BACKTICK:
            if (c === '´') {
              state = STATE_NORMAL;
            }
            break;
          case STATE_BIND:
            if (!/^[@a-zA-Z0-9_]+$/.test(c)) {
              bindParams.push(query.substring(start, i));
              state = STATE_NORMAL;
              start = undefined;
            }
            break;
        }
      }

      var match;
      _.each(bindParams, function (v, k) {
        match = v.match(self.bindParamRegExp);

        if (match) {
          bindParams[k] = match[1];
        }
      });

      return {
        query: query,
        bindParams: bindParams
      };
    },

    checkForNewBindParams: function () {
      var self = this;
      // Remove comments
      var foundBindParams = this.parseQuery(this.aqlEditor.getValue()).bindParams;

      var newObject = {};
      _.each(foundBindParams, function (word) {
        if (self.bindParamTableObj[word]) {
          newObject[word] = self.bindParamTableObj[word];
        } else {
          newObject[word] = '';
        }
      });

      Object.keys(foundBindParams).forEach(function (keyNew) {
        Object.keys(self.bindParamTableObj).forEach(function (keyOld) {
          if (keyNew === keyOld) {
            newObject[keyNew] = self.bindParamTableObj[keyOld];
          }
        });
      });
      self.bindParamTableObj = newObject;
    },

    renderBindParamTable: function (init) {
      $('#arangoBindParamTable tbody').html('');

      if (init) {
        this.getCachedQuery();
      }

      var counter = 0;

      _.each(this.bindParamTableObj, function (val, key) {
        $('#arangoBindParamTable tbody').append(
          '<tr>' +
          '<td>' + key + '</td>' +
          '<td><input name=' + key + ' type="text"></input></td>' +
          '</tr>'
        );
        counter++;
        _.each($('#arangoBindParamTable input'), function (element) {
          if ($(element).attr('name') === key) {
            if (val instanceof Array) {
              $(element).val(JSON.stringify(val)).addClass('arraytype');
            } else if (typeof val === 'object') {
              $(element).val(JSON.stringify(val)).addClass(typeof val + 'type');
            } else {
              $(element).val(val).addClass(typeof val + 'type');
            }
          }
        });
      });
      if (counter === 0) {
        $('#arangoBindParamTable tbody').append(
          '<tr class="noBgColor">' +
          '<td>No bind parameters defined.</td>' +
          '<td></td>' +
          '</tr>'
        );
      }

      // check if existing entry already has a stored value
      var queryName = localStorage.getItem('lastOpenQuery');
      var query = this.collection.findWhere({name: queryName});

      try {
        query = query.toJSON();
      } catch (ignore) {
      }

      if (query) {
        var attributeName;
        _.each($('#arangoBindParamTable input'), function (elem) {
          attributeName = $(elem).attr('name');
          _.each(query.parameter, function (qVal, qKey) {
            if (qKey === attributeName) {
              $(elem).val(qVal);
            }
          });
        });
      }
    },

    fillBindParamTable: function (object) {
      _.each(object, function (val, key) {
        _.each($('#arangoBindParamTable input'), function (element) {
          if ($(element).attr('name') === key) {
            $(element).val(val);
          }
        });
      });
    },

    initAce: function () {
      var self = this;

      // init aql editor
      this.aqlEditor = ace.edit('aqlEditor');
      this.aqlEditor.$blockScrolling = Infinity;
      this.aqlEditor.getSession().setMode('ace/mode/aql');
      this.aqlEditor.setFontSize('10pt');
      this.aqlEditor.setShowPrintMargin(false);

      this.bindParamAceEditor = ace.edit('bindParamAceEditor');
      this.bindParamAceEditor.$blockScrolling = Infinity;
      this.bindParamAceEditor.getSession().setMode('ace/mode/json');
      this.bindParamAceEditor.setFontSize('10pt');
      this.bindParamAceEditor.setShowPrintMargin(false);

      this.bindParamAceEditor.getSession().on('change', function () {
        try {
          self.bindParamTableObj = JSON.parse(self.bindParamAceEditor.getValue());
          self.allowParamToggle = true;
          self.setCachedQuery(self.aqlEditor.getValue(), JSON.stringify(self.bindParamTableObj));
        } catch (e) {
          if (self.bindParamAceEditor.getValue() === '') {
            _.each(self.bindParamTableObj, function (v, k) {
              self.bindParamTableObj[k] = '';
            });
            self.allowParamToggle = true;
          } else {
            self.allowParamToggle = false;
          }
        }
      });

      this.aqlEditor.getSession().on('change', function () {
        // case copy-paste: query completely selected & removed
        if (self.aqlEditor.getValue().length < 1) {
          if (Object.keys(self.bindParamTableObj).length > 0) {
            // query is empty but bindvars are defined
            self.lastCachedBindParameter = self.bindParamTableObj;
          }
        }

        self.checkForNewBindParams();
        self.renderBindParamTable();

        if (self.parseQuery(self.aqlEditor.getValue()).bindParams.length > 0) {
          var restoreAttr = [];
          _.each(self.parseQuery(self.aqlEditor.getValue()).bindParams, function (name) {
            if ($('input[name=\'' + name + '\']') !== undefined && $('input[name=\'' + name + '\']').length > 0) {
              if ($('input[name=\'' + name + '\']').val().length === 0) {
                if (self.lastCachedBindParameter) {
                  var value = $('input[name=\'' + name + '\']').val();
                  if (self.lastCachedBindParameter[name]) {
                    if (self.lastCachedBindParameter[name] !== value) {
                      restoreAttr.push(name);
                    }
                  }
                }
              }
            }
          });
          if (restoreAttr.length > 0) {
            // self.bindParamTableObj = self.lastCachedBindParameter;
            var toRestore = {};
            _.each(restoreAttr, function (name, val) {
              toRestore[name] = self.lastCachedBindParameter[name];
            });
            self.bindParamTableObj = toRestore;
            self.renderBindParamTable();
          }
        }

        if (self.initDone) {
          self.setCachedQuery(self.aqlEditor.getValue(), JSON.stringify(self.bindParamTableObj));
        }

        self.bindParamAceEditor.setValue(JSON.stringify(self.bindParamTableObj, null, '\t'), 1);
        $('#aqlEditor .ace_text-input').focus();

        self.resize();
      });

      var setOutputEditorFontSize = function (size) {
        _.each($('.outputEditors'), function (value) {
          var id = $(value).children().first().attr('id');
          id = id.replace('Wrapper', '');
          var outputEditor = ace.edit(id);
          outputEditor.setFontSize(size);
        });
      };

      var editors = [this.aqlEditor, this.bindParamAceEditor];
      _.each(editors, function (editor) {
        editor.commands.addCommand({
          name: 'togglecomment',
          bindKey: {win: 'Ctrl-Shift-C', linux: 'Ctrl-Shift-C', mac: 'Command-Shift-C'},
          exec: function (editor) {
            editor.toggleCommentLines();
          },
          multiSelectAction: 'forEach'
        });

        editor.commands.addCommand({
          name: 'increaseFontSize',
          bindKey: {win: 'Shift-Alt-Up', linux: 'Shift-Alt-Up', mac: 'Shift-Alt-Up'},
          exec: function (editor) {
            var newSize = parseInt(self.aqlEditor.getFontSize().match(/\d+/)[0], 10) + 1;
            newSize += 'pt';
            self.aqlEditor.setFontSize(newSize);
            setOutputEditorFontSize(newSize);
          },
          multiSelectAction: 'forEach'
        });

        editor.commands.addCommand({
          name: 'decreaseFontSize',
          bindKey: {win: 'Shift-Alt-Down', linux: 'Shift-Alt-Down', mac: 'Shift-Alt-Down'},
          exec: function (editor) {
            var newSize = parseInt(self.aqlEditor.getFontSize().match(/\d+/)[0], 10) - 1;
            newSize += 'pt';
            self.aqlEditor.setFontSize(newSize);
            setOutputEditorFontSize(newSize);
          },
          multiSelectAction: 'forEach'
        });

        editor.commands.addCommand({
          name: 'executeQuery',
          bindKey: {win: 'Ctrl-Return', mac: 'Command-Return', linux: 'Ctrl-Return'},
          exec: function () {
            self.executeQuery();
          }
        });

        editor.commands.addCommand({
          name: 'executeSelectedQuery',
          bindKey: {win: 'Ctrl-Alt-Return', mac: 'Command-Alt-Return', linux: 'Ctrl-Alt-Return'},
          exec: function () {
            self.executeQuery(undefined, true);
          }
        });

        editor.commands.addCommand({
          name: 'saveQuery',
          bindKey: {win: 'Ctrl-Shift-S', mac: 'Command-Shift-S', linux: 'Ctrl-Shift-S'},
          exec: function () {
            self.addAQL();
          }
        });

        editor.commands.addCommand({
          name: 'explainQuery',
          bindKey: {win: 'Ctrl-Shift-Return', mac: 'Command-Shift-Return', linux: 'Ctrl-Shift-Return'},
          exec: function () {
            self.explainQuery();
          }
        });

        editor.commands.addCommand({
          name: 'togglecomment',
          bindKey: {win: 'Ctrl-Shift-C', linux: 'Ctrl-Shift-C', mac: 'Command-Shift-C'},
          exec: function (editor) {
            editor.toggleCommentLines();
          },
          multiSelectAction: 'forEach'
        });

        editor.commands.addCommand({
          name: 'showSpotlight',
          bindKey: {win: 'Ctrl-Space', mac: 'Ctrl-Space', linux: 'Ctrl-Space'},
          exec: function () {
            self.showSpotlight();
          }
        });
      });

      this.queryPreview = ace.edit('queryPreview');
      this.queryPreview.getSession().setMode('ace/mode/aql');
      this.queryPreview.setReadOnly(true);
      this.queryPreview.setFontSize('13px');

      // auto focus this editor
      $('#aqlEditor .ace_text-input').focus();
    },

    updateQueryTable: function () {
      var self = this;
      this.updateLocalQueries();

      this.myQueriesTableDesc.rows = this.customQueries;
      _.each(this.myQueriesTableDesc.rows, function (k) {
        k.secondRow = '<span class="spanWrapper">' +
          '<span id="copyQuery" title="Copy query"><i class="fa fa-copy"></i></span>' +
          '<span id="explQuery" title="Explain query"><i class="fa fa-comments"></i></i></span>' +
          '<span id="runQuery" title="Run query"><i class="fa fa-play-circle-o"></i></i></span>' +
          '<span id="deleteQuery" title="Delete query"><i class="fa fa-minus-circle"></i></span>' +
          '</span>';
        if (k.hasOwnProperty('parameter')) {
          delete k.parameter;
        }
        delete k.value;
      });

      function compare (a, b) {
        var x;
        if (a.name < b.name) {
          x = -1;
        } else if (a.name > b.name) {
          x = 1;
        } else {
          x = 0;
        }
        return x;
      }

      this.myQueriesTableDesc.rows.sort(compare);

      _.each(this.queries, function (val) {
        if (val.hasOwnProperty('parameter')) {
          delete val.parameter;
        }
        self.myQueriesTableDesc.rows.push({
          name: val.name,
          thirdRow: '<span class="spanWrapper">' +
            '<span id="copyQuery" title="Copy query"><i class="fa fa-copy"></i></span></span>'
        });
      });

      // escape all columns but the third (which contains HTML)
      this.myQueriesTableDesc.unescaped = [ false, true, true ];

      this.$(this.myQueriesId).html(this.table.render({content: this.myQueriesTableDesc}));
    },

    listenKey: function (e) {
      if (e.keyCode === 13) {
        if ($('#modalButton1').html() === 'Update') {
          this.saveAQL();
        }
      }
      this.checkSaveName();
    },

    addAQL: function () {
      // update queries first, before showing
      this.refreshAQL(true);
      // render options
      this.createCustomQueryModal();
      setTimeout(function () {
        $('#new-query-name').focus();
      }, 500);
    },

    updateAQL: function () {
      var content = this.aqlEditor.getValue();
      var queryName = $('#lastQueryName').html();
      var query = this.collection.findWhere({name: queryName});

      if (query) {
        // SET QUERY STRING
        query.set('value', content);
        // SET QUERY BIND PARAMS
        query.set('parameter', this.bindParamTableObj);

        var callback = function (error) {
          if (error) {
            arangoHelper.arangoError('Query', 'Could not save query');
          } else {
            var self = this;
            arangoHelper.arangoNotification('Saved query', '"' + queryName + '"');
            this.collection.fetch({
              success: function () {
                self.updateLocalQueries();
              }
            });
          }
        }.bind(this);
        this.collection.saveCollectionQueries(callback);
      }

      this.refreshAQL(true);
    },

    createAQL: function () {
      localStorage.setItem('lastOpenQuery', undefined);
      this.aqlEditor.setValue('');

      this.refreshAQL(true);

      this.breadcrumb();
      $('#updateCurrentQuery').hide();
    },

    createCustomQueryModal: function () {
      var buttons = [];
      var tableContent = [];

      tableContent.push(
        window.modalView.createTextEntry(
          'new-query-name',
          'Name',
          '',
          undefined,
          undefined,
          false,
          [
            {
              rule: Joi.string().required(),
              msg: 'No query name given.'
            }
          ]
        )
      );
      buttons.push(
        window.modalView.createSuccessButton('Save', this.saveAQL.bind(this))
      );
      window.modalView.show('modalTable.ejs', 'Save Query', buttons, tableContent, undefined, undefined,
        {'keyup #new-query-name': this.listenKey.bind(this)});
    },

    checkSaveName: function () {
      var saveName = $('#new-query-name').val();
      if (saveName === 'Insert Query') {
        $('#new-query-name').val('');
        return;
      }

      // check for invalid query names, if present change the box-shadow to red
      // and disable the save functionality
      var found = this.customQueries.some(function (query) {
        return query.name === saveName;
      });
      if (found) {
        $('#modalButton1').removeClass('button-success');
        $('#modalButton1').addClass('button-warning');
        $('#modalButton1').text('Update');
      } else {
        $('#modalButton1').removeClass('button-warning');
        $('#modalButton1').addClass('button-success');
        $('#modalButton1').text('Save');
      }
    },

    saveAQL: function (e) {
      if (e) {
        e.stopPropagation();
      }

      // update queries first, before writing
      this.refreshAQL();

      var saveName = $('#new-query-name').val();
      var bindVars = this.bindParamTableObj;

      if ($('#new-query-name').hasClass('invalid-input')) {
        return;
      }

      // Heiko: Form-Validator - illegal query name
      if (saveName.trim() === '') {
        return;
      }

      var content = this.aqlEditor.getValue();
        // check for already existing entry
      var quit = false;
      _.each(this.customQueries, function (v) {
        if (v.name === saveName) {
          v.value = content;
          quit = true;
          return;
        }
      });

      if (quit === true) {
        // Heiko: Form-Validator - name already taken
        // Update model and save
        this.collection.findWhere({name: saveName}).set('value', content);
      } else {
        if (bindVars === '' || bindVars === undefined) {
          bindVars = '{}';
        }

        if (typeof bindVars === 'string') {
          try {
            bindVars = JSON.parse(bindVars);
          } catch (err) {
            arangoHelper.arangoError('Query', 'Could not parse bind parameter');
          }
        }
        this.collection.add({
          name: saveName,
          parameter: bindVars,
          value: content
        });
      }

      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('Query', 'Could not save query');
        } else {
          var self = this;
          this.collection.fetch({
            success: function () {
              self.updateLocalQueries();
              $('#updateCurrentQuery').show();

              self.breadcrumb(saveName);
            }
          });
        }
      }.bind(this);
      this.collection.saveCollectionQueries(callback);
      window.modalView.hide();
    },

    breadcrumb: function (name) {
      window.setTimeout(function () {
        if (name) {
          $('#subNavigationBar .breadcrumb').html(
            'Query: <span id="lastQueryName">' + name + '</span>'
          );
        } else {
          $('#subNavigationBar .breadcrumb').html('');
        }
      }, 50);
    },

    verifyQueryAndParams: function () {
      var quit = false;

      if (this.aqlEditor.getValue().length === 0) {
        arangoHelper.arangoError('Query', 'Your query is empty');
        quit = true;
      }

      var keys = [];
      _.each(this.bindParamTableObj, function (val, key) {
        if (val === '') {
          quit = true;
          keys.push(key);
        }
      });
      if (keys.length > 0) {
        arangoHelper.arangoError('Bind Parameter', JSON.stringify(keys) + ' not defined.');
      }

      return quit;
    },

    executeQuery: function (e, selected) {
      if (this.verifyQueryAndParams()) {
        return;
      }

      $('#outputEditorWrapper' + this.outputCounter).hide();
      $('#outputEditorWrapper' + this.outputCounter).show('fast');

      this.lastSentQueryString = this.aqlEditor.getValue();

      this.renderQueryResultBox(this.outputCounter, selected);
    },

    renderQueryResultBox: function (counter, selected, cached) {
      this.$(this.outputDiv).prepend(this.outputTemplate.render({
        counter: counter,
        type: 'Query'
      }));

      var outputEditor = ace.edit('outputEditor' + counter);

      // store query and bind parameters history

      outputEditor.setFontSize('13px');
      outputEditor.$blockScrolling = Infinity;
      outputEditor.getSession().setMode('ace/mode/json');
      outputEditor.setReadOnly(true);
      outputEditor.setOption('vScrollBarAlwaysVisible', true);
      outputEditor.setShowPrintMargin(false);
      this.setEditorAutoHeight(outputEditor);

      if (!cached) {
        // Store sent query and bindParameter
        this.queriesHistory[counter] = {
          sentQuery: this.aqlEditor.getValue(),
          bindParam: this.bindParamTableObj
        };

        this.fillResult(counter, selected);
        this.outputCounter++;
      }
    },

    readQueryData: function (selected, forExecute) {
      // var selectedText = this.aqlEditor.session.getTextRange(this.aqlEditor.getSelectionRange())
      var data = {
        id: 'currentFrontendQuery'
      };

      if (selected) {
        data.query = this.aqlEditor.getSelectedText();
      } else {
        data.query = this.aqlEditor.getValue();
      }
      if (data.query.length === 0) {
        if (selected) {
          arangoHelper.arangoError('Query', 'Your query selection is empty!');
        } else {
          arangoHelper.arangoError('Query', 'Your query is empty!');
        }
        data = false;
      } else {
        var bindVars = {};
        if (Object.keys(this.bindParamTableObj).length > 0) {
          _.each(this.bindParamTableObj, function (val, key) {
            if (data.query.indexOf(key) > -1) {
              bindVars[key] = val;
            }
          });
          data.bindVars = this.bindParamTableObj;
        }
        if (Object.keys(bindVars).length > 0) {
          data.bindVars = bindVars;
        }

        // add profile flag for query execution
        if (forExecute) {
          data.options = {
            profile: true
          };
        }
      }

      return JSON.stringify(data);
    },

    fillResult: function (counter, selected) {
      var self = this;

      var queryData = this.readQueryData(selected, true);

      if (queryData === 'false') {
        return;
      }

      if (queryData) {
        $.ajax({
          type: 'POST',
          url: arangoHelper.databaseUrl('/_api/cursor'),
          headers: {
            'x-arango-async': 'store'
          },
          data: queryData,
          contentType: 'application/json',
          processData: false,
          success: function (data, textStatus, xhr) {
            if (xhr.getResponseHeader('x-arango-async-id')) {
              self.queryCallbackFunction(xhr.getResponseHeader('x-arango-async-id'), counter);
            }
            $.noty.clearQueue();
            $.noty.closeAll();
            self.handleResult(counter);
          },
          error: function (data) {
            try {
              var temp = JSON.parse(data.responseText);
              arangoHelper.arangoError('[' + temp.errorNum + ']', temp.errorMessage);
            } catch (e) {
              arangoHelper.arangoError('Query error', 'ERROR');
            }
            self.handleResult(counter);
          }
        });
      }
    },

    handleResult: function () {
      var self = this;
      window.progressView.hide();
      $('#removeResults').show();

      // refocus ace
      window.setTimeout(function () {
        self.aqlEditor.focus();
      }, 300);
    },

    setEditorAutoHeight: function (editor) {
      // ace line height = 17px
      var winHeight = $('.centralRow').height();
      var maxLines = (winHeight - 250) / 17;

      editor.setOptions({
        maxLines: maxLines,
        minLines: 10
      });
    },

    deselect: function (editor) {
      var current = editor.getSelection();
      var currentRow = current.lead.row;
      var currentColumn = current.lead.column;

      current.setSelectionRange({
        start: {
          row: currentRow,
          column: currentColumn
        },
        end: {
          row: currentRow,
          column: currentColumn
        }
      });

      editor.focus();
    },

    warningsFunc: function (data, outputEditor) {
      var warnings = '';
      if (data.extra && data.extra.warnings && data.extra.warnings.length > 0) {
        warnings += 'Warnings:' + '\r\n\r\n';
        data.extra.warnings.forEach(function (w) {
          warnings += '[' + w.code + "], '" + w.message + "'\r\n";
        });
      }
      if (warnings !== '') {
        warnings += '\r\n' + 'Result:' + '\r\n\r\n';
      }
      outputEditor.setValue(warnings + JSON.stringify(data.result, undefined, 2), 1);
      outputEditor.getSession().setScrollTop(0);
    },

    renderQueryResult: function (data, counter, cached, queryID) {
      var self = this;

      if (window.location.hash === '#queries') {
        var outputEditor = ace.edit('outputEditor' + counter);

        var success;

        // handle explain query case
        if (!data.msg) {
          // handle usual query
          var result = self.analyseQuery(data.result);
          if (result.defaultType === 'table') {
            $('#outputEditorWrapper' + counter + ' .arangoToolbarTop').after(
              '<div id="outputTable' + counter + '" class="outputTable"></div>'
            );
            // show csv download button
            $('#outputEditorWrapper' + counter + ' #downloadCsvResult').show();
            $('#outputTable' + counter).show();
            self.renderOutputTable(result, counter);

            // apply max height for table output dynamically
            var maxHeight = $('.centralRow').height() - 250;
            $('.outputEditorWrapper .tableWrapper').css('max-height', maxHeight);

            $('#outputEditor' + counter).hide();
            success = true;
          } else if (result.defaultType === 'graph') {
            $('#outputEditorWrapper' + counter + ' .arangoToolbarTop').after('<div id="outputGraph' + counter + '"></div>');
            $('#outputGraph' + counter).show();
            success = self.renderOutputGraph(result, counter);

            if (success) {
              $('#outputEditor' + counter).hide();

              $('#outputEditorWrapper' + counter + ' #copy2gV').show();
              $('#outputEditorWrapper' + counter + ' #copy2gV').bind('click', function () {
                self.showResultInGraphViewer(result, counter);
              });
            } else {
              $('#outputGraph' + counter).remove();
            }
          }

          // add active class to choosen display method
          if (success !== false) {
            $('#' + result.defaultType + '-switch').addClass('active').css('display', 'inline');
          } else {
            $('#json-switch').addClass('active').css('display', 'inline');
          }

          var appendSpan = function (value, icon, css) {
            if (!css) {
              css = '';
            }
            $('#outputEditorWrapper' + counter + ' .arangoToolbarTop .pull-left').append(
              '<span class="' + css + '"><i class="fa ' + icon + '"></i><i class="iconText">' + value + '</i></span>'
            );
          };

          var time = '-';
          if (data && data.extra && data.extra.stats) {
            if (data.extra.stats.executionTime > 1) {
              time = numeral(data.extra.stats.executionTime).format('0.000');
              time += ' s';
            } else {
              time = numeral(data.extra.stats.executionTime * 1000).format('0.000');
              time += ' ms';
            }
          }
          appendSpan(
            data.result.length + ' elements', 'fa-calculator'
          );
          appendSpan(time, 'fa-clock-o');

          if (data.extra) {
            if (data.extra.profile) {
              appendSpan('', 'fa-caret-down');
              self.appendProfileDetails(counter, data.extra.profile);
            }

            if (data.extra.stats) {
              if (data.extra.stats.writesExecuted > 0 || data.extra.stats.writesIgnored > 0) {
                appendSpan(
                  data.extra.stats.writesExecuted + ' writes', 'fa-check-circle positive'
                );
                if (data.extra.stats.writesIgnored === 0) {
                  appendSpan(
                    data.extra.stats.writesIgnored + ' writes ignored', 'fa-check-circle positive', 'additional'
                  );
                } else {
                  appendSpan(
                    data.extra.stats.writesIgnored + ' writes ignored', 'fa-exclamation-circle warning', 'additional'
                  );
                }
              }
            }
          }
        }

        $('#outputEditorWrapper' + counter + ' .pull-left #spinner').remove();
        $('#outputEditorWrapper' + counter + ' #cancelCurrentQuery').remove();

        self.warningsFunc(data, outputEditor);
        window.progressView.hide();

        $('#outputEditorWrapper' + counter + ' .switchAce').show();
        $('#outputEditorWrapper' + counter + ' .fa-close').show();
        $('#outputEditor' + counter).css('opacity', '1');

        if (!data.msg) {
          $('#outputEditorWrapper' + counter + ' #downloadQueryResult').show();
          $('#outputEditorWrapper' + counter + ' #copy2aqlEditor').show();
        }

        self.setEditorAutoHeight(outputEditor);
        self.deselect(outputEditor);

        // when finished send a delete req to api (free db space)
        // deletion only necessary if result was not fully fetched
        var url;
        if (queryID && data.hasMore) {
          url = arangoHelper.databaseUrl('/_api/cursor/' + encodeURIComponent(queryID));
        } else {
          if (data.id && data.hasMore) {
            url = arangoHelper.databaseUrl('/_api/cursor/' + encodeURIComponent(data.id));
          }
        }

        /*
        if (!data.complete) {
          // TODO notify user?
          // console.log('result was cutted down - more result avail - change limit');
        }
        */

        if (url) {
          $.ajax({
            url: url,
            type: 'DELETE'
          });
        }

        if (!cached) {
          // cache the query
          self.cachedQueries[counter] = data;

          // cache the original sent aql string
          this.cachedQueries[counter].sentQuery = self.aqlEditor.getValue();
        }

        if (data.msg) {
          $('#outputEditorWrapper' + counter + ' .toolbarType').html('Explain');
          outputEditor.setValue(data.msg, 1);
        }
      } else {
        // if result comes in when view is not active
        // store the data into cachedQueries obj
        self.cachedQueries[counter] = data;
        self.cachedQueries[counter].sentQuery = self.lastSentQueryString;

        arangoHelper.arangoNotification('Query finished', 'Return to queries view to see the result.');
      }
    },

    bindQueryResultButtons: function (queryID, counter) {
      var self = this;

      if (queryID) {
        var cancelRunningQuery = function (id, counter) {
          $.ajax({
            url: arangoHelper.databaseUrl('/_api/job/' + encodeURIComponent(id) + '/cancel'),
            type: 'PUT',
            success: function () {
              window.clearTimeout(self.checkQueryTimer);
              $('#outputEditorWrapper' + counter).remove();
              arangoHelper.arangoNotification('Query', 'Query canceled.');
            }
          });
        };
      }

      $('#outputEditorWrapper' + counter + ' #cancelCurrentQuery').bind('click', function () {
        cancelRunningQuery(queryID, counter);
      });

      $('#outputEditorWrapper' + counter + ' #copy2aqlEditor').bind('click', function () {
        if (!$('#toggleQueries1').is(':visible')) {
          self.toggleQueries();
        }

        var aql = self.queriesHistory[counter].sentQuery;
        var bindParam = self.queriesHistory[counter].bindParam;

        self.aqlEditor.setValue(aql, 1);
        self.deselect(self.aqlEditor);
        if (Object.keys(bindParam).length > 0) {
          self.bindParamTableObj = bindParam;
          self.setCachedQuery(self.aqlEditor.getValue(), JSON.stringify(self.bindParamTableObj));

          if ($('#bindParamEditor').is(':visible')) {
            self.renderBindParamTable();
          } else {
            self.bindParamAceEditor.setValue(JSON.stringify(bindParam), 1);
            self.deselect(self.bindParamAceEditor);
          }
        }
        $('.centralRow').animate({ scrollTop: 0 }, 'fast');
        self.resize();
      });
    },

    queryCallbackFunction: function (queryID, counter) {
      var self = this;
      self.tmpQueryResult = null;

      this.bindQueryResultButtons(queryID, counter);
      this.execPending = false;

      var userLimit;
      try {
        userLimit = parseInt($('#querySize').val());
      } catch (e) {
        arangoHelper.arangoError('Parse Error', 'Could not parse defined user limit.');
      }

      var pushQueryResults = function (data) {
        if (self.tmpQueryResult === null) {
          self.tmpQueryResult = {
            result: [],
            complete: true
          };
        }

        _.each(data, function (val, key) {
          if (key !== 'result') {
            self.tmpQueryResult[key] = val;
          } else {
            _.each(data.result, function (d) {
              if (self.tmpQueryResult.result.length < userLimit) {
                self.tmpQueryResult.result.push(d);
              } else {
                self.tmpQueryResult.complete = false;
              }
            });
          }
        });
      };

      // check if async query is finished
      var checkQueryStatus = function (cursorID) {
        var url = arangoHelper.databaseUrl('/_api/job/' + encodeURIComponent(queryID));
        if (cursorID) {
          url = arangoHelper.databaseUrl('/_api/cursor/' + encodeURIComponent(cursorID));
        }

        $.ajax({
          type: 'PUT',
          url: url,
          contentType: 'application/json',
          processData: false,
          success: function (data, textStatus, xhr) {
            // query finished, now fetch results using cursor

            if (xhr.status === 201 || xhr.status === 200) {
              if (data.hasMore) {
                pushQueryResults(data);

                // continue to fetch result
                checkQueryStatus(data.id);
              } else {
                pushQueryResults(data);
                self.renderQueryResult(self.tmpQueryResult, counter, false, queryID);
                self.tmpQueryResult = null;
              }
              // SCROLL TO RESULT BOX
              $('.centralRow').animate({ scrollTop: $('#queryContent').height() }, 'fast');
            } else if (xhr.status === 204) {
            // query not ready yet, retry
              self.checkQueryTimer = window.setTimeout(function () {
                checkQueryStatus();
              }, 500);
            }
          },
          error: function (resp) {
            var error;

            try {
              if (resp.statusText === 'Gone') {
                arangoHelper.arangoNotification('Query', 'Query execution aborted.');
                self.removeOutputEditor(counter);
                return;
              }

              error = JSON.parse(resp.responseText);
              arangoHelper.arangoError('Query', error.errorMessage);
              if (error.errorMessage) {
                if (error.errorMessage.match(/\d+:\d+/g) !== null) {
                  self.markPositionError(
                    error.errorMessage.match(/'.*'/g)[0],
                    error.errorMessage.match(/\d+:\d+/g)[0]
                  );
                } else {
                  self.markPositionError(
                    error.errorMessage.match(/\(\w+\)/g)[0]
                  );
                }
                self.removeOutputEditor(counter);
              }
            } catch (e) {
              self.removeOutputEditor(counter);
              if (error.code === 409) {
                return;
              }
              if (error.code !== 400 && error.code !== 404 && error.code !== 500) {
                arangoHelper.arangoNotification('Query', 'Successfully aborted.');
              }
            }

            window.progressView.hide();
          }
        });
      };
      checkQueryStatus();
    },

    appendProfileDetails: function (counter, data) {
      var element = '#outputEditorWrapper' + counter;

      $(element + ' .fa-caret-down').first().on('click', function () {
        var alreadyRendered = $(element).find('.queryProfile');
        if (!$(alreadyRendered).is(':visible')) {
          $(element).append('<div class="queryProfile" counter="' + counter + '"></div>');
          var queryProfile = $(element + ' .queryProfile').first();
          queryProfile.hide();

          // var outputPosition = $(element + ' .fa-caret-down').first().offset();
          queryProfile
          .css('position', 'absolute')
          .css('left', 215)
          .css('top', 55);

          // $("#el").offset().top - $(document).scrollTop()
          var profileWidth = 590;

          var legend = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G'
          ];

          var colors = [
            'rgb(48, 125, 153)',
            'rgb(241, 124, 176)',
            'rgb(137, 110, 37)',
            'rgb(93, 165, 218)',
            'rgb(250, 164, 58)',
            'rgb(64, 74, 83)',
            'rgb(96, 189, 104)'
          ];

          var descs = [
            'startup time for query engine',
            'query parsing',
            'abstract syntax tree optimizations',
            'loading collections',
            'instanciation of initial execution plan',
            'execution plan optimization and permutation',
            'query execution'
          ];

          queryProfile.append(
            '<i class="fa fa-close closeProfile"></i>' +
            '<span class="profileHeader">Profiling information</span>' +
            '<div class="pure-g pure-table pure-table-body"></div>' +
            '<div class="prof-progress"></div>' +
            '<div class="prof-progress-label"></div>' +
            '<div class="clear"></div>'
          );

          var total = 0;
          _.each(data, function (value) {
            total += value * 1000;
          });

          var pos = 0;
          var width;
          var adjustWidth = 0;

          var time = '';
          _.each(data, function (value, key) {
            if (value > 1) {
              time = numeral(value).format('0.000');
              time += ' s';
            } else {
              time = numeral(value * 1000).format('0.000');
              time += ' ms';
            }

            queryProfile.find('.pure-g').append(
              '<div class="pure-table-row noHover">' +
              '<div class="pure-u-1-24 left"><p class="bold" style="background:' + colors[pos] + '">' + legend[pos] + '</p></div>' +
              '<div class="pure-u-4-24 left">' + time + '</div>' +
              '<div class="pure-u-6-24 left">' + key + '</div>' +
              '<div class="pure-u-13-24 left">' + descs[pos] + '</div>' +
              '</div>'
            );

            width = Math.floor((value * 1000) / total * 100);
            if (width === 0) {
              width = 1;
              adjustWidth++;
            }

            if (pos !== 6) {
              queryProfile.find('.prof-progress').append(
                '<div style="width: ' + width + '%; background-color: ' + colors[pos] + '"></div>'
              );
              if (width > 1) {
                queryProfile.find('.prof-progress-label').append(
                  '<div style="width: ' + width + '%;">' + legend[pos] + '</div>'
                );
              } else {
                queryProfile.find('.prof-progress-label').append(
                  '<div style="width: ' + width + '%; font-size: 9px">' + legend[pos] + '</div>'
                );
              }
            } else {
              if (adjustWidth > 0) {
                width = width - adjustWidth;
              }
              queryProfile.find('.prof-progress').append(
                '<div style="width: ' + width + '%; background-color: ' + colors[pos] + '"></div>'
              );
              if (width > 1) {
                queryProfile.find('.prof-progress-label').append(
                  '<div style="width: ' + width + '%;">' + legend[pos] + '</div>'
                );
              } else {
                queryProfile.find('.prof-progress-label').append(
                  '<div style="width: ' + width + '%; font-size: 9px">' + legend[pos] + '</div>'
                );
              }
            }
            pos++;
          });

          queryProfile.width(profileWidth);
          queryProfile.height('auto');
          queryProfile.fadeIn('fast');
        } else {
          $(element).find('.queryProfile').remove();
        }
      });
    },

    analyseQuery: function (result) {
      var toReturn = {
        defaultType: null,
        original: result,
        modified: null
      };

      var found = false;

      if (!Array.isArray(result)) {
        toReturn.defaultType = 'json';
        return toReturn;
      }

      // check if result could be displayed as graph
      // case a) result has keys named vertices and edges
      if (result[0]) {
        if (result[0].vertices && result[0].edges) {
          var hitsa = 0;
          var totala = 0;

          _.each(result, function (obj) {
            if (obj.edges) {
              _.each(obj.edges, function (edge) {
                if (edge !== null) {
                  if (edge._from && edge._to) {
                    hitsa++;
                  }
                  totala++;
                }
              });
            }
          });

          var percentagea = 0;
          if (totala > 0) {
            percentagea = hitsa / totala * 100;
          }

          if (percentagea >= 95) {
            found = true;
            toReturn.defaultType = 'graph';
            toReturn.graphInfo = 'object';
          }
        } else {
          // case b) 95% have _from and _to attribute
          var hitsb = 0;
          var totalb = result.length;

          _.each(result, function (obj) {
            if (obj) {
              if (obj._from && obj._to && obj._id) {
                hitsb++;
              }
            }
          });

          var percentageb = 0;
          if (totalb > 0) {
            percentageb = hitsb / totalb * 100;
          }

          if (percentageb >= 95) {
            found = true;
            toReturn.defaultType = 'graph';
            toReturn.graphInfo = 'array';
            // then display as graph
          }
        }
      }

      // check if result could be displayed as table
      if (!found) {
        var check = true;
        var attributes = {};

        if (result.length <= 1) {
          check = false;
        }

        if (check) {
          _.each(result, function (obj) {
            if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
              // not a document and not suitable for tabluar display
              return;
            }

            _.each(obj, function (value, key) {
              if (attributes.hasOwnProperty(key)) {
                ++attributes[key];
              } else {
                attributes[key] = 1;
              }
            });
          });

          var rate = 0;

          _.each(attributes, function (val, key) {
            if (check !== false) {
              rate = (val / result.length) * 100;
              if (rate <= 95) {
                check = false;
              }
            }
          });

          if (rate <= 95) {
            check = false;
          }
        }

        if (check) {
          found = true;
          toReturn.defaultType = 'table';
        }
      }

      if (!found) {
      // if all check fails, then just display as json
        toReturn.defaultType = 'json';
      }

      return toReturn;
    },

    markPositionError: function (text, pos) {
      var row;

      if (pos) {
        row = pos.split(':')[0];
        text = text.substr(1, text.length - 2);
      }

      var found = this.aqlEditor.find(text);

      if (!found && pos) {
        this.aqlEditor.selection.moveCursorToPosition({row: row, column: 0});
        this.aqlEditor.selection.selectLine();
      }
      window.setTimeout(function () {
        $('.ace_start').first().css('background', 'rgba(255, 129, 129, 0.7)');
      }, 100);
    },

    refreshAQL: function () {
      var self = this;

      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('Query', 'Could not reload queries');
        } else {
          self.updateLocalQueries();
          self.updateQueryTable();
        }
      };

      var originCallback = function () {
        self.getSystemQueries(callback);
      };

      this.getAQL(originCallback);
    },

    getSystemQueries: function (callback) {
      var self = this;

      $.ajax({
        type: 'GET',
        cache: false,
        url: 'js/arango/aqltemplates.json',
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          if (callback) {
            callback(false);
          }
          self.queries = data;
        },
        error: function () {
          if (callback) {
            callback(true);
          }
          arangoHelper.arangoNotification('Query', 'Error while loading system templates');
        }
      });
    },

    updateLocalQueries: function () {
      var self = this;
      this.customQueries = [];

      this.collection.each(function (model) {
        self.customQueries.push({
          name: model.get('name'),
          value: model.get('value'),
          parameter: model.get('parameter')
        });
      });
    },

    renderOutputTable: function (data, counter) {
      var tableDescription = {
        id: 'outputTableData' + counter,
        titles: [],
        rows: []
      };

      var first = true;
      var headers = {}; // quick lookup cache
      var pos = 0;
      _.each(data.original, function (obj) {
        if (first === true) {
          tableDescription.titles = Object.keys(obj);
          tableDescription.titles.forEach(function (t) {
            headers[String(t)] = pos++;
          });
          first = false;
        }
        var part = Array(pos);
        _.each(obj, function (val, key) {
          if (!headers.hasOwnProperty(key)) {
            // different attribute
            return;
          }

          if (typeof val === 'object') {
            val = JSON.stringify(val);
          }

          part[headers[key]] = val;
        });

        tableDescription.rows.push(part);
      });

      $('#outputTable' + counter).append(this.table.render({content: tableDescription}));
    },

    renderOutputGraph: function (data, counter) {
      this.graphViewers[counter] = new window.GraphViewer({
        name: undefined,
        documentStore: window.App.arangoDocumentStore,
        collection: new window.GraphCollection(),
        userConfig: window.App.userConfig,
        id: '#outputGraph' + counter,
        data: data
      });
      var success = this.graphViewers[counter].renderAQLPreview();

      return success;
    },

    showResultInGraphViewer: function (data, counter) {
      window.location.hash = '#aql_graph';

      // TODO better manage mechanism for both gv's
      if (window.App.graphViewer) {
        if (window.App.graphViewer.graphSettingsView) {
          window.App.graphViewer.graphSettingsView.remove();
        }
        window.App.graphViewer.remove();
      }

      window.App.graphViewer = new window.GraphViewer({
        name: undefined,
        documentStore: window.App.arangoDocumentStore,
        collection: new window.GraphCollection(),
        userConfig: window.App.userConfig,
        noDefinedGraph: true,
        data: data
      });
      window.App.graphViewer.renderAQL();
    },

    getAQL: function (originCallback) {
      var self = this;

      this.collection.fetch({
        success: function () {
          self.getCachedQueryAfterRender();

          // old storage method
          var item = localStorage.getItem('customQueries');
          if (item) {
            var queries = JSON.parse(item);
            // save queries in user collections extra attribute
            _.each(queries, function (oldQuery) {
              self.collection.add({
                value: oldQuery.value,
                name: oldQuery.name
              });
            });

            var callback = function (error) {
              if (error) {
                arangoHelper.arangoError(
                  'Custom Queries',
                  'Could not import old local storage queries'
                );
              } else {
                localStorage.removeItem('customQueries');
              }
            };
            self.collection.saveCollectionQueries(callback);
          }
          self.updateLocalQueries();

          if (originCallback) {
            originCallback();
          }
        }
      });
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, Backbone, templateEngine, $, window */
(function () {
  'use strict';

  window.ScaleView = Backbone.View.extend({
    el: '#content',
    template: templateEngine.createTemplate('scaleView.ejs'),
    interval: 10000,
    knownServers: [],

    events: {
      'click #addCoord': 'addCoord',
      'click #removeCoord': 'removeCoord',
      'click #addDBs': 'addDBs',
      'click #removeDBs': 'removeDBs'
    },

    setCoordSize: function (number) {
      var self = this;
      var data = {
        numberOfCoordinators: number
      };

      $.ajax({
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_admin/cluster/numberOfServers'),
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function () {
          self.updateTable(data);
        },
        error: function () {
          arangoHelper.arangoError('Scale', 'Could not set coordinator size.');
        }
      });
    },

    setDBsSize: function (number) {
      var self = this;
      var data = {
        numberOfDBServers: number
      };

      $.ajax({
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_admin/cluster/numberOfServers'),
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function () {
          self.updateTable(data);
        },
        error: function () {
          arangoHelper.arangoError('Scale', 'Could not set coordinator size.');
        }
      });
    },

    addCoord: function () {
      this.setCoordSize(this.readNumberFromID('#plannedCoords', true));
    },

    removeCoord: function () {
      this.setCoordSize(this.readNumberFromID('#plannedCoords', false, true));
    },

    addDBs: function () {
      this.setDBsSize(this.readNumberFromID('#plannedDBs', true));
    },

    removeDBs: function () {
      this.setDBsSize(this.readNumberFromID('#plannedDBs', false, true));
    },

    readNumberFromID: function (id, increment, decrement) {
      var value = $(id).html();
      var parsed = false;

      try {
        parsed = JSON.parse(value);
      } catch (ignore) {}

      if (increment) {
        parsed++;
      }
      if (decrement) {
        if (parsed !== 1) {
          parsed--;
        }
      }

      return parsed;
    },

    initialize: function (options) {
      var self = this;
      clearInterval(this.intervalFunction);

      if (window.App.isCluster) {
        this.dbServers = options.dbServers;
        this.coordinators = options.coordinators;
        this.updateServerTime();

        // start polling with interval
        this.intervalFunction = window.setInterval(function () {
          if (window.location.hash === '#sNodes') {
            self.coordinators.fetch({
              success: function () {
                self.dbServers.fetch({
                  success: function () {
                    self.continueRender(true);
                  }
                });
              }
            });
          }
        }, this.interval);
      }
    },

    render: function () {
      var self = this;

      var callback = function () {
        var cb2 = function () {
          self.continueRender();
        };

        this.waitForDBServers(cb2);
      }.bind(this);

      if (!this.initDoneCoords) {
        this.waitForCoordinators(callback);
      } else {
        callback();
      }

      window.arangoHelper.buildNodesSubNav('scale');
    },

    continueRender: function (rerender) {
      var coords;
      var dbs;
      var self = this;
      coords = this.coordinators.toJSON();
      dbs = this.dbServers.toJSON();

      this.$el.html(this.template.render({
        runningCoords: coords.length,
        runningDBs: dbs.length,
        plannedCoords: undefined,
        plannedDBs: undefined,
        initialized: rerender
      }));

      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_admin/cluster/numberOfServers'),
        contentType: 'application/json',
        processData: false,
        success: function (data) {
          self.updateTable(data);
        }
      });
    },

    updateTable: function (data) {
      var scalingActive = '<span class="warning">scaling in progress <i class="fa fa-circle-o-notch fa-spin"></i></span>';
      var scalingDone = '<span class="positive">no scaling process active</span>';

      if (data.numberOfCoordinators) {
        $('#plannedCoords').html(data.numberOfCoordinators);

        if (this.coordinators.toJSON().length === data.numberOfCoordinators) {
          $('#statusCoords').html(scalingDone);
        } else {
          $('#statusCoords').html(scalingActive);
        }
      }

      if (data.numberOfDBServers) {
        $('#plannedDBs').html(data.numberOfDBServers);
        if (this.dbServers.toJSON().length === data.numberOfDBServers) {
          $('#statusDBs').html(scalingDone);
        } else {
          $('#statusDBs').html(scalingActive);
        }
      }
    },

    waitForDBServers: function (callback) {
      var self = this;

      if (this.dbServers.length === 0) {
        window.setInterval(function () {
          self.waitForDBServers(callback);
        }, 300);
      } else {
        callback();
      }
    },

    waitForCoordinators: function (callback) {
      var self = this;

      window.setTimeout(function () {
        if (self.coordinators.length === 0) {
          self.waitForCoordinators(callback);
        } else {
          self.initDoneCoords = true;
          callback();
        }
      }, 200);
    },

    updateServerTime: function () {
      this.serverTime = new Date().getTime();
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global frontendConfig, arangoHelper, Joi, Backbone, window, $ */

(function () {
  'use strict';

  window.SettingsView = Backbone.View.extend({
    el: '#content',

    initialize: function (options) {
      this.collectionName = options.collectionName;
      this.model = this.collection;
    },

    events: {
    },

    render: function () {
      this.breadcrumb();
      window.arangoHelper.buildCollectionSubNav(this.collectionName, 'Settings');

      this.renderSettings();
    },

    breadcrumb: function () {
      $('#subNavigationBar .breadcrumb').html(
        'Collection: ' + this.collectionName
      );
    },

    unloadCollection: function () {
      var unloadCollectionCallback = function (error) {
        if (error) {
          arangoHelper.arangoError('Collection error', this.model.get('name') + ' could not be unloaded.');
        } else if (error === undefined) {
          this.model.set('status', 'unloading');
          this.render();
        } else {
          if (window.location.hash === '#collections') {
            this.model.set('status', 'unloaded');
            this.render();
          } else {
            arangoHelper.arangoNotification('Collection ' + this.model.get('name') + ' unloaded.');
          }
        }
      }.bind(this);

      this.model.unloadCollection(unloadCollectionCallback);
      window.modalView.hide();
    },

    loadCollection: function () {
      var loadCollectionCallback = function (error) {
        if (error) {
          arangoHelper.arangoError('Collection error', this.model.get('name') + ' could not be loaded.');
        } else if (error === undefined) {
          this.model.set('status', 'loading');
          this.render();
        } else {
          if (window.location.hash === '#collections') {
            this.model.set('status', 'loaded');
            this.render();
          } else {
            arangoHelper.arangoNotification('Collection ' + this.model.get('name') + ' loaded.');
          }
        }
      }.bind(this);

      this.model.loadCollection(loadCollectionCallback);
      window.modalView.hide();
    },

    truncateCollection: function () {
      this.model.truncateCollection();
      $('.modal-delete-confirmation').hide();
      window.modalView.hide();
    },

    deleteCollection: function () {
      this.model.destroy(
        {
          error: function () {
            arangoHelper.arangoError('Could not delete collection.');
          },
          success: function () {
            window.App.navigate('#collections', {trigger: true});
          }
        }
      );
    },

    saveModifiedCollection: function () {
      var callback = function (error, isCoordinator) {
        if (error) {
          arangoHelper.arangoError('Error', 'Could not get coordinator info');
        } else {
          var newname;
          if (isCoordinator) {
            newname = this.model.get('name');
          } else {
            newname = $('#change-collection-name').val();
          }
          var status = this.model.get('status');

          if (status === 'loaded') {
            var journalSize;
            try {
              journalSize = JSON.parse($('#change-collection-size').val() * 1024 * 1024);
            } catch (e) {
              arangoHelper.arangoError('Please enter a valid number');
              return 0;
            }

            var indexBuckets;
            try {
              indexBuckets = JSON.parse($('#change-index-buckets').val());
              if (indexBuckets < 1 || parseInt(indexBuckets, 10) !== Math.pow(2, Math.log2(indexBuckets))) {
                throw new Error('invalid indexBuckets value');
              }
            } catch (e) {
              arangoHelper.arangoError('Please enter a valid number of index buckets');
              return 0;
            }
            var callbackChange = function (error) {
              if (error) {
                arangoHelper.arangoError('Collection error: ' + error.responseText);
              } else {
                arangoHelper.arangoNotification('Collection: ' + 'Successfully changed.');
                window.App.navigate('#cSettings/' + newname, {trigger: true});
              }
            };

            var callbackRename = function (error) {
              if (error) {
                arangoHelper.arangoError('Collection error: ' + error.responseText);
              } else {
                var wfs = $('#change-collection-sync').val();
                this.model.changeCollection(wfs, journalSize, indexBuckets, callbackChange);
              }
            }.bind(this);

            if (frontendConfig.isCluster === false) {
              this.model.renameCollection(newname, callbackRename);
            } else {
              callbackRename();
            }
          } else if (status === 'unloaded') {
            if (this.model.get('name') !== newname) {
              var callbackRename2 = function (error, data) {
                if (error) {
                  arangoHelper.arangoError('Collection' + data.responseText);
                } else {
                  arangoHelper.arangoNotification('Collection' + 'Successfully changed.');
                  window.App.navigate('#cSettings/' + newname, {trigger: true});
                }
              };

              if (frontendConfig.isCluster === false) {
                this.model.renameCollection(newname, callbackRename2);
              } else {
                callbackRename2();
              }
            } else {
              window.modalView.hide();
            }
          }
        }
      }.bind(this);

      window.isCoordinator(callback);
    },
    renderSettings: function () {
      var callback = function (error, isCoordinator) {
        if (error) {
          arangoHelper.arangoError('Error', 'Could not get coordinator info');
        } else {
          var collectionIsLoaded = false;

          if (this.model.get('status') === 'loaded') {
            collectionIsLoaded = true;
          }

          var buttons = [];
          var tableContent = [];

          if (!isCoordinator) {
            tableContent.push(
              window.modalView.createTextEntry(
                'change-collection-name',
                'Name',
                this.model.get('name'),
                false,
                '',
                true,
                [
                  {
                    rule: Joi.string().regex(/^[a-zA-Z]/),
                    msg: 'Collection name must always start with a letter.'
                  },
                  {
                    rule: Joi.string().regex(/^[a-zA-Z0-9\-_]*$/),
                    msg: 'Only Symbols "_" and "-" are allowed.'
                  },
                  {
                    rule: Joi.string().required(),
                    msg: 'No collection name given.'
                  }
                ]
              )
            );
          }

          var after = function () {
            tableContent.push(
              window.modalView.createReadOnlyEntry(
                'change-collection-id', 'ID', this.model.get('id'), ''
              )
            );
            tableContent.push(
              window.modalView.createReadOnlyEntry(
                'change-collection-type', 'Type', this.model.get('type'), ''
              )
            );
            tableContent.push(
              window.modalView.createReadOnlyEntry(
                'change-collection-status', 'Status', this.model.get('status'), ''
              )
            );
            buttons.push(
              window.modalView.createDeleteButton(
                'Delete',
                this.deleteCollection.bind(this)
              )
            );
            buttons.push(
              window.modalView.createDeleteButton(
                'Truncate',
                this.truncateCollection.bind(this)
              )
            );
            if (collectionIsLoaded) {
              buttons.push(
                window.modalView.createNotificationButton(
                  'Unload',
                  this.unloadCollection.bind(this)
                )
              );
            } else {
              buttons.push(
                window.modalView.createNotificationButton(
                  'Load',
                  this.loadCollection.bind(this)
                )
              );
            }

            buttons.push(
              window.modalView.createSuccessButton(
                'Save',
                this.saveModifiedCollection.bind(this)
              )
            );

            var tabBar = ['General', 'Indexes'];
            var templates = ['modalTable.ejs', 'indicesView.ejs'];

            window.modalView.show(
              templates,
              'Modify Collection',
              buttons,
              tableContent, null, null,
              this.events, null,
              tabBar, 'content'
            );
            $($('#infoTab').children()[1]).remove();
          }.bind(this);

          if (collectionIsLoaded) {
            var callback2 = function (error, data) {
              if (error) {
                arangoHelper.arangoError('Collection', 'Could not fetch properties');
              } else {
                if (data.journalSize) {
                  var journalSize = data.journalSize / (1024 * 1024);
                  var indexBuckets = data.indexBuckets;
                  var wfs = data.waitForSync;

                  tableContent.push(
                    window.modalView.createTextEntry(
                      'change-collection-size',
                      'Journal size',
                      journalSize,
                      'The maximal size of a journal or datafile (in MB). Must be at least 1.',
                      '',
                      true,
                      [
                        {
                          rule: Joi.string().allow('').optional().regex(/^[0-9]*$/),
                          msg: 'Must be a number.'
                        }
                      ]
                    )
                  );
                }

                if (indexBuckets) {
                  tableContent.push(
                    window.modalView.createTextEntry(
                      'change-index-buckets',
                      'Index buckets',
                      indexBuckets,
                      'The number of index buckets for this collection. Must be at least 1 and a power of 2.',
                      '',
                      true,
                      [
                        {
                          rule: Joi.string().allow('').optional().regex(/^[1-9][0-9]*$/),
                          msg: 'Must be a number greater than 1 and a power of 2.'
                        }
                      ]
                    )
                  );
                }

                // prevent "unexpected sync method error"
                tableContent.push(
                  window.modalView.createSelectEntry(
                    'change-collection-sync',
                    'Wait for sync',
                    wfs,
                    'Synchronize to disk before returning from a create or update of a document.',
                    [{value: false, label: 'No'}, {value: true, label: 'Yes'}])
                );
              }
              after();
            };

            this.model.getProperties(callback2);
          } else {
            after();
          }
        }
      }.bind(this);
      window.isCoordinator(callback);
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global arangoHelper, Backbone, templateEngine, $, window, _ */
(function () {
  'use strict';

  window.ShardsView = Backbone.View.extend({
    el: '#content',
    template: templateEngine.createTemplate('shardsView.ejs'),
    interval: 10000,
    knownServers: [],

    events: {
      'click #shardsContent .shardLeader span': 'moveShard',
      'click #shardsContent .shardFollowers span': 'moveShardFollowers',
      'click #rebalanceShards': 'rebalanceShards'
    },

    initialize: function (options) {
      var self = this;

      self.dbServers = options.dbServers;
      clearInterval(this.intervalFunction);

      if (window.App.isCluster) {
        this.updateServerTime();

        // start polling with interval
        this.intervalFunction = window.setInterval(function () {
          if (window.location.hash === '#shards') {
            self.render(false);
          }
        }, this.interval);
      }
    },

    render: function (navi) {
      if (window.location.hash === '#shards') {
        var self = this;

        $.ajax({
          type: 'GET',
          cache: false,
          url: arangoHelper.databaseUrl('/_admin/cluster/shardDistribution'),
          contentType: 'application/json',
          processData: false,
          async: true,
          success: function (data) {
            var collsAvailable = false;
            self.shardDistribution = data.results;

            _.each(data.results, function (ignore, name) {
              if (name !== 'error' && name !== 'code') {
                if (name.substring(0, 1) !== '_') {
                  collsAvailable = true;
                }
                if (name.startsWith('_local_') || name.startsWith('_to_') || name.startsWith('_from_')) {
                  collsAvailable = true;
                }
              }
            });

            if (collsAvailable) {
              self.continueRender(data.results);
            } else {
              arangoHelper.renderEmpty('No collections and no shards available');
            }
          },
          error: function (data) {
            if (data.readyState !== 0) {
              arangoHelper.arangoError('Cluster', 'Could not fetch sharding information.');
            }
          }
        });

        if (navi !== false) {
          arangoHelper.buildNodesSubNav('Shards');
        }
      }
    },

    moveShardFollowers: function (e) {
      var from = $(e.currentTarget).html();
      this.moveShard(e, from);
    },

    moveShard: function (e, from) {
      var self = this;
      var fromServer, collectionName, shardName, leader;
      var dbName = window.App.currentDB.get('name');
      collectionName = $(e.currentTarget).parent().parent().attr('collection');
      shardName = $(e.currentTarget).parent().parent().attr('shard');

      if (!from) {
        fromServer = $(e.currentTarget).parent().parent().attr('leader');
        fromServer = arangoHelper.getDatabaseServerId(fromServer);
      } else {
        leader = $(e.currentTarget).parent().parent().attr('leader');
        leader = arangoHelper.getDatabaseServerId(leader);
        fromServer = arangoHelper.getDatabaseServerId(from);
      }

      var buttons = [];
      var tableContent = [];

      var obj = {};
      var array = [];

      self.dbServers[0].fetch({
        success: function () {
          self.dbServers[0].each(function (db) {
            if (db.get('id') !== fromServer) {
              obj[db.get('name')] = {
                value: db.get('id'),
                label: db.get('name')
              };
            }
          });

          _.each(self.shardDistribution[collectionName].Plan[shardName].followers, function (follower) {
            delete obj[follower];
          });

          if (from) {
            delete obj[leader];
          }

          _.each(obj, function (value) {
            array.push(value);
          });

          array = array.reverse();

          if (array.length === 0) {
            arangoHelper.arangoMessage('Shards', 'No database server for moving the shard is available.');
            return;
          }

          tableContent.push(
            window.modalView.createSelectEntry(
              'toDBServer',
              'Destination',
              undefined,
              // this.users !== null ? this.users.whoAmI() : 'root',
              'Please select the target database server. The selected database ' +
                'server will be the new leader of the shard.',
                array
            )
          );

          buttons.push(
            window.modalView.createSuccessButton(
              'Move',
              self.confirmMoveShards.bind(this, dbName, collectionName, shardName, fromServer)
            )
          );

          window.modalView.show(
            'modalTable.ejs',
            'Move shard: ' + shardName,
            buttons,
            tableContent
          );
        }
      });
    },

    confirmMoveShards: function (dbName, collectionName, shardName, fromServer) {
      var toServer = $('#toDBServer').val();

      var data = {
        database: dbName,
        collection: collectionName,
        shard: shardName,
        fromServer: fromServer,
        toServer: toServer
      };

      $.ajax({
        type: 'POST',
        cache: false,
        url: arangoHelper.databaseUrl('/_admin/cluster/moveShard'),
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(data),
        async: true,
        success: function (data) {
          if (data.id) {
            arangoHelper.arangoNotification('Shard ' + shardName + ' will be moved to ' + arangoHelper.getDatabaseShortName(toServer) + '.');
            window.setTimeout(function () {
              window.App.shardsView.render();
            }, 3000);
          }
        },
        error: function () {
          arangoHelper.arangoError('Shard ' + shardName + ' could not be moved to ' + arangoHelper.getDatabaseShortName(toServer) + '.');
        }
      });

      window.modalView.hide();
    },

    rebalanceShards: function () {
      var self = this;

      $.ajax({
        type: 'POST',
        cache: false,
        url: arangoHelper.databaseUrl('/_admin/cluster/rebalanceShards'),
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify({}),
        async: true,
        success: function (data) {
          if (data === true) {
            window.setTimeout(function () {
              self.render(false);
            }, 3000);
            arangoHelper.arangoNotification('Started rebalance process.');
          }
        },
        error: function () {
          arangoHelper.arangoError('Could not start rebalance process.');
        }
      });

      window.modalView.hide();
    },

    continueRender: function (collections) {
      var self = this;

      delete collections.code;
      delete collections.error;

      _.each(collections, function (attr, name) {
        // smart found
        var combined = {
          Plan: {},
          Current: {}
        };

        if (name.startsWith('_local_')) {
          // if prefix avail., get the collection name
          var cName = name.substr(7, name.length - 1);

          var toFetch = [
            '_local_' + cName,
            '_from_' + cName,
            '_to_' + cName,
            cName
          ];

          var pos = 0;
          _.each(toFetch, function (val, key) {
            _.each(collections[toFetch[pos]].Current, function (shardVal, shardName) {
              combined.Current[shardName] = shardVal;
            });

            _.each(collections[toFetch[pos]].Plan, function (shardVal, shardName) {
              combined.Plan[shardName] = shardVal;
            });

            delete collections[toFetch[pos]];
            collections[cName] = combined;
            pos++;
          });
        }
      });

      // order results
      var ordered = {};
      Object.keys(collections).sort().forEach(function (key) {
        ordered[key] = collections[key];
      });

      this.$el.html(this.template.render({
        collections: ordered
      }));

      var doRerender = false;
      _.each(collections, function (shard) {
        _.each(shard.Plan, function (val, key) {
          if (val.progress) {
            doRerender = true;
          }
        });
      });
      if (doRerender) {
        window.setTimeout(function () {
          self.render();
        }, 3000);
      }
    },

    updateServerTime: function () {
      this.serverTime = new Date().getTime();
    }

  });
}());

/* global window, $, Backbone, templateEngine,  _, d3, Dygraph, document */

(function () {
  'use strict';

  window.ShowClusterView = Backbone.View.extend({
    detailEl: '#modalPlaceholder',
    el: '#content',
    defaultFrame: 20 * 60 * 1000,
    template: templateEngine.createTemplate('showCluster.ejs'),
    modal: templateEngine.createTemplate('waitModal.ejs'),
    detailTemplate: templateEngine.createTemplate('detailView.ejs'),

    events: {
      'change #selectDB': 'updateCollections',
      'change #selectCol': 'updateShards',
      'click .dbserver.success': 'dashboard',
      'click .coordinator.success': 'dashboard'
    },

    replaceSVGs: function () {
      $('.svgToReplace').each(function () {
        var img = $(this);
        var id = img.attr('id');
        var src = img.attr('src');
        $.get(src, function (d) {
          var svg = $(d).find('svg');
          svg.attr('id', id)
            .attr('class', 'icon')
            .removeAttr('xmlns:a');
          img.replaceWith(svg);
        }, 'xml');
      });
    },

    updateServerTime: function () {
      this.serverTime = new Date().getTime();
    },

    setShowAll: function () {
      this.graphShowAll = true;
    },

    resetShowAll: function () {
      this.graphShowAll = false;
      this.renderLineChart();
    },

    initialize: function (options) {
      this.options = options;
      this.interval = 10000;
      this.isUpdating = false;
      this.timer = null;
      this.knownServers = [];
      this.graph = undefined;
      this.graphShowAll = false;
      this.updateServerTime();
      this.dygraphConfig = this.options.dygraphConfig;
      this.dbservers = new window.ClusterServers([], {
        interval: this.interval
      });
      this.coordinators = new window.ClusterCoordinators([], {
        interval: this.interval
      });
      this.documentStore = new window.ArangoDocuments();
      this.statisticsDescription = new window.StatisticsDescription();
      this.statisticsDescription.fetch({
        async: false
      });
      this.dbs = new window.ClusterDatabases([], {
        interval: this.interval
      });
      this.cols = new window.ClusterCollections();
      this.shards = new window.ClusterShards();
      this.startUpdating();
    },

    listByAddress: function (callback) {
      var byAddress = {};
      var self = this;
      this.dbservers.byAddress(byAddress, function (res) {
        self.coordinators.byAddress(res, callback);
      });
    },

    updateCollections: function () {
      var self = this;
      var selCol = $('#selectCol');
      var dbName = $('#selectDB').find(':selected').attr('id');
      if (!dbName) {
        return;
      }
      var colName = selCol.find(':selected').attr('id');
      selCol.html('');
      this.cols.getList(dbName, function (list) {
        _.each(_.pluck(list, 'name'), function (c) {
          selCol.append('<option id="' + c + '">' + c + '</option>');
        });
        var colToSel = $('#' + colName, selCol);
        if (colToSel.length === 1) {
          colToSel.prop('selected', true);
        }
        self.updateShards();
      });
    },

    updateShards: function () {
      var dbName = $('#selectDB').find(':selected').attr('id');
      var colName = $('#selectCol').find(':selected').attr('id');
      this.shards.getList(dbName, colName, function (list) {
        $('.shardCounter').html('0');
        _.each(list, function (s) {
          $('#' + s.server + 'Shards').html(s.shards.length);
        });
      });
    },

    updateServerStatus: function (nextStep) {
      var self = this;
      var callBack = function (cls, stat, serv) {
        var id = serv;
        var type;
        var icon;
        id = id.replace(/\./g, '-');
        id = id.replace(/:/g, '_');
        icon = $('#id' + id);
        if (icon.length < 1) {
          // callback after view was unrendered
          return;
        }
        type = icon.attr('class').split(/\s+/)[1];
        icon.attr('class', cls + ' ' + type + ' ' + stat);
        if (cls === 'coordinator') {
          if (stat === 'success') {
            $('.button-gui', icon.closest('.tile')).toggleClass('button-gui-disabled', false);
          } else {
            $('.button-gui', icon.closest('.tile')).toggleClass('button-gui-disabled', true);
          }
        }
      };
      this.coordinators.getStatuses(callBack.bind(this, 'coordinator'), function () {
        self.dbservers.getStatuses(callBack.bind(self, 'dbserver'));
        nextStep();
      });
    },

    updateDBDetailList: function () {
      var self = this;
      var selDB = $('#selectDB');
      var dbName = selDB.find(':selected').attr('id');
      selDB.html('');
      this.dbs.getList(function (dbList) {
        _.each(_.pluck(dbList, 'name'), function (c) {
          selDB.append('<option id="' + c + '">' + c + '</option>');
        });
        var dbToSel = $('#' + dbName, selDB);
        if (dbToSel.length === 1) {
          dbToSel.prop('selected', true);
        }
        self.updateCollections();
      });
    },

    rerender: function () {
      var self = this;
      this.updateServerStatus(function () {
        self.getServerStatistics(function () {
          self.updateServerTime();
          self.data = self.generatePieData();
          self.renderPieChart(self.data);
          self.renderLineChart();
          self.updateDBDetailList();
        });
      });
    },

    render: function () {
      this.knownServers = [];
      delete this.hist;
      var self = this;
      this.listByAddress(function (byAddress) {
        if (Object.keys(byAddress).length === 1) {
          self.type = 'testPlan';
        } else {
          self.type = 'other';
        }
        self.updateDBDetailList();
        self.dbs.getList(function (dbList) {
          $(self.el).html(self.template.render({
            dbs: _.pluck(dbList, 'name'),
            byAddress: byAddress,
            type: self.type
          }));
          $(self.el).append(self.modal.render({}));
          self.replaceSVGs();
          /* this.loadHistory(); */
          self.getServerStatistics(function () {
            self.data = self.generatePieData();
            self.renderPieChart(self.data);
            self.renderLineChart();
            self.updateDBDetailList();
            self.startUpdating();
          });
        });
      });
    },

    generatePieData: function () {
      var pieData = [];
      var self = this;

      this.data.forEach(function (m) {
        pieData.push({
          key: m.get('name'),
          value: m.get('system').virtualSize,
          time: self.serverTime
        });
      });

      return pieData;
    },

    /*
     loadHistory : function() {
       this.hist = {}

       var self = this
       var coord = this.coordinators.findWhere({
         status: "ok"
       })

       var endpoint = coord.get("protocol")
       + "://"
       + coord.get("address")

       this.dbservers.forEach(function (dbserver) {
         if (dbserver.get("status") !== "ok") {return;}

         if (self.knownServers.indexOf(dbserver.id) === -1) {
           self.knownServers.push(dbserver.id)
         }

         var server = {
           raw: dbserver.get("address"),
           isDBServer: true,
           target: encodeURIComponent(dbserver.get("name")),
           endpoint: endpoint,
           addAuth: window.App.addAuth.bind(window.App)
         }
       })

       this.coordinators.forEach(function (coordinator) {
         if (coordinator.get("status") !== "ok") {return;}

         if (self.knownServers.indexOf(coordinator.id) === -1) {
           self.knownServers.push(coordinator.id)
         }

         var server = {
           raw: coordinator.get("address"),
           isDBServer: false,
           target: encodeURIComponent(coordinator.get("name")),
           endpoint: coordinator.get("protocol") + "://" + coordinator.get("address"),
           addAuth: window.App.addAuth.bind(window.App)
         }
       })
     },
     */

    addStatisticsItem: function (name, time, requests, snap) {
      var self = this;

      if (!self.hasOwnProperty('hist')) {
        self.hist = {};
      }

      if (!self.hist.hasOwnProperty(name)) {
        self.hist[name] = [];
      }

      var h = self.hist[name];
      var l = h.length;

      if (l === 0) {
        h.push({
          time: time,
          snap: snap,
          requests: requests,
          requestsPerSecond: 0
        });
      } else {
        var lt = h[l - 1].time;
        var tt = h[l - 1].requests;

        if (tt < requests) {
          var dt = time - lt;
          var ps = 0;

          if (dt > 0) {
            ps = (requests - tt) / dt;
          }

          h.push({
            time: time,
            snap: snap,
            requests: requests,
            requestsPerSecond: ps
          });
        }
      }
    },

    getServerStatistics: function (nextStep) {
      var self = this;
      var snap = Math.round(self.serverTime / 1000);

      this.data = undefined;

      var statCollect = new window.ClusterStatisticsCollection();
      var coord = this.coordinators.first();

      // create statistics collector for DB servers
      this.dbservers.forEach(function (dbserver) {
        if (dbserver.get('status') !== 'ok') { return; }

        if (self.knownServers.indexOf(dbserver.id) === -1) {
          self.knownServers.push(dbserver.id);
        }

        var stat = new window.Statistics({name: dbserver.id});

        stat.url = coord.get('protocol') + '://' +
        coord.get('address') +
        '/_admin/clusterStatistics?DBserver=' +
        dbserver.get('name');

        statCollect.add(stat);
      });

      // create statistics collector for coordinator
      this.coordinators.forEach(function (coordinator) {
        if (coordinator.get('status') !== 'ok') { return; }

        if (self.knownServers.indexOf(coordinator.id) === -1) {
          self.knownServers.push(coordinator.id);
        }

        var stat = new window.Statistics({name: coordinator.id});

        stat.url = coordinator.get('protocol') + '://' +
          coordinator.get('address') +
          '/_admin/statistics';

        statCollect.add(stat);
      });

      var cbCounter = statCollect.size();

      this.data = [];

      var successCB = function (m) {
        cbCounter--;
        var time = m.get('time');
        var name = m.get('name');
        var requests = m.get('http').requestsTotal;

        self.addStatisticsItem(name, time, requests, snap);
        self.data.push(m);
        if (cbCounter === 0) {
          nextStep();
        }
      };
      var errCB = function () {
        cbCounter--;
        if (cbCounter === 0) {
          nextStep();
        }
      };
      // now fetch the statistics
      statCollect.fetch(successCB, errCB);
    },

    renderPieChart: function (dataset) {
      var w = $('#clusterGraphs svg').width();
      var h = $('#clusterGraphs svg').height();
      var radius = Math.min(w, h) / 2; // change 2 to 1.4. It's hilarious.
      // var color = d3.scale.category20()
      var color = this.dygraphConfig.colors;

      var arc = d3.svg.arc() // each datapoint will create one later.
        .outerRadius(radius - 20)
        .innerRadius(0);
      var pie = d3.layout.pie()
        .sort(function (d) {
          return d.value;
        })
        .value(function (d) {
          return d.value;
        });
      d3.select('#clusterGraphs').select('svg').remove();
      var pieChartSvg = d3.select('#clusterGraphs').append('svg')
        // .attr("width", w)
        // .attr("height", h)
        .attr('class', 'clusterChart')
        .append('g') // someone to transform. Groups data.
        .attr('transform', 'translate(' + w / 2 + ',' + ((h / 2) - 10) + ')');

      var arc2 = d3.svg.arc()
        .outerRadius(radius - 2)
        .innerRadius(radius - 2);
      var slices = pieChartSvg.selectAll('.arc')
        .data(pie(dataset))
        .enter().append('g')
        .attr('class', 'slice');
      slices.append('path')
        .attr('d', arc)
        .style('fill', function (item, i) {
          return color[i % color.length];
        })
        .style('stroke', function (item, i) {
          return color[i % color.length];
        });
      slices.append('text')
        .attr('transform', function (d) { return 'translate(' + arc.centroid(d) + ')'; })
        // .attr("dy", "0.35em")
        .style('text-anchor', 'middle')
        .text(function (d) {
          var v = d.data.value / 1024 / 1024 / 1024;
          return v.toFixed(2);
        });

      slices.append('text')
        .attr('transform', function (d) { return 'translate(' + arc2.centroid(d) + ')'; })
        // .attr("dy", "1em")
        .style('text-anchor', 'middle')
        .text(function (d) { return d.data.key; });
    },

    renderLineChart: function () {
      var self = this;

      var interval = 60 * 20;
      var data = [];
      var hash = [];
      var t = Math.round(new Date().getTime() / 1000) - interval;
      var ks = self.knownServers;
      var f = function () {
        return null;
      };

      var d, h, i, j, tt, snap;

      for (i = 0; i < ks.length; ++i) {
        h = self.hist[ks[i]];

        if (h) {
          for (j = 0; j < h.length; ++j) {
            snap = h[j].snap;

            if (snap < t) {
              continue;
            }

            if (!hash.hasOwnProperty(snap)) {
              tt = new Date(snap * 1000);

              d = hash[snap] = [ tt ].concat(ks.map(f));
            } else {
              d = hash[snap];
            }

            d[i + 1] = h[j].requestsPerSecond;
          }
        }
      }

      data = [];

      Object.keys(hash).sort().forEach(function (m) {
        data.push(hash[m]);
      });

      var options = this.dygraphConfig.getDefaultConfig('clusterRequestsPerSecond');
      options.labelsDiv = $('#lineGraphLegend')[0];
      options.labels = [ 'datetime' ].concat(ks);

      self.graph = new Dygraph(
        document.getElementById('lineGraph'),
        data,
        options
      );
    },

    stopUpdating: function () {
      window.clearTimeout(this.timer);
      delete this.graph;
      this.isUpdating = false;
    },

    startUpdating: function () {
      if (this.isUpdating) {
        return;
      }

      this.isUpdating = true;

      var self = this;

      this.timer = window.setInterval(function () {
        self.rerender();
      }, this.interval);
    },

    dashboard: function (e) {
      this.stopUpdating();

      var tar = $(e.currentTarget);
      var serv = {};
      var cur;
      var coord;

      var ipPort = tar.attr('id');
      ipPort = ipPort.replace(/-/g, '.');
      ipPort = ipPort.replace(/_/g, ':');
      ipPort = ipPort.substr(2);

      serv.raw = ipPort;
      serv.isDBServer = tar.hasClass('dbserver');

      if (serv.isDBServer) {
        cur = this.dbservers.findWhere({
          address: serv.raw
        });
        coord = this.coordinators.findWhere({
          status: 'ok'
        });
        serv.endpoint = coord.get('protocol') +
          '://' +
          coord.get('address');
      } else {
        cur = this.coordinators.findWhere({
          address: serv.raw
        });
        serv.endpoint = cur.get('protocol') +
          '://' +
          cur.get('address');
      }

      serv.target = encodeURIComponent(cur.get('name'));
      window.App.serverToShow = serv;
      window.App.dashboard();
    },

    getCurrentSize: function (div) {
      if (div.substr(0, 1) !== '#') {
        div = '#' + div;
      }
      var height, width;
      $(div).attr('style', '');
      height = $(div).height();
      width = $(div).width();
      return {
        height: height,
        width: width
      };
    },

    resize: function () {
      var dimensions;
      if (this.graph) {
        dimensions = this.getCurrentSize(this.graph.maindiv_.id);
        this.graph.resize(dimensions.width, dimensions.height);
      }
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, window, setTimeout, _ */
/* global arangoHelper, templateEngine */

(function () {
  'use strict';

  window.SpotlightView = Backbone.View.extend({
    template: templateEngine.createTemplate('spotlightView.ejs'),

    el: '#spotlightPlaceholder',

    displayLimit: 8,
    typeahead: null,
    callbackSuccess: null,
    callbackCancel: null,

    collections: {
      system: [],
      doc: [],
      edge: []
    },

    events: {
      'focusout #spotlight .tt-input': 'hide',
      'keyup #spotlight .typeahead': 'listenKey'
    },

    aqlKeywordsArray: [],
    aqlBuiltinFunctionsArray: [],

    aqlKeywords: 'for|return|filter|sort|limit|let|collect|asc|desc|in|into|' +
      'insert|update|remove|replace|upsert|options|with|and|or|not|' +
      'distinct|graph|outbound|inbound|any|all|none|aggregate|like|count|shortest_path',

    hide: function () {
      this.typeahead = $('#spotlight .typeahead').typeahead('destroy');
      $(this.el).hide();
    },

    listenKey: function (e) {
      if (e.keyCode === 27) {
        if (this.callbackSuccess) {
          this.callbackCancel();
        }
        this.hide();
      } else if (e.keyCode === 13) {
        if (this.callbackSuccess) {
          var string = $(this.typeahead).val();
          this.callbackSuccess(string);
          this.hide();
        }
      }
    },

    substringMatcher: function (strs) {
      return function findMatches (q, cb) {
        var matches, substrRegex;

        matches = [];

        substrRegex = new RegExp(q, 'i');

        _.each(strs, function (str) {
          if (substrRegex.test(str)) {
            matches.push(str);
          }
        });

        cb(matches);
      };
    },

    updateDatasets: function () {
      var self = this;
      this.collections = {
        system: [],
        doc: [],
        edge: []
      };

      window.App.arangoCollectionsStore.each(function (collection) {
        if (collection.get('isSystem')) {
          self.collections.system.push(collection.get('name'));
        } else if (collection.get('type') === 'document') {
          self.collections.doc.push(collection.get('name'));
        } else {
          self.collections.edge.push(collection.get('name'));
        }
      });
    },

    stringToArray: function () {
      var self = this;

      _.each(this.aqlKeywords.split('|'), function (value) {
        self.aqlKeywordsArray.push(value.toUpperCase());
      });

      // special case for keywords
      self.aqlKeywordsArray.push(true);
      self.aqlKeywordsArray.push(false);
      self.aqlKeywordsArray.push(null);
    },

    fetchKeywords: function (callback) {
      var self = this;

      $.ajax({
        type: 'GET',
        cache: false,
        url: arangoHelper.databaseUrl('/_api/aql-builtin'),
        contentType: 'application/json',
        success: function (data) {
          console.log(data);
          self.stringToArray();
          self.updateDatasets();
          _.each(data.functions, function (val) {
            self.aqlBuiltinFunctionsArray.push(val.name);
          });
          if (callback) {
            callback();
          }
        },
        error: function () {
          if (callback) {
            callback();
          }
          arangoHelper.arangoError('AQL', 'Could not fetch AQL function definition.');
        }
      });
    },

    show: function (callbackSuccess, callbackCancel, type) {
      var self = this;

      this.callbackSuccess = callbackSuccess;
      this.callbackCancel = callbackCancel;

      var continueRender = function () {
        var genHeader = function (name, icon, type) {
          var string = '<div class="header-type"><h4>' + name + '</h4>';
          if (icon) {
            string += '<span><i class="fa ' + icon + '"></i></span>';
          }
          if (type) {
            string += '<span class="type">' + type.toUpperCase() + '</span>';
          }
          string += '</div>';

          return string;
        };

        $(this.el).html(this.template.render({}));
        $(this.el).show();

        if (type === 'aql') {
          this.typeahead = $('#spotlight .typeahead').typeahead(
            {
              hint: true,
              highlight: true,
              minLength: 1
            },
            {
              name: 'Functions',
              source: self.substringMatcher(self.aqlBuiltinFunctionsArray),
              limit: self.displayLimit,
              templates: {
                header: genHeader('Functions', 'fa-code', 'aql')
              }
            },
            {
              name: 'Keywords',
              source: self.substringMatcher(self.aqlKeywordsArray),
              limit: self.displayLimit,
              templates: {
                header: genHeader('Keywords', 'fa-code', 'aql')
              }
            },
            {
              name: 'Documents',
              source: self.substringMatcher(self.collections.doc),
              limit: self.displayLimit,
              templates: {
                header: genHeader('Documents', 'fa-file-text-o', 'Collection')
              }
            },
            {
              name: 'Edges',
              source: self.substringMatcher(self.collections.edge),
              limit: self.displayLimit,
              templates: {
                header: genHeader('Edges', 'fa-share-alt', 'Collection')
              }
            },
            {
              name: 'System',
              limit: self.displayLimit,
              source: self.substringMatcher(self.collections.system),
              templates: {
                header: genHeader('System', 'fa-cogs', 'Collection')
              }
            }
          );
        } else {
          this.typeahead = $('#spotlight .typeahead').typeahead(
            {
              hint: true,
              highlight: true,
              minLength: 1
            },
            {
              name: 'Documents',
              source: self.substringMatcher(self.collections.doc),
              limit: self.displayLimit,
              templates: {
                header: genHeader('Documents', 'fa-file-text-o', 'Collection')
              }
            },
            {
              name: 'Edges',
              source: self.substringMatcher(self.collections.edge),
              limit: self.displayLimit,
              templates: {
                header: genHeader('Edges', 'fa-share-alt', 'Collection')
              }
            },
            {
              name: 'System',
              limit: self.displayLimit,
              source: self.substringMatcher(self.collections.system),
              templates: {
                header: genHeader('System', 'fa-cogs', 'Collection')
              }
            }
          );
        }

        $('#spotlight .typeahead').focus();
      }.bind(this);

      if (self.aqlBuiltinFunctionsArray.length === 0) {
        this.fetchKeywords(continueRender);
      } else {
        continueRender();
      }
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, templateEngine, $, window */
(function () {
  'use strict';
  window.StatisticBarView = Backbone.View.extend({
    el: '#statisticBar',

    events: {
      'change #arangoCollectionSelect': 'navigateBySelect',
      'click .tab': 'navigateByTab'
    },

    template: templateEngine.createTemplate('statisticBarView.ejs'),

    initialize: function (options) {
      this.currentDB = options.currentDB;
    },

    replaceSVG: function ($img) {
      var imgID = $img.attr('id');
      var imgClass = $img.attr('class');
      var imgURL = $img.attr('src');

      $.get(imgURL, function (data) {
        // Get the SVG tag, ignore the rest
        var $svg = $(data).find('svg');

        // Add replaced image's ID to the new SVG
        if (imgID === undefined) {
          $svg = $svg.attr('id', imgID);
        }
        // Add replaced image's classes to the new SVG
        if (imgClass === undefined) {
          $svg = $svg.attr('class', imgClass + ' replaced-svg');
        }

        // Remove any invalid XML tags as per http://validator.w3.org
        $svg = $svg.removeAttr('xmlns:a');

        // Replace image with new SVG
        $img.replaceWith($svg);
      }, 'xml');
    },

    render: function () {
      var self = this;
      $(this.el).html(this.template.render({
        isSystem: this.currentDB.get('isSystem')
      }));

      $('img.svg').each(function () {
        self.replaceSVG($(this));
      });
      return this;
    },

    navigateBySelect: function () {
      var navigateTo = $('#arangoCollectionSelect').find('option:selected').val();
      window.App.navigate(navigateTo, {trigger: true});
    },

    navigateByTab: function (e) {
      var tab = e.target || e.srcElement;
      var navigateTo = tab.id;
      if (navigateTo === 'links') {
        $('#link_dropdown').slideToggle(200);
        e.preventDefault();
        return;
      }
      if (navigateTo === 'tools') {
        $('#tools_dropdown').slideToggle(200);
        e.preventDefault();
        return;
      }
      window.App.navigate(navigateTo, {trigger: true});
      e.preventDefault();
    },
    handleSelectNavigation: function () {
      $('#arangoCollectionSelect').change(function () {
        var navigateTo = $(this).find('option:selected').val();
        window.App.navigate(navigateTo, {trigger: true});
      });
    },

    selectMenuItem: function (menuItem) {
      $('.navlist li').removeClass('active');
      if (menuItem) {
        $('.' + menuItem).addClass('active');
      }
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global _, Backbone, templateEngine, $, window */
(function () {
  'use strict';

  window.SupportView = Backbone.View.extend({
    el: '#content',

    template: templateEngine.createTemplate('supportView.ejs'),

    events: {
      'click .subViewNavbar .subMenuEntry': 'toggleViews'
    },

    render: function () {
      this.$el.html(this.template.render({}));
    },

    resize: function (auto) {
      if (auto) {
        $('.innerContent').css('height', 'auto');
      } else {
        $('.innerContent').height($('.centralRow').height() - 170);
      }
    },

    renderSwagger: function () {
      var path = window.location.pathname.split('/');
      var url = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/' + path[1] + '/' + path[2] + '/_admin/aardvark/api/index.html';
      $('#swagger').html('');
      $('#swagger').append(
        '<iframe src="' + url + '" style="border:none"></iframe>'
      );
    },

    toggleViews: function (e) {
      var self = this;
      var id = e.currentTarget.id.split('-')[0];
      var views = ['community', 'documentation', 'swagger'];

      _.each(views, function (view) {
        if (id !== view) {
          $('#' + view).hide();
        } else {
          if (id === 'swagger') {
            self.renderSwagger();
            $('#swagger iframe').css('height', '100%');
            $('#swagger iframe').css('width', '100%');
            $('#swagger iframe').css('margin-top', '-13px');
            self.resize();
          } else {
            self.resize(true);
          }
          $('#' + view).show();
        }
      });

      $('.subMenuEntries').children().removeClass('active');
      $('#' + id + '-support').addClass('active');
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, window, templateEngine, $ */

(function () {
  'use strict';

  window.TableView = Backbone.View.extend({
    template: templateEngine.createTemplate('tableView.ejs'),
    loading: templateEngine.createTemplate('loadingTableView.ejs'),

    initialize: function (options) {
      this.rowClickCallback = options.rowClick;
    },

    events: {
      'click .pure-table-body .pure-table-row': 'rowClick',
      'click .deleteButton': 'removeClick'
    },

    rowClick: function (event) {
      if (this.hasOwnProperty('rowClickCallback')) {
        this.rowClickCallback(event);
      }
    },

    removeClick: function (event) {
      if (this.hasOwnProperty('removeClickCallback')) {
        this.removeClickCallback(event);
        event.stopPropagation();
      }
    },

    setRowClick: function (callback) {
      this.rowClickCallback = callback;
    },

    setRemoveClick: function (callback) {
      this.removeClickCallback = callback;
    },

    render: function () {
      $(this.el).html(this.template.render({
        docs: this.collection
      }));
    },

    drawLoading: function () {
      $(this.el).html(this.loading.render({}));
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global frontendConfig, arangoHelper, Backbone, templateEngine, $, window */
(function () {
  'use strict';

  window.UserBarView = Backbone.View.extend({
    events: {
      'change #userBarSelect': 'navigateBySelect',
      'click .tab': 'navigateByTab',
      'mouseenter .dropdown': 'showDropdown',
      'mouseleave .dropdown': 'hideDropdown',
      'click #userLogoutIcon': 'userLogout',
      'click #userLogout': 'userLogout'
    },

    initialize: function (options) {
      this.userCollection = options.userCollection;
      this.userCollection.fetch({
        cache: false,
        async: true
      });
      this.userCollection.bind('change:extra', this.render.bind(this));
    },

    template: templateEngine.createTemplate('userBarView.ejs'),

    navigateBySelect: function () {
      var navigateTo = $('#arangoCollectionSelect').find('option:selected').val();
      window.App.navigate(navigateTo, {trigger: true});
    },

    navigateByTab: function (e) {
      var tab = e.target || e.srcElement;
      tab = $(tab).closest('a');
      var navigateTo = tab.attr('id');
      if (navigateTo === 'user') {
        $('#user_dropdown').slideToggle(200);
        e.preventDefault();
        return;
      }
      window.App.navigate(navigateTo, {trigger: true});
      e.preventDefault();
    },

    toggleUserMenu: function () {
      $('#userBar .subBarDropdown').toggle();
    },

    showDropdown: function () {
      $('#user_dropdown').fadeIn(1);
    },

    hideDropdown: function () {
      $('#user_dropdown').fadeOut(1);
    },

    render: function () {
      if (frontendConfig.authenticationEnabled === false) {
        return;
      }

      var self = this;

      var callback = function (error, username) {
        if (error) {
          arangoHelper.arangoErro('User', 'Could not fetch user.');
        } else {
          var img = null;
          var name = null;
          var active = false;
          var currentUser = null;
          if (username !== false) {
            currentUser = this.userCollection.findWhere({user: username});
            currentUser.set({loggedIn: true});
            name = currentUser.get('extra').name;
            img = currentUser.get('extra').img;
            active = currentUser.get('active');
            if (!img) {
              img = 'img/default_user.png';
            } else {
              img = 'https://s.gravatar.com/avatar/' + img + '?s=80';
            }
            if (!name) {
              name = '';
            }

            this.$el = $('#userBar');
            this.$el.html(this.template.render({
              img: img,
              name: name,
              username: username,
              active: active
            }));

            this.delegateEvents();
            return this.$el;
          }
        }
      }.bind(this);

      $('#userBar').on('click', function () {
        self.toggleUserMenu();
      });

      this.userCollection.whoAmI(callback);
    },

    userLogout: function () {
      var userCallback = function (error) {
        if (error) {
          arangoHelper.arangoError('User', 'Logout error');
        } else {
          this.userCollection.logout();
        }
      }.bind(this);
      this.userCollection.whoAmI(userCallback);
    }
  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global frontendConfig, window, document, Backbone, $, arangoHelper, templateEngine, Joi */
(function () {
  'use strict';

  window.UserManagementView = Backbone.View.extend({
    el: '#content',
    el2: '#userManagementThumbnailsIn',

    template: templateEngine.createTemplate('userManagementView.ejs'),

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    events: {
      'click #createUser': 'createUser',
      'click #submitCreateUser': 'submitCreateUser',
      //      "click #deleteUser"                   : "removeUser",
      //      "click #submitDeleteUser"             : "submitDeleteUser",
      //      "click .editUser"                     : "editUser",
      //      "click .icon"                         : "editUser",
      'click #userManagementThumbnailsIn .tile': 'editUser',
      'click #submitEditUser': 'submitEditUser',
      'click #userManagementToggle': 'toggleView',
      'keyup #userManagementSearchInput': 'search',
      'click #userManagementSearchSubmit': 'search',
      'click #callEditUserPassword': 'editUserPassword',
      'click #submitEditUserPassword': 'submitEditUserPassword',
      'click #submitEditCurrentUserProfile': 'submitEditCurrentUserProfile',
      'click .css-label': 'checkBoxes',
      'change #userSortDesc': 'sorting'

    },

    dropdownVisible: false,

    initialize: function () {
      var self = this;
      var callback = function (error, user) {
        if (frontendConfig.authenticationEnabled === true) {
          if (error || user === null) {
            arangoHelper.arangoError('User', 'Could not fetch user data');
          } else {
            this.currentUser = this.collection.findWhere({user: user});
          }
        }
      }.bind(this);

      // fetch collection defined in router
      this.collection.fetch({
        cache: false,
        success: function () {
          self.collection.whoAmI(callback);
        }
      });
    },

    checkBoxes: function (e) {
      // chrome bugfix
      var clicked = e.currentTarget.id;
      $('#' + clicked).click();
    },

    sorting: function () {
      if ($('#userSortDesc').is(':checked')) {
        this.collection.setSortingDesc(true);
      } else {
        this.collection.setSortingDesc(false);
      }

      if ($('#userManagementDropdown').is(':visible')) {
        this.dropdownVisible = true;
      } else {
        this.dropdownVisible = false;
      }

      this.render();
    },

    render: function (isProfile) {
      var dropdownVisible = false;
      if ($('#userManagementDropdown').is(':visible')) {
        dropdownVisible = true;
      }

      var callbackFunction = function () {
        this.collection.sort();
        $(this.el).html(this.template.render({
          collection: this.collection,
          searchString: ''
        }));

        if (dropdownVisible === true) {
          $('#userManagementDropdown2').show();
          $('#userSortDesc').attr('checked', this.collection.sortOptions.desc);
          $('#userManagementToggle').toggleClass('activated');
          $('#userManagementDropdown').show();
        }

        if (isProfile) {
          this.editCurrentUser();
        }

        arangoHelper.setCheckboxStatus('#userManagementDropdown');
      }.bind(this);

      this.collection.fetch({
        cache: false,
        success: function () {
          callbackFunction();
        }
      });

      return this;
    },

    search: function () {
      var searchInput,
        searchString,
        strLength,
        reducedCollection;

      searchInput = $('#userManagementSearchInput');
      searchString = $('#userManagementSearchInput').val();
      reducedCollection = this.collection.filter(
        function (u) {
          return u.get('user').indexOf(searchString) !== -1;
        }
      );
      $(this.el).html(this.template.render({
        collection: reducedCollection,
        searchString: searchString
      }));

      // after rendering, get the "new" element
      searchInput = $('#userManagementSearchInput');
      // set focus on end of text in input field
      strLength = searchInput.val().length;
      searchInput.focus();
      searchInput[0].setSelectionRange(strLength, strLength);
    },

    createUser: function (e) {
      e.preventDefault();
      this.createCreateUserModal();
    },

    submitCreateUser: function () {
      var self = this;
      var userName = $('#newUsername').val();
      var name = $('#newName').val();
      var userPassword = $('#newPassword').val();
      var status = $('#newStatus').is(':checked');
      if (!this.validateUserInfo(name, userName, userPassword, status)) {
        return;
      }
      var options = {
        user: userName,
        passwd: userPassword,
        active: status,
        extra: {name: name}
      };
      this.collection.create(options, {
        wait: true,
        error: function (data, err) {
          arangoHelper.parseError('User', err, data);
        },
        success: function () {
          self.updateUserManagement();
          window.modalView.hide();
        }
      });
    },

    validateUserInfo: function (name, username, pw, status) {
      if (username === '') {
        arangoHelper.arangoError('You have to define an username');
        $('#newUsername').closest('th').css('backgroundColor', 'red');
        return false;
      }
      return true;
    },

    updateUserManagement: function () {
      var self = this;
      this.collection.fetch({
        cache: false,
        success: function () {
          self.render();
        }
      });
    },

    editUser: function (e) {
      if ($(e.currentTarget).find('a').attr('id') === 'createUser') {
        return;
      }

      if ($(e.currentTarget).hasClass('tile')) {
        e.currentTarget = $(e.currentTarget).find('img');
      }

      this.collection.fetch({
        cache: false
      });
      var username = this.evaluateUserName($(e.currentTarget).attr('id'), '_edit-user');
      if (username === '') {
        username = $(e.currentTarget).attr('id');
      }

      window.App.navigate('user/' + encodeURIComponent(username), {trigger: true});
    },

    toggleView: function () {
      // apply sorting to checkboxes
      $('#userSortDesc').attr('checked', this.collection.sortOptions.desc);

      $('#userManagementToggle').toggleClass('activated');
      $('#userManagementDropdown2').slideToggle(200);
    },

    createCreateUserModal: function () {
      var buttons = [];
      var tableContent = [];

      tableContent.push(
        window.modalView.createTextEntry(
          'newUsername',
          'Username',
          '',
          false,
          'Username',
          true,
          [
            {
              rule: Joi.string().regex(/^[a-zA-Z0-9\-_]*$/),
              msg: 'Only symbols, "_" and "-" are allowed.'
            },
            {
              rule: Joi.string().required(),
              msg: 'No username given.'
            }
          ]
        )
      );
      tableContent.push(
        window.modalView.createTextEntry('newName', 'Name', '', false, 'Name', false)
      );
      tableContent.push(
        window.modalView.createPasswordEntry('newPassword', 'Password', '', false, '', false)
      );
      tableContent.push(
        window.modalView.createCheckboxEntry('newStatus', 'Active', 'active', false, true)
      );
      buttons.push(
        window.modalView.createSuccessButton('Create', this.submitCreateUser.bind(this))
      );

      window.modalView.show('modalTable.ejs', 'Create New User', buttons, tableContent);
    },

    evaluateUserName: function (str, substr) {
      if (str) {
        var index = str.lastIndexOf(substr);
        return str.substring(0, index);
      }
    },

    updateUserProfile: function () {
      var self = this;
      this.collection.fetch({
        cache: false,
        success: function () {
          self.render();
        }
      });
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global _, frontendConfig, arangoHelper, Backbone, window, templateEngine, $ */

(function () {
  'use strict';

  window.UserPermissionView = Backbone.View.extend({
    el: '#content',

    template: templateEngine.createTemplate('userPermissionView.ejs'),

    initialize: function (options) {
      this.username = options.username;
    },

    remove: function () {
      this.$el.empty().off(); /* off to unbind the events */
      this.stopListening();
      this.unbind();
      delete this.el;
      return this;
    },

    events: {
      'click #userPermissionView [type="checkbox"]': 'setPermission'
    },

    render: function () {
      var self = this;

      this.collection.fetch({
        success: function () {
          self.continueRender();
        }
      });
    },

    setPermission: function (e) {
      var checked = $(e.currentTarget).is(':checked');
      var db = $(e.currentTarget).attr('name');

      if (checked) {
        this.grantPermission(this.currentUser.get('user'), db);
      } else {
        if (db === '_system') {
          // special case, ask if user really want to revoke persmission here
          var buttons = []; var tableContent = [];

          tableContent.push(
            window.modalView.createReadOnlyEntry(
              'db-system-revoke-button',
              'Caution',
              'You are removing your permissions to _system database. Really continue?',
              undefined,
              undefined,
              false
            )
          );
          buttons.push(
            window.modalView.createSuccessButton('Revoke', this.revokePermission.bind(this, this.currentUser.get('user'), db))
          );
          buttons.push(
            window.modalView.createCloseButton('Cancel', this.rollbackInputButton.bind(this, db))
          );
          window.modalView.show('modalTable.ejs', 'Revoke _system Database Permission', buttons, tableContent);
        } else {
          this.revokePermission(this.currentUser.get('user'), db);
        }
      }
    },

    rollbackInputButton: function (name) {
      $('input[name="' + name + '"').prop('checked', 'true');
    },

    grantPermission: function (user, db) {
      $.ajax({
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(user) + '/database/' + encodeURIComponent(db)),
        contentType: 'application/json',
        data: JSON.stringify({
          grant: 'rw'
        })
      });
    },

    revokePermission: function (user, db) {
      $.ajax({
        type: 'PUT',
        url: arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(user) + '/database/' + encodeURIComponent(db)),
        contentType: 'application/json'
      });
      window.modalView.hide();
    },

    continueRender: function () {
      var self = this;

      this.currentUser = this.collection.findWhere({
        user: this.username
      });

      this.breadcrumb();

      var url = arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(self.currentUser.get('user')) + '/database');
      if (frontendConfig.db === '_system') {
        url = arangoHelper.databaseUrl('/_api/user/root/database');
      }

      // FETCH COMPLETE DB LIST
      $.ajax({
        type: 'GET',
        url: url,
        contentType: 'application/json',
        success: function (data) {
          var allDBs = data.result;

          // NOW FETCH USER PERMISSIONS
          $.ajax({
            type: 'GET',
            url: arangoHelper.databaseUrl('/_api/user/' + encodeURIComponent(self.currentUser.get('user')) + '/database'),
            // url: arangoHelper.databaseUrl("/_api/database/user/" + encodeURIComponent(this.currentUser.get("user"))),
            contentType: 'application/json',
            success: function (data) {
              var permissions = data.result;
              if (allDBs._system) {
                var arr = [];
                _.each(allDBs, function (db, name) {
                  arr.push(name);
                });
                allDBs = arr;
              }
              self.finishRender(allDBs, permissions);
            }
          });
        }
      });
    },

    finishRender: function (allDBs, permissions) {
      _.each(permissions, function (value, key) {
        if (value !== 'rw') {
          delete permissions[key];
        }
      });

      $(this.el).html(this.template.render({
        allDBs: allDBs,
        permissions: permissions
      }));
    },

    breadcrumb: function () {
      var self = this;

      if (window.App.naviView) {
        $('#subNavigationBar .breadcrumb').html(
          'User: ' + this.currentUser.get('user')
        );
        arangoHelper.buildUserSubNav(self.currentUser.get('user'), 'Permissions');
      } else {
        window.setTimeout(function () {
          self.breadcrumb();
        }, 100);
      }
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global CryptoJS, _, arangoHelper, Backbone, window $ */

(function () {
  'use strict';

  window.UserView = Backbone.View.extend({
    el: '#content',

    initialize: function (options) {
      this.username = options.username;
    },

    render: function () {
      var self = this;

      this.collection.fetch({
        success: function () {
          self.continueRender();
        }
      });
    },

    editCurrentUser: function () {
      this.createEditCurrentUserModal(
        this.currentUser.get('user'),
        this.currentUser.get('extra').name,
        this.currentUser.get('extra').img
      );
    },

    continueRender: function () {
      this.currentUser = this.collection.findWhere({
        user: this.username
      });

      this.breadcrumb();

      if (this.currentUser.get('loggedIn')) {
        this.editCurrentUser();
      } else {
        this.createEditUserModal(
          this.currentUser.get('user'),
          this.currentUser.get('extra').name,
          this.currentUser.get('active')
        );
      }
    },

    createEditUserPasswordModal: function () {
      var buttons = [];
      var tableContent = [];

      tableContent.push(
        window.modalView.createPasswordEntry(
          'newCurrentPassword',
          'New Password',
          '',
          false,
          'new password',
          false
        )
      );
      tableContent.push(
        window.modalView.createPasswordEntry(
          'confirmCurrentPassword',
          'Confirm New Password',
          '',
          false,
          'confirm new password',
          false)
      );

      buttons.push(
        window.modalView.createSuccessButton(
          'Save',
          this.submitEditUserPassword.bind(this)
        )
      );

      window.modalView.show('modalTable.ejs', 'Edit User Password', buttons, tableContent);
    },

    createEditCurrentUserModal: function (username, name, img) {
      var buttons = [];
      var tableContent = [];

      tableContent.push(
        window.modalView.createReadOnlyEntry('id_username', 'Username', username)
      );
      tableContent.push(
        window.modalView.createTextEntry('editCurrentName', 'Name', name, false, 'Name', false)
      );
      tableContent.push(
        window.modalView.createTextEntry(
          'editCurrentUserProfileImg',
          'Gravatar account (Mail)',
          img,
          'Mailaddress or its md5 representation of your gravatar account.' +
          'The address will be converted into a md5 string. ' +
          'Only the md5 string will be stored, not the mailaddress.',
          'myAccount(at)gravatar.com'
        )
      );

      buttons.push(
        window.modalView.createNotificationButton(
          'Change Password',
          this.editUserPassword.bind(this)
        )
      );
      buttons.push(
        window.modalView.createSuccessButton(
          'Save',
          this.submitEditCurrentUserProfile.bind(this)
        )
      );

      // window.modalView.show("modalTable.ejs", "Edit User Profile", buttons, tableContent)

      window.modalView.show(
        'modalTable.ejs',
        'Edit User Profile',
        buttons,
        tableContent, null, null,
        this.events, null,
        null, 'content'
      );
    },

    parseImgString: function (img) {
      // if already md5
      if (img.indexOf('@') === -1) {
        return img;
      }
      // else generate md5
      return CryptoJS.MD5(img).toString();
    },

    createEditUserModal: function (username, name, active) {
      var buttons, tableContent;
      tableContent = [
        {
          type: window.modalView.tables.READONLY,
          label: 'Username',
          value: _.escape(username)
        },
        {
          type: window.modalView.tables.TEXT,
          label: 'Name',
          value: name,
          id: 'editName',
          placeholder: 'Name'
        },
        {
          type: window.modalView.tables.CHECKBOX,
          label: 'Active',
          value: 'active',
          checked: active,
          id: 'editStatus'
        }
      ];
      buttons = [
        {
          title: 'Delete',
          type: window.modalView.buttons.DELETE,
          callback: this.submitDeleteUser.bind(this, username)
        },
        {
          title: 'Change Password',
          type: window.modalView.buttons.NOTIFICATION,
          callback: this.createEditUserPasswordModal.bind(this, username)
        },
        {
          title: 'Save',
          type: window.modalView.buttons.SUCCESS,
          callback: this.submitEditUser.bind(this, username)
        }
      ];

      window.modalView.show(
        'modalTable.ejs',
        'Edit User',
        buttons,
        tableContent, null, null,
        this.events, null,
        null, 'content'
      );
    },

    validateStatus: function (status) {
      if (status === '') {
        return false;
      }
      return true;
    },

    submitDeleteUser: function (username) {
      var toDelete = this.collection.findWhere({user: username});
      toDelete.destroy({wait: true});

      window.App.navigate('#users', {trigger: true});
    },

    submitEditCurrentUserProfile: function () {
      var name = $('#editCurrentName').val();
      var img = $('#editCurrentUserProfileImg').val();
      img = this.parseImgString(img);

      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('User', 'Could not edit user settings');
        } else {
          arangoHelper.arangoNotification('User', 'Changes confirmed.');
          this.updateUserProfile();
        }
      }.bind(this);

      this.currentUser.setExtras(name, img, callback);
      window.modalView.hide();
    },

    submitEditUserPassword: function () {
      var newPasswd = $('#newCurrentPassword').val();
      var confirmPasswd = $('#confirmCurrentPassword').val();
      $('#newCurrentPassword').val('');
      $('#confirmCurrentPassword').val('');
      // check input
      // clear all "errors"
      $('#newCurrentPassword').closest('th').css('backgroundColor', 'white');
      $('#confirmCurrentPassword').closest('th').css('backgroundColor', 'white');

      // check
      var hasError = false;

      // check confirmation
      if (newPasswd !== confirmPasswd) {
        arangoHelper.arangoError('User', 'New passwords do not match.');
        hasError = true;
      }

      if (!hasError) {
        this.currentUser.setPassword(newPasswd);
        arangoHelper.arangoNotification('User', 'Password changed.');
        window.modalView.hide();
      }
    },

    validateUsername: function (username) {
      if (username === '') {
        arangoHelper.arangoError('You have to define an username');
        $('#newUsername').closest('th').css('backgroundColor', 'red');
        return false;
      }
      if (!username.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)) {
        arangoHelper.arangoError(
          'Wrong Username', 'Username may only contain numbers, letters, _ and -'
        );
        return false;
      }
      return true;
    },

    editUserPassword: function () {
      window.modalView.hide();
      this.createEditUserPasswordModal();
    },

    validateName: function (name) {
      if (name === '') {
        return true;
      }
      if (!name.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)) {
        arangoHelper.arangoError(
          'Wrong Username', 'Username may only contain numbers, letters, _ and -'
        );
        return false;
      }
      return true;
    },

    submitEditUser: function (username) {
      var name = $('#editName').val();
      var status = $('#editStatus').is(':checked');

      if (!this.validateStatus(status)) {
        $('#editStatus').closest('th').css('backgroundColor', 'red');
        return;
      }
      if (!this.validateName(name)) {
        $('#editName').closest('th').css('backgroundColor', 'red');
        return;
      }
      var user = this.collection.findWhere({'user': username});
      user.save({'extra': {'name': name}, 'active': status}, {
        type: 'PATCH',
        success: function () {
          arangoHelper.arangoNotification('User', user.get('user') + ' updated.');
        },
        error: function () {
          arangoHelper.arangoError('User', 'Could not update ' + user.get('user') + '.');
        }
      });
    },

    breadcrumb: function () {
      var self = this;

      if (window.App.naviView) {
        $('#subNavigationBar .breadcrumb').html(
          'User: ' + this.username
        );
        arangoHelper.buildUserSubNav(self.currentUser.get('user'), 'General');
      } else {
        window.setTimeout(function () {
          self.breadcrumb();
        }, 100);
      }
    }

  });
}());

/* jshint browser: true */
/* jshint unused: false */
/* global Backbone, $, window */
/* global templateEngine */

(function () {
  'use strict';
  window.WorkMonitorView = Backbone.View.extend({
    el: '#content',
    id: '#workMonitorContent',

    template: templateEngine.createTemplate('workMonitorView.ejs'),
    table: templateEngine.createTemplate('arangoTable.ejs'),

    initialize: function () {},

    events: {
    },

    tableDescription: {
      id: 'workMonitorTable',
      titles: [
        'Type', 'Database', 'Task ID', 'Started', 'Url', 'User', 'Description', 'Method'
      ],
      rows: [],
      unescaped: [false, false, false, false, false, false, false, false]
    },

    render: function () {
      var self = this;

      this.$el.html(this.template.render({}));
      this.collection.fetch({
        success: function () {
          self.parseTableData();
          $(self.id).append(self.table.render({content: self.tableDescription}));
        }
      });
    },

    parseTableData: function () {
      var self = this;

      this.collection.each(function (model) {
        if (model.get('type') === 'AQL query') {
          var parent = model.get('parent');
          if (parent) {
            try {
              self.tableDescription.rows.push([
                model.get('type'),
                '(p) ' + parent.database,
                '(p) ' + parent.taskId,
                '(p) ' + parent.startTime,
                '(p) ' + parent.url,
                '(p) ' + parent.user,
                model.get('description'),
                '(p) ' + parent.method
              ]);
            } catch (e) {
              console.log('some parse error');
            }
          }
        } else if (model.get('type') !== 'thread') {
          self.tableDescription.rows.push([
            model.get('type'),
            model.get('database'),
            model.get('taskId'),
            model.get('startTime'),
            model.get('url'),
            model.get('user'),
            model.get('description'),
            model.get('method')
          ]);
        }
      });
    }

  });
}());

/* jshint unused: false */
/* global window, $, Backbone, document, d3 */
/* global $, arangoHelper, btoa, _, frontendConfig */

(function () {
  'use strict';

  window.Router = Backbone.Router.extend({
    toUpdate: [],
    dbServers: [],
    isCluster: undefined,
    lastRoute: undefined,

    routes: {
      '': 'cluster',
      'dashboard': 'dashboard',
      'collections': 'collections',
      'new': 'newCollection',
      'login': 'login',
      'collection/:colid/documents/:pageid': 'documents',
      'cIndices/:colname': 'cIndices',
      'cSettings/:colname': 'cSettings',
      'cInfo/:colname': 'cInfo',
      'collection/:colid/:docid': 'document',
      'shell': 'shell',
      'queries': 'query',
      'workMonitor': 'workMonitor',
      'databases': 'databases',
      'settings': 'databases',
      'services': 'applications',
      'service/:mount': 'applicationDetail',
      'graphs': 'graphManagement',
      'graphs/:name': 'showGraph',
      'users': 'userManagement',
      'user/:name': 'userView',
      'user/:name/permission': 'userPermission',
      'userProfile': 'userProfile',
      'cluster': 'cluster',
      'nodes': 'nodes',
      'shards': 'shards',
      'node/:name': 'node',
      'nodeInfo/:id': 'nodeInfo',
      'logs': 'logger',
      'helpus': 'helpUs',
      'graph/:name': 'graph',
      'graph/:name/settings': 'graphSettings',
      'support': 'support'
    },

    execute: function (callback, args) {
      if (this.lastRoute === '#queries') {
        // cleanup old canvas elements
        this.queryView.cleanupGraphs();
      }

      if (this.lastRoute === '#dasboard' || window.location.hash.substr(0, 5) === '#node') {
        // dom graph cleanup
        d3.selectAll('svg > *').remove();
      }

      if (this.lastRoute === '#logger') {
        if (this.loggerView.logLevelView) {
          this.loggerView.logLevelView.remove();
        }
        if (this.loggerView.logTopicView) {
          this.loggerView.logTopicView.remove();
        }
      }

      this.lastRoute = window.location.hash;
      // this function executes before every route call
      $('#subNavigationBar .breadcrumb').html('');
      $('#subNavigationBar .bottom').html('');
      $('#loadingScreen').hide();
      $('#content').show();
      if (callback) {
        callback.apply(this, args);
      }

      if (this.graphViewer) {
        if (this.graphViewer.graphSettingsView) {
          this.graphViewer.graphSettingsView.hide();
        }
      }
      if (this.queryView) {
        if (this.queryView.graphViewer) {
          if (this.queryView.graphViewer.graphSettingsView) {
            this.queryView.graphViewer.graphSettingsView.hide();
          }
        }
      }
    },

    listenerFunctions: {},

    listener: function (event) {
      _.each(window.App.listenerFunctions, function (func, key) {
        func(event);
      });
    },

    checkUser: function () {
      var self = this;

      if (window.location.hash === '#login') {
        return;
      }

      var startInit = function () {
        this.initOnce();

        // show hidden by default divs
        $('.bodyWrapper').show();
        $('.navbar').show();
      }.bind(this);

      var callback = function (error, user) {
        if (frontendConfig.authenticationEnabled) {
          self.currentUser = user;
          if (error || user === null) {
            if (window.location.hash !== '#login') {
              this.navigate('login', {trigger: true});
            }
          } else {
            startInit();
          }
        } else {
          startInit();
        }
      }.bind(this);

      if (frontendConfig.authenticationEnabled) {
        this.userCollection.whoAmI(callback);
      } else {
        this.initOnce();

        // show hidden by default divs
        $('.bodyWrapper').show();
        $('.navbar').show();
      }
    },

    waitForInit: function (origin, param1, param2) {
      if (!this.initFinished) {
        setTimeout(function () {
          if (!param1) {
            origin(false);
          }
          if (param1 && !param2) {
            origin(param1, false);
          }
          if (param1 && param2) {
            origin(param1, param2, false);
          }
        }, 350);
      } else {
        if (!param1) {
          origin(true);
        }
        if (param1 && !param2) {
          origin(param1, true);
        }
        if (param1 && param2) {
          origin(param1, param2, true);
        }
      }
    },

    initFinished: false,

    initialize: function () {
      // check frontend config for global conf settings
      if (frontendConfig.isCluster === true) {
        this.isCluster = true;
      }

      document.addEventListener('keyup', this.listener, false);

      // This should be the only global object
      window.modalView = new window.ModalView();

      this.foxxList = new window.FoxxCollection();
      window.foxxInstallView = new window.FoxxInstallView({
        collection: this.foxxList
      });
      window.progressView = new window.ProgressView();

      var self = this;

      this.userCollection = new window.ArangoUsers();

      this.initOnce = function () {
        this.initOnce = function () {};

        var callback = function (error, isCoordinator) {
          self = this;
          if (isCoordinator === true) {
            self.coordinatorCollection.fetch({
              success: function () {
                self.fetchDBS();
              }
            });
          }
          if (error) {
            console.log(error);
          }
        }.bind(this);

        window.isCoordinator(callback);

        if (frontendConfig.isCluster === false) {
          this.initFinished = true;
        }

        this.arangoDatabase = new window.ArangoDatabase();
        this.currentDB = new window.CurrentDatabase();

        this.arangoCollectionsStore = new window.ArangoCollections();
        this.arangoDocumentStore = new window.ArangoDocument();

        // Cluster
        this.coordinatorCollection = new window.ClusterCoordinators();

        arangoHelper.setDocumentStore(this.arangoDocumentStore);

        this.arangoCollectionsStore.fetch({
          cache: false
        });

        window.spotlightView = new window.SpotlightView({
          collection: this.arangoCollectionsStore
        });

        this.footerView = new window.FooterView({
          collection: self.coordinatorCollection
        });
        this.notificationList = new window.NotificationCollection();

        this.currentDB.fetch({
          cache: false,
          success: function () {
            self.naviView = new window.NavigationView({
              database: self.arangoDatabase,
              currentDB: self.currentDB,
              notificationCollection: self.notificationList,
              userCollection: self.userCollection,
              isCluster: self.isCluster
            });
            self.naviView.render();
          }
        });

        this.queryCollection = new window.ArangoQueries();

        this.footerView.render();

        window.checkVersion();

        this.userConfig = new window.UserConfig();
        this.userConfig.fetch();

        this.documentsView = new window.DocumentsView({
          collection: new window.ArangoDocuments(),
          documentStore: this.arangoDocumentStore,
          collectionsStore: this.arangoCollectionsStore
        });

        arangoHelper.initSigma();
      }.bind(this);

      $(window).resize(function () {
        self.handleResize();
      });

      $(window).scroll(function () {
        // self.handleScroll()
      });
    },

    handleScroll: function () {
      if ($(window).scrollTop() > 50) {
        $('.navbar > .secondary').css('top', $(window).scrollTop());
        $('.navbar > .secondary').css('position', 'absolute');
        $('.navbar > .secondary').css('z-index', '10');
        $('.navbar > .secondary').css('width', $(window).width());
      } else {
        $('.navbar > .secondary').css('top', '0');
        $('.navbar > .secondary').css('position', 'relative');
        $('.navbar > .secondary').css('width', '');
      }
    },

    cluster: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.cluster.bind(this));
        return;
      }
      if (this.isCluster === false || this.isCluster === undefined) {
        if (this.currentDB.get('name') === '_system') {
          this.routes[''] = 'dashboard';
          this.navigate('#dashboard', {trigger: true});
        } else {
          this.routes[''] = 'collections';
          this.navigate('#collections', {trigger: true});
        }
        return;
      }

      if (!this.clusterView) {
        this.clusterView = new window.ClusterView({
          coordinators: this.coordinatorCollection,
          dbServers: this.dbServers
        });
      }
      this.clusterView.render();
    },

    node: function (name, initialized) {
      this.checkUser();
      if (!initialized || this.isCluster === undefined) {
        this.waitForInit(this.node.bind(this), name);
        return;
      }
      if (this.isCluster === false) {
        this.routes[''] = 'dashboard';
        this.navigate('#dashboard', {trigger: true});
        return;
      }

      if (this.nodeView) {
        this.nodeView.remove();
      }
      this.nodeView = new window.NodeView({
        coordname: name,
        coordinators: this.coordinatorCollection,
        dbServers: this.dbServers
      });
      this.nodeView.render();
    },

    nodeInfo: function (id, initialized) {
      this.checkUser();
      if (!initialized || this.isCluster === undefined) {
        this.waitForInit(this.nodeInfo.bind(this), id);
        return;
      }
      if (this.isCluster === false) {
        this.routes[''] = 'dashboard';
        this.navigate('#dashboard', {trigger: true});
        return;
      }

      if (this.nodeInfoView) {
        this.nodeInfoView.remove();
      }
      this.nodeInfoView = new window.NodeInfoView({
        nodeId: id,
        coordinators: this.coordinatorCollection,
        dbServers: this.dbServers[0]
      });
      this.nodeInfoView.render();
    },

    shards: function (initialized) {
      this.checkUser();
      if (!initialized || this.isCluster === undefined) {
        this.waitForInit(this.shards.bind(this));
        return;
      }
      if (this.isCluster === false) {
        this.routes[''] = 'dashboard';
        this.navigate('#dashboard', {trigger: true});
        return;
      }
      if (!this.shardsView) {
        this.shardsView = new window.ShardsView({
          dbServers: this.dbServers
        });
      }
      this.shardsView.render();
    },

    nodes: function (initialized) {
      this.checkUser();
      if (!initialized || this.isCluster === undefined) {
        this.waitForInit(this.nodes.bind(this));
        return;
      }
      if (this.isCluster === false) {
        this.routes[''] = 'dashboard';
        this.navigate('#dashboard', {trigger: true});
        return;
      }
      if (this.nodesView) {
        this.nodesView.remove();
      }
      this.nodesView = new window.NodesView({
      });
      this.nodesView.render();
    },

    cNodes: function (initialized) {
      this.checkUser();
      if (!initialized || this.isCluster === undefined) {
        this.waitForInit(this.cNodes.bind(this));
        return;
      }
      if (this.isCluster === false) {
        this.routes[''] = 'dashboard';
        this.navigate('#dashboard', {trigger: true});
        return;
      }
      this.nodesView = new window.NodesView({
        coordinators: this.coordinatorCollection,
        dbServers: this.dbServers[0],
        toRender: 'coordinator'
      });
      this.nodesView.render();
    },

    dNodes: function (initialized) {
      this.checkUser();
      if (!initialized || this.isCluster === undefined) {
        this.waitForInit(this.dNodes.bind(this));
        return;
      }
      if (this.isCluster === false) {
        this.routes[''] = 'dashboard';
        this.navigate('#dashboard', {trigger: true});
        return;
      }
      if (this.dbServers.length === 0) {
        this.navigate('#cNodes', {trigger: true});
        return;
      }

      this.nodesView = new window.NodesView({
        coordinators: this.coordinatorCollection,
        dbServers: this.dbServers[0],
        toRender: 'dbserver'
      });
      this.nodesView.render();
    },

    sNodes: function (initialized) {
      this.checkUser();
      if (!initialized || this.isCluster === undefined) {
        this.waitForInit(this.sNodes.bind(this));
        return;
      }
      if (this.isCluster === false) {
        this.routes[''] = 'dashboard';
        this.navigate('#dashboard', {trigger: true});
        return;
      }

      this.scaleView = new window.ScaleView({
        coordinators: this.coordinatorCollection,
        dbServers: this.dbServers[0]
      });
      this.scaleView.render();
    },

    addAuth: function (xhr) {
      var u = this.clusterPlan.get('user');
      if (!u) {
        xhr.abort();
        if (!this.isCheckingUser) {
          this.requestAuth();
        }
        return;
      }
      var user = u.name;
      var pass = u.passwd;
      var token = user.concat(':', pass);
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(token));
    },

    logger: function (name, initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.logger.bind(this), name);
        return;
      }
      if (!this.loggerView) {
        var co = new window.ArangoLogs(
          {upto: true, loglevel: 4}
        );
        this.loggerView = new window.LoggerView({
          collection: co
        });
      }
      this.loggerView.render();
    },

    applicationDetail: function (mount, initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.applicationDetail.bind(this), mount);
        return;
      }
      var callback = function () {
        if (this.hasOwnProperty('applicationDetailView')) {
          this.applicationDetailView.remove();
        }
        this.applicationDetailView = new window.ApplicationDetailView({
          model: this.foxxList.get(decodeURIComponent(mount))
        });

        this.applicationDetailView.model = this.foxxList.get(decodeURIComponent(mount));
        this.applicationDetailView.render('swagger');
      }.bind(this);

      if (this.foxxList.length === 0) {
        this.foxxList.fetch({
          cache: false,
          success: function () {
            callback();
          }
        });
      } else {
        callback();
      }
    },

    login: function () {
      var callback = function (error, user) {
        if (!this.loginView) {
          this.loginView = new window.LoginView({
            collection: this.userCollection
          });
        }
        if (error || user === null) {
          this.loginView.render();
        } else {
          this.loginView.render(true);
        }
      }.bind(this);

      this.userCollection.whoAmI(callback);
    },

    collections: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.collections.bind(this));
        return;
      }
      var self = this;
      if (this.collectionsView) {
        this.collectionsView.remove();
      }
      this.collectionsView = new window.CollectionsView({
        collection: this.arangoCollectionsStore
      });
      this.arangoCollectionsStore.fetch({
        cache: false,
        success: function () {
          self.collectionsView.render();
        }
      });
    },

    cIndices: function (colname, initialized) {
      var self = this;

      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.cIndices.bind(this), colname);
        return;
      }
      this.arangoCollectionsStore.fetch({
        cache: false,
        success: function () {
          self.indicesView = new window.IndicesView({
            collectionName: colname,
            collection: self.arangoCollectionsStore.findWhere({
              name: colname
            })
          });
          self.indicesView.render();
        }
      });
    },

    cSettings: function (colname, initialized) {
      var self = this;

      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.cSettings.bind(this), colname);
        return;
      }
      this.arangoCollectionsStore.fetch({
        cache: false,
        success: function () {
          self.settingsView = new window.SettingsView({
            collectionName: colname,
            collection: self.arangoCollectionsStore.findWhere({
              name: colname
            })
          });
          self.settingsView.render();
        }
      });
    },

    cInfo: function (colname, initialized) {
      var self = this;

      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.cInfo.bind(this), colname);
        return;
      }
      this.arangoCollectionsStore.fetch({
        cache: false,
        success: function () {
          self.infoView = new window.InfoView({
            collectionName: colname,
            collection: self.arangoCollectionsStore.findWhere({
              name: colname
            })
          });
          self.infoView.render();
        }
      });
    },

    documents: function (colid, pageid, initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.documents.bind(this), colid, pageid);
        return;
      }
      if (this.documentsView) {
        this.documentsView.unbindEvents();
      }
      if (!this.documentsView) {
        this.documentsView = new window.DocumentsView({
          collection: new window.ArangoDocuments(),
          documentStore: this.arangoDocumentStore,
          collectionsStore: this.arangoCollectionsStore
        });
      }
      this.documentsView.setCollectionId(colid, pageid);
      this.documentsView.render();
      this.documentsView.delegateEvents();
    },

    document: function (colid, docid, initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.document.bind(this), colid, docid);
        return;
      }
      var mode;
      if (this.documentView) {
        if (this.documentView.defaultMode) {
          mode = this.documentView.defaultMode;
        }
        this.documentView.remove();
      }
      this.documentView = new window.DocumentView({
        collection: this.arangoDocumentStore
      });
      this.documentView.colid = colid;
      this.documentView.defaultMode = mode;

      var doc = window.location.hash.split('/')[2];
      var test = (doc.split('%').length - 1) % 3;

      if (decodeURI(doc) !== doc && test !== 0) {
        doc = decodeURIComponent(doc);
      }
      this.documentView.docid = doc;

      this.documentView.render();

      var callback = function (error, type) {
        if (!error) {
          this.documentView.setType();
        } else {
          console.log('Error', 'Could not fetch collection type');
        }
      }.bind(this);

      arangoHelper.collectionApiType(colid, null, callback);
    },

    query: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.query.bind(this));
        return;
      }
      if (!this.queryView) {
        this.queryView = new window.QueryView({
          collection: this.queryCollection
        });
      }
      this.queryView.render();
    },

    graph: function (name, initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.graph.bind(this), name);
        return;
      }

      // TODO better manage mechanism for both gv's
      if (this.graphViewer) {
        if (this.graphViewer.graphSettingsView) {
          this.graphViewer.graphSettingsView.remove();
        }
        this.graphViewer.killCurrentGraph();
        this.graphViewer.unbind();
        this.graphViewer.remove();
      }

      this.graphViewer = new window.GraphViewer({
        name: name,
        documentStore: this.arangoDocumentStore,
        collection: new window.GraphCollection(),
        userConfig: this.userConfig
      });
      this.graphViewer.render();
    },

    graphSettings: function (name, initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.graphSettings.bind(this), name);
        return;
      }
      if (this.graphSettingsView) {
        this.graphSettingsView.remove();
      }
      this.graphSettingsView = new window.GraphSettingsView({
        name: name,
        userConfig: this.userConfig
      });
      this.graphSettingsView.render();
    },

    helpUs: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.helpUs.bind(this));
        return;
      }
      if (!this.testView) {
        this.helpUsView = new window.HelpUsView({
        });
      }
      this.helpUsView.render();
    },

    support: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.support.bind(this));
        return;
      }
      if (!this.testView) {
        this.supportView = new window.SupportView({
        });
      }
      this.supportView.render();
    },

    workMonitor: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.workMonitor.bind(this));
        return;
      }
      if (!this.workMonitorCollection) {
        this.workMonitorCollection = new window.WorkMonitorCollection();
      }
      if (!this.workMonitorView) {
        this.workMonitorView = new window.WorkMonitorView({
          collection: this.workMonitorCollection
        });
      }
      this.workMonitorView.render();
    },

    queryManagement: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.queryManagement.bind(this));
        return;
      }
      if (!this.queryManagementView) {
        this.queryManagementView = new window.QueryManagementView({
          collection: undefined
        });
      }
      this.queryManagementView.render();
    },

    databases: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.databases.bind(this));
        return;
      }

      var callback = function (error) {
        if (error) {
          arangoHelper.arangoError('DB', 'Could not get list of allowed databases');
          this.navigate('#', {trigger: true});
          $('#databaseNavi').css('display', 'none');
          $('#databaseNaviSelect').css('display', 'none');
        } else {
          if (!this.databaseView) {
            this.databaseView = new window.DatabaseView({
              users: this.userCollection,
              collection: this.arangoDatabase
            });
          }
          this.databaseView.render();
        }
      }.bind(this);

      arangoHelper.databaseAllowed(callback);
    },

    dashboard: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.dashboard.bind(this));
        return;
      }

      if (this.dashboardView === undefined) {
        this.dashboardView = new window.DashboardView({
          dygraphConfig: window.dygraphConfig,
          database: this.arangoDatabase
        });
      }
      this.dashboardView.render();
    },

    graphManagement: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.graphManagement.bind(this));
        return;
      }
      if (this.graphManagementView) {
        this.graphManagementView.undelegateEvents();
      }
      this.graphManagementView =
        new window.GraphManagementView(
          {
            collection: new window.GraphCollection(),
            collectionCollection: this.arangoCollectionsStore
          }
      );
      this.graphManagementView.render();
    },

    showGraph: function (name, initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.showGraph.bind(this), name);
        return;
      }
      if (!this.graphManagementView) {
        this.graphManagementView =
          new window.GraphManagementView(
            {
              collection: new window.GraphCollection(),
              collectionCollection: this.arangoCollectionsStore
            }
        );
        this.graphManagementView.render(name, true);
      } else {
        this.graphManagementView.loadGraphViewer(name);
      }
    },

    applications: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.applications.bind(this));
        return;
      }
      if (this.applicationsView === undefined) {
        this.applicationsView = new window.ApplicationsView({
          collection: this.foxxList
        });
      }
      this.applicationsView.reload();
    },

    handleSelectDatabase: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.handleSelectDatabase.bind(this));
        return;
      }
      this.naviView.handleSelectDatabase();
    },

    handleResize: function () {
      if (this.dashboardView) {
        this.dashboardView.resize();
      }
      if (this.graphManagementView && Backbone.history.getFragment() === 'graphs') {
        this.graphManagementView.handleResize($('#content').width());
      }
      if (this.queryView && Backbone.history.getFragment() === 'queries') {
        this.queryView.resize();
      }
      if (this.naviView) {
        this.naviView.resize();
      }
      if (this.graphViewer && Backbone.history.getFragment().indexOf('graph') > -1) {
        this.graphViewer.resize();
      }
      if (this.documentsView && Backbone.history.getFragment().indexOf('documents') > -1) {
        this.documentsView.resize();
      }
      if (this.documentView && Backbone.history.getFragment().indexOf('collection') > -1) {
        this.documentView.resize();
      }
    },

    userPermission: function (name, initialized) {
      this.checkUser();
      if (initialized || initialized === null) {
        if (this.userPermissionView) {
          this.userPermissionView.remove();
        }

        this.userPermissionView = new window.UserPermissionView({
          collection: this.userCollection,
          databases: this.arangoDatabase,
          username: name
        });

        this.userPermissionView.render();
      } else if (initialized === false) {
        this.waitForInit(this.userPermissionView.bind(this), name);
        return;
      }
    },

    userView: function (name, initialized) {
      this.checkUser();
      if (initialized || initialized === null) {
        this.userView = new window.UserView({
          collection: this.userCollection,
          username: name
        });
        this.userView.render();
      } else if (initialized === false) {
        this.waitForInit(this.userView.bind(this), name);
      }
    },

    userManagement: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.userManagement.bind(this));
        return;
      }
      if (this.userManagementView) {
        this.userManagementView.remove();
      }

      this.userManagementView = new window.UserManagementView({
        collection: this.userCollection
      });
      this.userManagementView.render();
    },

    userProfile: function (initialized) {
      this.checkUser();
      if (!initialized) {
        this.waitForInit(this.userProfile.bind(this));
        return;
      }
      if (!this.userManagementView) {
        this.userManagementView = new window.UserManagementView({
          collection: this.userCollection
        });
      }
      this.userManagementView.render(true);
    },

    fetchDBS: function (callback) {
      var self = this;
      var cb = false;

      this.coordinatorCollection.each(function (coordinator) {
        self.dbServers.push(
          new window.ClusterServers([], {
            host: coordinator.get('address')
          })
        );
      });

      this.initFinished = true;

      _.each(this.dbServers, function (dbservers) {
        dbservers.fetch({
          success: function () {
            if (cb === false) {
              if (callback) {
                callback();
                cb = true;
              }
            }
          }
        });
      });
    },

    getNewRoute: function (host) {
      return 'http://' + host;
    },

    registerForUpdate: function (o) {
      this.toUpdate.push(o);
      o.updateUrl();
    }

  });
}());

/* jshint unused: false */
/* global $, window, navigator, _, arangoHelper */
(function () {
  'use strict';

  /*
  var isVersionCheckEnabled = function (cb) {
    $.ajax({
      type: 'GET',
      url: arangoHelper.databaseUrl('/_admin/aardvark/shouldCheckVersion'),
      success: function (data) {
        if (data === true) {
          cb();
        }
      }
    });
  };
  */

  var showInterface = function (currentVersion, json) {
    var buttons = [];

    buttons.push(window.modalView.createSuccessButton('Download Page', function () {
      window.open('https://www.arangodb.com/download', '_blank');
      window.modalView.hide();
    }));

    var infos = [];
    var cEntry = window.modalView.createReadOnlyEntry.bind(window.modalView);
    infos.push(cEntry('current', 'Current', currentVersion.toString()));

    if (json.major) {
      infos.push(cEntry('major', 'Major', json.major.version));
    }
    if (json.minor) {
      infos.push(cEntry('minor', 'Minor', json.minor.version));
    }
    if (json.bugfix) {
      infos.push(cEntry('bugfix', 'Bugfix', json.bugfix.version));
    }

    window.modalView.show(
      'modalTable.ejs', 'New Version Available', buttons, infos
    );
  };

  /*
  var getInformation = function () {
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browserName = navigator.appName;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset,verOffset,ix;

    if ((verOffset = nAgt.indexOf('Opera')) !== -1) {
      browserName = 'Opera';
      fullVersion = nAgt.substring(verOffset + 6);
      if ((verOffset = nAgt.indexOf('Version')) !== -1) {
        fullVersion = nAgt.substring(verOffset + 8);
      }
    } else if ((verOffset = nAgt.indexOf('MSIE')) !== -1) {
      browserName = 'Microsoft Internet Explorer';
      fullVersion = nAgt.substring(verOffset + 5);
    } else if ((verOffset = nAgt.indexOf('Chrome')) !== -1) {
      browserName = 'Chrome';
      fullVersion = nAgt.substring(verOffset + 7);
    } else if ((verOffset = nAgt.indexOf('Safari')) !== -1) {
      browserName = 'Safari';
      fullVersion = nAgt.substring(verOffset + 7);
      if ((verOffset = nAgt.indexOf('Version')) !== -1) {
        fullVersion = nAgt.substring(verOffset + 8);
      }
    } else if ((verOffset = nAgt.indexOf('Firefox')) !== -1) {
      browserName = 'Firefox';
      fullVersion = nAgt.substring(verOffset + 8);
    } else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
      browserName = nAgt.substring(nameOffset, verOffset);
      fullVersion = nAgt.substring(verOffset + 1);
      if (browserName.toLowerCase() === browserName.toUpperCase()) {
        browserName = navigator.appName;
      }
    }
    if ((ix = fullVersion.indexOf(';')) !== -1) {
      fullVersion = fullVersion.substring(0, ix);
    }
    if ((ix = fullVersion.indexOf(' ')) !== -1) {
      fullVersion = fullVersion.substring(0, ix);
    }

    majorVersion = parseInt('' + fullVersion, 10);

    if (isNaN(majorVersion)) {
      fullVersion = '' + parseFloat(navigator.appVersion);
      majorVersion = parseInt(navigator.appVersion, 10);
    }

    return {
      browserName: browserName,
      fullVersion: fullVersion,
      majorVersion: majorVersion,
      appName: navigator.appName,
      userAgent: navigator.userAgent
    };
  };
  */

  /*
  var getOS = function () {
    var OSName = 'Unknown OS';
    if (navigator.appVersion.indexOf('Win') !== -1) {
      OSName = 'Windows';
    }
    if (navigator.appVersion.indexOf('Mac') !== -1) {
      OSName = 'MacOS';
    }
    if (navigator.appVersion.indexOf('X11') !== -1) {
      OSName = 'UNIX';
    }
    if (navigator.appVersion.indexOf('Linux') !== -1) {
      OSName = 'Linux';
    }

    return OSName;
  };
  */

  window.checkVersion = function () {
    // this checks for version updates
    $.ajax({
      type: 'GET',
      cache: false,
      url: arangoHelper.databaseUrl('/_api/version'),
      contentType: 'application/json',
      processData: false,
      async: true,
      success: function (data) {
        var currentVersion =
        window.versionHelper.fromString(data.version);

        $('.navbar #currentVersion').html(
          data.version.substr(0, 7) + '<i class="fa fa-check-circle"></i>'
        );

        window.parseVersions = function (json) {
          if (_.isEmpty(json)) {
            $('#currentVersion').addClass('up-to-date');
            return; // no new version.
          }
          $('#currentVersion').addClass('out-of-date');
          $('#currentVersion .fa').removeClass('fa-check-circle').addClass('fa-exclamation-circle');
          $('#currentVersion').click(function () {
            showInterface(currentVersion, json);
          });
        // isVersionCheckEnabled(showInterface.bind(window, currentVersion, json))
        };

        // TODO: append to url below
        /*
        var browserInfo = getInformation()
        console.log(browserInfo)
        console.log(encodeURIComponent(JSON.stringify(browserInfo)))

        var osInfo = getOS()
        console.log(osInfo)
        */

        $.ajax({
          type: 'GET',
          async: true,
          crossDomain: true,
          timeout: 3000,
          dataType: 'jsonp',
          url: 'https://www.arangodb.com/repositories/versions.php' +
            '?jsonp=parseVersions&version=' + encodeURIComponent(currentVersion.toString())
        });
      }
    });
  };
}());

/* jshint unused: false */
/* global window, $, Backbone, document */

(function () {
  'use strict';
  // We have to start the app only in production mode, not in test mode
  if (!window.hasOwnProperty('TEST_BUILD')) {
    $(document).ajaxSend(function (event, jqxhr, settings) {
      var currentJwt = window.arangoHelper.getCurrentJwt();
      if (currentJwt) {
        jqxhr.setRequestHeader('Authorization', 'bearer ' + currentJwt);
      }
    });

    $(document).ready(function () {
      window.App = new window.Router();
      Backbone.history.start();
      window.App.handleResize();
    });

    // create only this one global event listener
    $(document).click(function (e) {
      e.stopPropagation();

      // hide user info dropdown if out of focus
      if (!$(e.target).hasClass('subBarDropdown') &&
        !$(e.target).hasClass('dropdown-header') &&
        !$(e.target).hasClass('dropdown-footer') &&
        !$(e.target).hasClass('toggle')) {
        if ($('#userInfo').is(':visible')) {
          $('.subBarDropdown').hide();
        }
      }
    });
  }
}());
