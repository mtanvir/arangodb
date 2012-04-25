////////////////////////////////////////////////////////////////////////////////
/// @brief Ahuacatl, general AST walking
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
/// @author Jan Steemann
/// @author Copyright 2012, triagens GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

#ifndef TRIAGENS_DURHAM_AHUACATL_TREE_WALKER_H
#define TRIAGENS_DURHAM_AHUACATL_TREE_WALKER_H 1

#include <BasicsC/common.h>
#include <BasicsC/strings.h>
#include <BasicsC/hashes.h>
#include <BasicsC/vector.h>
#include <BasicsC/associative.h>
#include <BasicsC/json.h>

#include "Ahuacatl/ahuacatl-parser.h"
#include "Ahuacatl/ast-node.h"

#ifdef __cplusplus
extern "C" {
#endif

// -----------------------------------------------------------------------------
// --SECTION--                                            modifiying tree walker
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// --SECTION--                                                      public types
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Ahuacatl
/// @{
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
/// @brief typedef for node visitation function
////////////////////////////////////////////////////////////////////////////////
  
typedef TRI_aql_node_t* (*TRI_aql_node_modify_visit_f)(void*, TRI_aql_node_t*);

////////////////////////////////////////////////////////////////////////////////
/// @brief tree walker container
////////////////////////////////////////////////////////////////////////////////

typedef struct TRI_aql_modify_tree_walker_s {
  void* _data;

  TRI_aql_node_modify_visit_f visitFunc;
}
TRI_aql_modify_tree_walker_t;

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                                  public functions
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Ahuacatl
/// @{
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
/// @brief create a tree walker
////////////////////////////////////////////////////////////////////////////////

TRI_aql_modify_tree_walker_t* TRI_CreateModifyTreeWalkerAql (void*, 
                                                             TRI_aql_node_modify_visit_f);

////////////////////////////////////////////////////////////////////////////////
/// @brief free a tree walker
////////////////////////////////////////////////////////////////////////////////

void TRI_FreeModifyTreeWalkerAql (TRI_aql_modify_tree_walker_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief run the tree walk
////////////////////////////////////////////////////////////////////////////////

TRI_aql_node_t* TRI_ModifyWalkTreeAql (TRI_aql_modify_tree_walker_t* const, TRI_aql_node_t*);

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                                 const tree walker
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// --SECTION--                                                      public types
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Ahuacatl
/// @{
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
/// @brief typedef for node visitation function
////////////////////////////////////////////////////////////////////////////////
  
typedef void (*TRI_aql_tree_const_visit_f)(void*, const TRI_aql_node_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief typedef for recursion function
////////////////////////////////////////////////////////////////////////////////
  
typedef void (*TRI_aql_tree_recurse_f)(void*);

////////////////////////////////////////////////////////////////////////////////
/// @brief tree walker container
////////////////////////////////////////////////////////////////////////////////

typedef struct TRI_aql_const_tree_walker_s {
  void* _data;

  TRI_aql_tree_const_visit_f preVisitFunc;
  TRI_aql_tree_const_visit_f postVisitFunc;
  TRI_aql_tree_recurse_f preRecurseFunc;
  TRI_aql_tree_recurse_f postRecurseFunc;
}
TRI_aql_const_tree_walker_t;

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                                  public functions
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Ahuacatl
/// @{
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
/// @brief create a tree walker
////////////////////////////////////////////////////////////////////////////////

TRI_aql_const_tree_walker_t* TRI_CreateConstTreeWalkerAql (void*, 
                                                           TRI_aql_tree_const_visit_f,
                                                           TRI_aql_tree_const_visit_f,
                                                           TRI_aql_tree_recurse_f,
                                                           TRI_aql_tree_recurse_f);

////////////////////////////////////////////////////////////////////////////////
/// @brief free a tree walker
////////////////////////////////////////////////////////////////////////////////

void TRI_FreeConstTreeWalkerAql (TRI_aql_const_tree_walker_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief run the tree walk
////////////////////////////////////////////////////////////////////////////////

void TRI_ConstWalkTreeAql (TRI_aql_const_tree_walker_t* const, 
                           const TRI_aql_node_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

#ifdef __cplusplus
}
#endif

#endif

// Local Variables:
// mode: outline-minor
// outline-regexp: "^\\(/// @brief\\|/// {@inheritDoc}\\|/// @addtogroup\\|// --SECTION--\\|/// @\\}\\)"
// End:
