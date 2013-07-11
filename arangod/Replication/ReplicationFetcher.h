////////////////////////////////////////////////////////////////////////////////
/// @brief replication data fetcher
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2004-2013 triAGENS GmbH, Cologne, Germany
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
/// @author Jan Steemann
/// @author Copyright 2013, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

#ifndef TRIAGENS_REPLICATION_REPLICATION_FETCHER_H
#define TRIAGENS_REPLICATION_REPLICATION_FETCHER_H 1

#include "Basics/Common.h"

#include "Logger/Logger.h"
#include "VocBase/replication-applier.h"
#include "VocBase/replication-dump.h"
#include "VocBase/replication-master.h"
#include "VocBase/server-id.h"

// -----------------------------------------------------------------------------
// --SECTION--                                              forward declarations
// -----------------------------------------------------------------------------
  
struct TRI_json_s;
struct TRI_transaction_collection_s;
struct TRI_vocbase_s;
struct TRI_vocbase_col_s;

namespace triagens {

  namespace httpclient {
    class GeneralClientConnection;
    class SimpleHttpClient;
    class SimpleHttpResult;
  }
  
  namespace rest {
    class Endpoint;
  }

  namespace arango {

// -----------------------------------------------------------------------------
// --SECTION--                                                ReplicationFetcher
// -----------------------------------------------------------------------------

    class ReplicationFetcher {

// -----------------------------------------------------------------------------
// --SECTION--                                                     private types
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup ArangoDB
/// @{
////////////////////////////////////////////////////////////////////////////////

      private:

////////////////////////////////////////////////////////////////////////////////
/// @brief replication apply setup phase
////////////////////////////////////////////////////////////////////////////////

        typedef enum {
          PHASE_VALIDATE,
          PHASE_DROP,
          PHASE_CREATE,
          PHASE_DATA
        }
        setup_phase_e;

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                      constructors and destructors
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup ArangoDB
/// @{
////////////////////////////////////////////////////////////////////////////////

      public:

////////////////////////////////////////////////////////////////////////////////
/// @brief constructor
////////////////////////////////////////////////////////////////////////////////

        ReplicationFetcher (struct TRI_vocbase_s*,
                            const std::string&,
                            double);

////////////////////////////////////////////////////////////////////////////////
/// @brief destructor
////////////////////////////////////////////////////////////////////////////////
        
        ~ReplicationFetcher ();

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                                    public methods
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup ArangoDB
/// @{
////////////////////////////////////////////////////////////////////////////////

      public:

////////////////////////////////////////////////////////////////////////////////
/// @brief run method
////////////////////////////////////////////////////////////////////////////////

        int run (bool, 
                 uint64_t,
                 string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief comparator to sort collections
/// sort order is by collection type first (vertices before edges), then name 
////////////////////////////////////////////////////////////////////////////////

        static int sortCollections (const void*, const void*);

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                                   private methods
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup ArangoDB
/// @{
////////////////////////////////////////////////////////////////////////////////

      private:

////////////////////////////////////////////////////////////////////////////////
/// @brief save the current apply state
////////////////////////////////////////////////////////////////////////////////

        int saveApplyState ();

////////////////////////////////////////////////////////////////////////////////
/// @brief get chunk size for a transfer
////////////////////////////////////////////////////////////////////////////////

        uint64_t getChunkSize () const;

////////////////////////////////////////////////////////////////////////////////
/// @brief extract the collection id from JSON
////////////////////////////////////////////////////////////////////////////////

        TRI_voc_cid_t getCid (struct TRI_json_s const*) const;

////////////////////////////////////////////////////////////////////////////////
/// @brief abort any ongoing transaction
////////////////////////////////////////////////////////////////////////////////

        void abortOngoingTransaction ();

////////////////////////////////////////////////////////////////////////////////
/// @brief creates a transaction for a single operation
////////////////////////////////////////////////////////////////////////////////

        struct TRI_transaction_s* createSingleOperationTransaction (TRI_voc_cid_t,
                                                                    int*);

////////////////////////////////////////////////////////////////////////////////
/// @brief starts a transaction, based on the JSON provided
////////////////////////////////////////////////////////////////////////////////
    
        int startTransaction (struct TRI_json_s const*);

////////////////////////////////////////////////////////////////////////////////
/// @brief commits a transaction, based on the JSON provided
////////////////////////////////////////////////////////////////////////////////
    
        int commitTransaction (struct TRI_json_s const*);

////////////////////////////////////////////////////////////////////////////////
/// @brief process a document operation, based on the JSON provided
////////////////////////////////////////////////////////////////////////////////
    
        int processDocument (TRI_replication_operation_e,
                             struct TRI_json_s const*,
                             bool&,
                             string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief creates a collection, based on the JSON provided
////////////////////////////////////////////////////////////////////////////////
    
        int createCollection (struct TRI_json_s const*,
                              struct TRI_vocbase_col_s**);

////////////////////////////////////////////////////////////////////////////////
/// @brief drops a collection, based on the JSON provided
////////////////////////////////////////////////////////////////////////////////
    
        int dropCollection (struct TRI_json_s const*);

////////////////////////////////////////////////////////////////////////////////
/// @brief renames a collection, based on the JSON provided
////////////////////////////////////////////////////////////////////////////////
    
        int renameCollection (struct TRI_json_s const*);

////////////////////////////////////////////////////////////////////////////////
/// @brief creates an index, based on the JSON provided
////////////////////////////////////////////////////////////////////////////////
    
        int createIndex (struct TRI_json_s const*);

////////////////////////////////////////////////////////////////////////////////
/// @brief drops an index, based on the JSON provided
////////////////////////////////////////////////////////////////////////////////
    
        int dropIndex (struct TRI_json_s const*);

////////////////////////////////////////////////////////////////////////////////
/// @brief apply a single marker from the collection dump
////////////////////////////////////////////////////////////////////////////////

        int applyCollectionDumpMarker (struct TRI_transaction_collection_s*,
                                       TRI_replication_operation_e,
                                       const TRI_voc_key_t,
                                       struct TRI_json_s const*,
                                       string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief apply the data from a collection dump
////////////////////////////////////////////////////////////////////////////////

        int applyCollectionDump (struct TRI_transaction_collection_s*,
                                 httpclient::SimpleHttpResult*,
                                 string&,
                                 uint64_t&);

////////////////////////////////////////////////////////////////////////////////
/// @brief apply a single marker from the continuous log
////////////////////////////////////////////////////////////////////////////////

        int applyLogMarker (struct TRI_json_s const*,
                            bool&,
                            string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief apply the data from the continuous log
////////////////////////////////////////////////////////////////////////////////

        int applyLog (httpclient::SimpleHttpResult*,
                      string&,
                      uint64_t&);

////////////////////////////////////////////////////////////////////////////////
/// @brief get local replication apply state
////////////////////////////////////////////////////////////////////////////////

        int getLocalState (string&,  
                           bool);

////////////////////////////////////////////////////////////////////////////////
/// @brief get master state
////////////////////////////////////////////////////////////////////////////////

        int getMasterState (string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief get master inventory
////////////////////////////////////////////////////////////////////////////////

        int getMasterInventory (string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief incrementally fetch data from a collection
////////////////////////////////////////////////////////////////////////////////

        int handleCollectionDump (struct TRI_transaction_collection_s*,
                                  TRI_voc_tick_t,
                                  string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief handle the information about a collection
////////////////////////////////////////////////////////////////////////////////

        int handleCollectionInitial (struct TRI_json_s const*,
                                     struct TRI_json_s const*, 
                                     string&, 
                                     setup_phase_e);

////////////////////////////////////////////////////////////////////////////////
/// @brief handle the state response of the master
////////////////////////////////////////////////////////////////////////////////

        int handleStateResponse (struct TRI_json_s const*, 
                                 string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief handle the inventory response of the master
////////////////////////////////////////////////////////////////////////////////

        int handleInventoryResponse (struct TRI_json_s const*, string&);

////////////////////////////////////////////////////////////////////////////////
/// @brief iterate over all collections from a list and apply an action
////////////////////////////////////////////////////////////////////////////////
  
        int iterateCollections (struct TRI_json_s const*,
                                string&,
                                setup_phase_e);

////////////////////////////////////////////////////////////////////////////////
/// @brief run the continuous synchronisation
////////////////////////////////////////////////////////////////////////////////

        int runContinuous (string&,
                           uint64_t&);

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                                 private variables
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup ArangoDB
/// @{
////////////////////////////////////////////////////////////////////////////////

      private:

////////////////////////////////////////////////////////////////////////////////
/// @brief vocbase base pointer
////////////////////////////////////////////////////////////////////////////////
       
        struct TRI_vocbase_s* _vocbase;

////////////////////////////////////////////////////////////////////////////////
/// @brief information about the master state
////////////////////////////////////////////////////////////////////////////////

        TRI_replication_master_info_t _masterInfo;

////////////////////////////////////////////////////////////////////////////////
/// @brief information about the local apply state
////////////////////////////////////////////////////////////////////////////////
  
        TRI_replication_apply_state_t _applyState;

////////////////////////////////////////////////////////////////////////////////
/// @brief the endpoint (master) we're connected to
////////////////////////////////////////////////////////////////////////////////

        rest::Endpoint* _endpoint;

////////////////////////////////////////////////////////////////////////////////
/// @brief the connection to the master
////////////////////////////////////////////////////////////////////////////////

        httpclient::GeneralClientConnection* _connection;

////////////////////////////////////////////////////////////////////////////////
/// @brief the http client we're using
////////////////////////////////////////////////////////////////////////////////
        
        httpclient::SimpleHttpClient* _client;

////////////////////////////////////////////////////////////////////////////////
/// @brief base url of the replication API
////////////////////////////////////////////////////////////////////////////////

        static const std::string BaseUrl;
    };

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

  }
}

#endif

// Local Variables:
// mode: outline-minor
// outline-regexp: "/// @brief\\|/// {@inheritDoc}\\|/// @addtogroup\\|/// @page\\|// --SECTION--\\|/// @\\}"
// End:
