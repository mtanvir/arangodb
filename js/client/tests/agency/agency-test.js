/*jshint globalstrict:false, strict:false */
/*global assertEqual, assertNotEqual,
  print, print_plain, COMPARE_STRING, NORMALIZE_STRING,
  help, start_pager, stop_pager, start_pretty_print, stop_pretty_print, start_color_print, stop_color_print */

////////////////////////////////////////////////////////////////////////////////
/// @brief tests for client-specific functionality
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2010-2012 triagens GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is triAGENS GmbH, Cologne, Germany
///
/// @author Max Neunhoeffer
/// @author Copyright 2012, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

var jsunity = require("jsunity");
var db = require("@arangodb").db;

////////////////////////////////////////////////////////////////////////////////
/// @brief test suite
////////////////////////////////////////////////////////////////////////////////

function agencyTestSuite () {
  'use strict';

////////////////////////////////////////////////////////////////////////////////
/// @brief the agency servers
////////////////////////////////////////////////////////////////////////////////

  var agencyServers = ARGUMENTS;

  return {


////////////////////////////////////////////////////////////////////////////////
/// @brief set up
////////////////////////////////////////////////////////////////////////////////

    setUp : function () {
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief tear down
////////////////////////////////////////////////////////////////////////////////

    tearDown : function () {
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test global help function
////////////////////////////////////////////////////////////////////////////////

    testWait : function () {
      require("internal").print("Hallo1", agencyServers);
      require("internal").wait(5);
      require("internal").print("Hallo1");
    }

  };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief executes the test suite
////////////////////////////////////////////////////////////////////////////////

jsunity.run(agencyTestSuite);

return jsunity.done();

