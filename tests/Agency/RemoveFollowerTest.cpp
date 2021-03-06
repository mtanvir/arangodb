////////////////////////////////////////////////////////////////////////////////
/// @brief test case for RemoveFollower job
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2017 ArangoDB GmbH, Cologne, Germany
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
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Kaveh Vahedipour
/// @author Copyright 2017, ArangoDB GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////
#include "catch.hpp"
#include "fakeit.hpp"

#include "Agency/RemoveFollower.h"
#include "Agency/FailedLeader.h"
#include "Agency/MoveShard.h"
#include "Agency/AgentInterface.h"
#include "Agency/Node.h"
#include "lib/Basics/StringUtils.h"
#include "lib/Random/RandomGenerator.h"
#include <iostream>
#include <velocypack/Parser.h>
#include <velocypack/Slice.h>
#include <velocypack/velocypack-aliases.h>

using namespace arangodb;
using namespace arangodb::basics;
using namespace arangodb::consensus;
using namespace fakeit;

namespace arangodb {
namespace tests {
namespace remove_follower_test {

const std::string PREFIX = "arango";
const std::string DATABASE = "database";
const std::string COLLECTION = "collection1";
const std::string CLONE = "collection2";
const std::string SHARD = "s1";
const std::string SHARD_LEADER = "leader";
const std::string SHARD_FOLLOWER1 = "follower1";
const std::string SHARD_FOLLOWER2 = "follower2";
const std::string FREE_SERVER = "free";
const std::string FREE_SERVER2 = "free2";

const char *agency =
#include "RemoveFollowerTest.json"
  ;
const char *todo =
#include "RemoveFollowerTestToDo.json"
  ;


Node createNodeFromBuilder(Builder const& builder) {

  Builder opBuilder;
  { VPackObjectBuilder a(&opBuilder);
    opBuilder.add("new", builder.slice()); }  
  Node node("");
  node.handle<SET>(opBuilder.slice());
  return node;

}

Builder createBuilder(char const* c) {

  Options options;
  options.checkAttributeUniqueness = true;
  VPackParser parser(&options);
  parser.parse(c);
  
  Builder builder;
  builder.add(parser.steal()->slice());
  return builder;
  
}

Node createNode(char const* c) {
  return createNodeFromBuilder(createBuilder(c));
}

Node createRootNode() {
  return createNode(agency);
}

typedef std::function<std::unique_ptr<Builder>(
  Slice const&, std::string const&)> TestStructType;

inline static std::string typeName (Slice const& slice) {
  return std::string(slice.typeName());
}

TEST_CASE("RemoveFollower", "[agency][supervision]") {
  
  auto baseStructure = createRootNode();
  arangodb::RandomGenerator::initialize(arangodb::RandomGenerator::RandomType::MERSENNE);
    
  Builder builder;
  baseStructure.toBuilder(builder);

  std::string jobId = "1";

  write_ret_t fakeWriteResult {true, "", std::vector<bool> {true}, std::vector<index_t> {1}};
  trans_ret_t fakeTransResult {true, "", 1, 0, std::make_shared<Builder>()};
  
  SECTION("creating a job should create a job in todo") {
    Mock<AgentInterface> mockAgent;

    When(Method(mockAgent, write)).AlwaysDo([&](query_t const& q) -> write_ret_t {
        INFO(q->slice().toJson());
        auto expectedJobKey = "/arango/Target/ToDo/" + jobId;
        REQUIRE(typeName(q->slice()) == "array" );
        REQUIRE(q->slice().length() == 1);
        REQUIRE(typeName(q->slice()[0]) == "array");
        REQUIRE(q->slice()[0].length() == 1); // we always simply override! no preconditions...
        REQUIRE(typeName(q->slice()[0][0]) == "object");
        REQUIRE(q->slice()[0][0].length() == 1); // should ONLY do an entry in todo
        REQUIRE(typeName(q->slice()[0][0].get(expectedJobKey)) == "object");

        auto job = q->slice()[0][0].get(expectedJobKey);
        REQUIRE(typeName(job.get("creator")) == "string");
        REQUIRE(typeName(job.get("type")) == "string");
        CHECK(job.get("type").copyString() == "removeFollower");
        REQUIRE(typeName(job.get("database")) == "string");
        CHECK(job.get("database").copyString() == DATABASE);
        REQUIRE(typeName(job.get("collection")) == "string");
        CHECK(job.get("collection").copyString() == COLLECTION);
        REQUIRE(typeName(job.get("shard")) == "string");
        CHECK(job.get("shard").copyString() == SHARD);
        CHECK(typeName(job.get("jobId")) == "string");
        CHECK(typeName(job.get("timeCreated")) == "string");
        
        return fakeWriteResult;
      });

    When(Method(mockAgent, waitFor)).AlwaysReturn(AgentInterface::raft_commit_t::OK);
    auto& agent = mockAgent.get();
    auto  removeFollower = RemoveFollower(
      baseStructure, &agent, jobId, "unittest", DATABASE, COLLECTION, SHARD);
    
    removeFollower.create();
    
  }

  SECTION("<collection> still exists, if missing, job is finished, move to "
          "Target/Finished") {

    TestStructType createTestStructure = [&](
      Slice const& s, std::string const& path) {

      std::unique_ptr<Builder> builder;
      if (path == "/arango/Plan/Collections/" + DATABASE + "/" + COLLECTION) {
        return builder;
      }
      builder = std::make_unique<Builder>();
      
      if (s.isObject()) {
        VPackObjectBuilder b(builder.get());
        for (auto const& it: VPackObjectIterator(s)) {
          auto childBuilder = createTestStructure(it.value, path + "/" + it.key.copyString());
          if (childBuilder) {
            builder->add(it.key.copyString(), childBuilder->slice());
          }
        }
        if (path == "/arango/Target/ToDo") {
          builder->add(jobId, createBuilder(todo).slice());
        }
        builder->close();
      } else {
        builder->add(s);
      }
      
      return builder;
    };
    
    auto builder = createTestStructure(baseStructure.toBuilder().slice(), "");
    REQUIRE(builder);
    Node agency = createNodeFromBuilder(*builder);
    
    Mock<AgentInterface> mockAgent;
    When(Method(mockAgent, write)).AlwaysDo([&](query_t const& q) -> write_ret_t {
        INFO(q->slice().toJson());
        REQUIRE(typeName(q->slice()) == "array" );
        REQUIRE(q->slice().length() == 1);
        REQUIRE(typeName(q->slice()[0]) == "array");
        // we always simply override! no preconditions...
        REQUIRE(q->slice()[0].length() == 1); 
        REQUIRE(typeName(q->slice()[0][0]) == "object");
        
        auto writes = q->slice()[0][0];
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1")) == "object");
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1").get("op")) == "string");
        CHECK(writes.get("/arango/Target/ToDo/1").get("op").copyString() == "delete");
        CHECK(typeName(writes.get("/arango/Target/Finished/1")) == "object");
        return fakeWriteResult;
      });
    
    When(Method(mockAgent, waitFor)).AlwaysReturn(AgentInterface::raft_commit_t::OK);
    auto& agent = mockAgent.get();
    RemoveFollower(agency("arango"), &agent, JOB_STATUS::TODO, jobId).start();
    
  }
  
  
  SECTION("if <collection> has a non-empty distributeShardsLike attribute, the "
          "job immediately fails and is moved to Target/Failed") {

    TestStructType createTestStructure = [&](
      Slice const& s, std::string const& path) {

      std::unique_ptr<Builder> builder = std::make_unique<Builder>();
      if (s.isObject()) {
        VPackObjectBuilder b(builder.get());
        for (auto const& it: VPackObjectIterator(s)) {
          auto childBuilder =
            createTestStructure(it.value, path + "/" + it.key.copyString());
          if (childBuilder) {
            builder->add(it.key.copyString(), childBuilder->slice());
          }
        }
        if (path == "/arango/Plan/Collections/" + DATABASE + "/" + COLLECTION) {
          builder->add("distributeShardsLike", VPackValue("PENG"));
        }
        if (path == "/arango/Target/ToDo") {
          builder->add(jobId, createBuilder(todo).slice());
        }
      } else {
        builder->add(s);
      }
      return builder;

    };
    
    auto builder = createTestStructure(baseStructure.toBuilder().slice(), "");
    REQUIRE(builder);
    auto agency = createNodeFromBuilder(*builder);

    Mock<AgentInterface> mockAgent;
    When(Method(mockAgent, write)).AlwaysDo([&](query_t const& q) -> write_ret_t {
        INFO(q->slice().toJson());
        REQUIRE(typeName(q->slice()) == "array" );
        REQUIRE(q->slice().length() == 1);
        REQUIRE(typeName(q->slice()[0]) == "array");
        REQUIRE(q->slice()[0].length() == 1); // we always simply override! no preconditions...
        REQUIRE(typeName(q->slice()[0][0]) == "object");

        auto writes = q->slice()[0][0];
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1")) == "object");
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1").get("op")) == "string");
        CHECK(writes.get("/arango/Target/ToDo/1").get("op").copyString() == "delete");
        CHECK(typeName(writes.get("/arango/Target/Failed/1")) == "object");
        return fakeWriteResult;
      });
    When(Method(mockAgent, waitFor)).AlwaysReturn(AgentInterface::raft_commit_t::OK);
    auto& agent = mockAgent.get();
    RemoveFollower(agency("arango"), &agent, JOB_STATUS::TODO, jobId).start();
    
  }

  SECTION("condition (*) still holds for the mentioned collections, if not, "
          "job is finished, move to Target/Finished.") {
    
    TestStructType createTestStructure = [&](
      Slice const& s, std::string const& path) {

      std::unique_ptr<Builder> builder = std::make_unique<Builder>();
      if (s.isObject()) {
        VPackObjectBuilder b(builder.get());
        for (auto const& it: VPackObjectIterator(s)) {
          auto childBuilder =
            createTestStructure(it.value, path + "/" + it.key.copyString());
          if (childBuilder) {
            builder->add(it.key.copyString(), childBuilder->slice());
          }
        }
        if (path == "/arango/Target/ToDo") {
          builder->add(jobId, createBuilder(todo).slice());
        }
      } else {
        if (path == "/arango/Plan/Collections/" + DATABASE + "/" +
            COLLECTION + "/shards/" + SHARD) {
          VPackArrayBuilder a(builder.get());
          for (auto const& serv : VPackArrayIterator(s)) {
            if (serv.copyString() != SHARD_FOLLOWER1
                && serv.copyString() != SHARD_FOLLOWER2) {
              builder->add(serv);
            }
          }
        } else {
          builder->add(s);
        }
      }
      return builder;

    };
    
    auto builder = createTestStructure(baseStructure.toBuilder().slice(), "");
    REQUIRE(builder);
    auto agency = createNodeFromBuilder(*builder);

    Mock<AgentInterface> mockAgent;
    When(Method(mockAgent, write)).AlwaysDo([&](query_t const& q) -> write_ret_t {
        INFO(q->slice().toJson());
        REQUIRE(typeName(q->slice()) == "array" );
        REQUIRE(q->slice().length() == 1);
        REQUIRE(typeName(q->slice()[0]) == "array");
        REQUIRE(q->slice()[0].length() == 1); // we always simply override! no preconditions...
        REQUIRE(typeName(q->slice()[0][0]) == "object");

        auto writes = q->slice()[0][0];
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1")) == "object");
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1").get("op")) == "string");
        CHECK(writes.get("/arango/Target/ToDo/1").get("op").copyString() == "delete");
        CHECK(typeName(writes.get("/arango/Target/Finished/1")) == "object");
        return fakeWriteResult;
      });
    When(Method(mockAgent, waitFor)).AlwaysReturn(AgentInterface::raft_commit_t::OK);
    auto& agent = mockAgent.get();
    RemoveFollower(agency("arango"), &agent, JOB_STATUS::TODO, jobId).start();
    
  }

  SECTION("compute the list allShards of collection/shard pairs that "
          "correspond to / because of distributeShardsLike attributes with "
          "value , include / as the first pair") {

    TestStructType createTestStructure = [&](
      Slice const& s, std::string const& path) {
      
      std::unique_ptr<Builder> builder = std::make_unique<Builder>();
      if (s.isObject()) {
        
        VPackObjectBuilder b(builder.get());
        for (auto const& it: VPackObjectIterator(s)) {
          auto childBuilder =
            createTestStructure(it.value, path + "/" + it.key.copyString());
          if (childBuilder) {
            builder->add(it.key.copyString(), childBuilder->slice());
          }
        }
        if (path == "/arango/Target/ToDo") {
          builder->add(jobId, createBuilder(todo).slice());
        }
        if (path == "/arango/Plan/Collections/" + DATABASE + "/" + CLONE) {
          builder->add("distributeShardsLike", VPackValue(COLLECTION));
        }
      } else {
        builder->add(s);
      }
      return builder;
      
    };
    
    auto builder = createTestStructure(baseStructure.toBuilder().slice(), "");
    REQUIRE(builder);
    std::cout << builder->toJson() << std::endl;
    Node agency = createNodeFromBuilder(*builder);
    
    Mock<AgentInterface> mockAgent;
    When(Method(mockAgent, write)).AlwaysDo([&](query_t const& q) -> write_ret_t {
        INFO(q->slice().toJson());
        REQUIRE(typeName(q->slice()) == "array" );
        REQUIRE(q->slice().length() == 1);
        REQUIRE(typeName(q->slice()[0]) == "array");
        REQUIRE(q->slice()[0].length() == 1); // we always simply override! no preconditions...
        REQUIRE(typeName(q->slice()[0][0]) == "object");
        
        auto writes = q->slice()[0][0];
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1")) == "object");
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1").get("op")) == "string");
        CHECK(writes.get("/arango/Target/ToDo/1").get("op").copyString() == "delete");
        CHECK(writes.get("/arango/Target/Finished/1").get("collection").copyString() == COLLECTION);
        CHECK(writes.get("/arango/Target/Pending/1").get("op").copyString() == "delete");
        CHECK(typeName(writes.get("/arango/Target/Failed/1")) == "none");
        return fakeWriteResult;
      });
    When(Method(mockAgent, waitFor)).AlwaysReturn(AgentInterface::raft_commit_t::OK);
    AgentInterface &agent = mockAgent.get();
    RemoveFollower(agency("arango"), &agent, JOB_STATUS::TODO, jobId).start();

  }

  SECTION("the leader has acknowledged its leadership in Current for all "
          "these shards and at least replicationFactor - 1 servers are in sync "
          "with the leader according to Current for all shards") {
  }

  SECTION("if there is no job under Supervision/Shards/<shard> (if so, do "
          "nothing, leave job in ToDo") {
    
  }

  SECTION("All good should remove follower") {

    TestStructType createTestStructure = [&](
      Slice const& s, std::string const& path) {

      std::unique_ptr<Builder> builder = std::make_unique<Builder>();
      if (s.isObject()) {
        VPackObjectBuilder b(builder.get());
        for (auto const& it: VPackObjectIterator(s)) {
          auto childBuilder =
            createTestStructure(it.value, path + "/" + it.key.copyString());
          if (childBuilder) {
            builder->add(it.key.copyString(), childBuilder->slice());
          }
        }
        if (path == "/arango/Target/ToDo") {
          builder->add(jobId, createBuilder(todo).slice());
        }
      } else {
        builder->add(s);
      }
      return builder;

    };
    
    auto builder = createTestStructure(baseStructure.toBuilder().slice(), "");
    REQUIRE(builder);
    auto agency = createNodeFromBuilder(*builder);

    Mock<AgentInterface> mockAgent;
    When(Method(mockAgent, write)).AlwaysDo([&](query_t const& q) -> write_ret_t {
        INFO(q->slice().toJson());
        REQUIRE(typeName(q->slice()) == "array" );
        REQUIRE(q->slice().length() == 1);
        REQUIRE(typeName(q->slice()[0]) == "array");
        REQUIRE(q->slice()[0].length() == 2); // we always simply override! no preconditions...
        REQUIRE(typeName(q->slice()[0][0]) == "object");

        auto writes = q->slice()[0][0];
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1")) == "object");
        REQUIRE(typeName(writes.get("/arango/Target/ToDo/1").get("op")) == "string");
        CHECK(writes.get("/arango/Target/ToDo/1").get("op").copyString() == "delete");
        CHECK(typeName(writes.get("/arango/Target/Finished/1")) == "object");
        return fakeWriteResult;
      });
    When(Method(mockAgent, waitFor)).AlwaysReturn(AgentInterface::raft_commit_t::OK);
    auto& agent = mockAgent.get();
    RemoveFollower(agency("arango"), &agent, JOB_STATUS::TODO, jobId).start();

  }
  
};

}}}
