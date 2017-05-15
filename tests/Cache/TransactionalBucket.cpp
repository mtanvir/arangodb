////////////////////////////////////////////////////////////////////////////////
/// @brief test suite for arangodb::cache::TransactionalBucket
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
/// @author Daniel H. Larkin
/// @author Copyright 2017, ArangoDB GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

#include "Cache/TransactionalBucket.h"
#include "Basics/Common.h"

#include "catch.hpp"

#include <stdint.h>
#include <string>

using namespace arangodb::cache;

TEST_CASE("cache::TransactionalBucket", "[cache]") {
  SECTION("test locking behavior") {
    auto bucket = std::make_unique<TransactionalBucket>();
    bool success;

    // check lock without contention
    REQUIRE(!bucket->isLocked());
    success = bucket->lock(-1LL);
    REQUIRE(success);
    REQUIRE(bucket->isLocked());

    // check lock with contention
    success = bucket->lock(10LL);
    REQUIRE(!success);
    REQUIRE(bucket->isLocked());

    // check unlock
    bucket->unlock();
    REQUIRE(!bucket->isLocked());

    // check that blacklist term is updated appropriately
    REQUIRE(0ULL == bucket->_blacklistTerm);
    bucket->lock(-1LL);
    bucket->updateBlacklistTerm(1ULL);
    REQUIRE(1ULL == bucket->_blacklistTerm);
    bucket->unlock();
    REQUIRE(1ULL == bucket->_blacklistTerm);
  }

  SECTION("verify that insertion works as expected") {
    auto bucket = std::make_unique<TransactionalBucket>();
    bool success;

    uint32_t hashes[17];  // don't have to be real, but should be unique
                          // and non-zero
    uint64_t keys[17];
    uint64_t values[17];
    CachedValue* ptrs[17];
    for (size_t i = 0; i < 17; i++) {
      hashes[i] = i + 1;
      keys[i] = i;
      values[i] = i;
      ptrs[i] = CachedValue::construct(&(keys[i]), sizeof(uint64_t),
                                       &(values[i]), sizeof(uint64_t));
    }

    success = bucket->lock(-1LL);
    REQUIRE(success);

    // insert three to fill
    REQUIRE(!bucket->isFull());
    for (size_t i = 0; i < 16; i++) {
      bucket->insert(hashes[i], ptrs[i]);
      if (i < 15) {
        REQUIRE(!bucket->isFull());
      } else {
        REQUIRE(bucket->isFull());
      }
    }
    for (size_t i = 0; i < 16; i++) {
      CachedValue* res =
          bucket->find(hashes[i], ptrs[i]->key(), ptrs[i]->keySize);
      REQUIRE(res == ptrs[i]);
    }

    // check that insert is ignored if full
    bucket->insert(hashes[16], ptrs[16]);
    CachedValue* res = bucket->find(hashes[16], ptrs[16]->key(), ptrs[16]->keySize);
    REQUIRE(nullptr == res);

    bucket->unlock();

    // cleanup
    for (size_t i = 0; i < 17; i++) {
      delete ptrs[i];
    }
  }

  SECTION("verify that removal works as expected") {
    auto bucket = std::make_unique<TransactionalBucket>();
    bool success;

    uint32_t hashes[3] = {
        1, 2, 3};  // don't have to be real, but should be unique and non-zero
    uint64_t keys[3] = {0, 1, 2};
    uint64_t values[3] = {0, 1, 2};
    CachedValue* ptrs[3];
    for (size_t i = 0; i < 3; i++) {
      ptrs[i] = CachedValue::construct(&(keys[i]), sizeof(uint64_t),
                                       &(values[i]), sizeof(uint64_t));
    }

    success = bucket->lock(-1LL);
    REQUIRE(success);

    for (size_t i = 0; i < 3; i++) {
      bucket->insert(hashes[i], ptrs[i]);
    }
    for (size_t i = 0; i < 3; i++) {
      CachedValue* res =
          bucket->find(hashes[i], ptrs[i]->key(), ptrs[i]->keySize);
      REQUIRE(res == ptrs[i]);
    }

    CachedValue* res;
    res = bucket->remove(hashes[1], ptrs[1]->key(), ptrs[1]->keySize);
    REQUIRE(res == ptrs[1]);
    res = bucket->find(hashes[1], ptrs[1]->key(), ptrs[1]->keySize);
    REQUIRE(nullptr == res);
    res = bucket->remove(hashes[0], ptrs[0]->key(), ptrs[0]->keySize);
    REQUIRE(res == ptrs[0]);
    res = bucket->find(hashes[0], ptrs[0]->key(), ptrs[0]->keySize);
    REQUIRE(nullptr == res);
    res = bucket->remove(hashes[2], ptrs[2]->key(), ptrs[2]->keySize);
    REQUIRE(res == ptrs[2]);
    res = bucket->find(hashes[2], ptrs[2]->key(), ptrs[2]->keySize);
    REQUIRE(nullptr == res);

    bucket->unlock();

    // cleanup
    for (size_t i = 0; i < 3; i++) {
      delete ptrs[i];
    }
  }

  SECTION("verify that eviction works as expected") {
    auto bucket = std::make_unique<TransactionalBucket>();
    bool success;

    uint32_t hashes[17];  // don't have to be real, but should be unique
                          // and non-zero
    uint64_t keys[17];
    uint64_t values[17];
    CachedValue* ptrs[17];
    for (size_t i = 0; i < 17; i++) {
      hashes[i] = i + 1;
      keys[i] = i;
      values[i] = i;
      ptrs[i] = CachedValue::construct(&(keys[i]), sizeof(uint64_t),
                                       &(values[i]), sizeof(uint64_t));
    }

    success = bucket->lock(-1LL);
    REQUIRE(success);

    // insert three to fill
    REQUIRE(!bucket->isFull());
    for (size_t i = 0; i < 16; i++) {
      bucket->insert(hashes[i], ptrs[i]);
      if (i < 15) {
        REQUIRE(!bucket->isFull());
      } else {
        REQUIRE(bucket->isFull());
      }
    }
    for (size_t i = 0; i < 16; i++) {
      CachedValue* res =
          bucket->find(hashes[i], ptrs[i]->key(), ptrs[i]->keySize);
      REQUIRE(res == ptrs[i]);
    }

    // check that we get proper eviction candidate
    CachedValue* candidate = bucket->evictionCandidate();
    REQUIRE(candidate == ptrs[0]);
    bucket->evict(candidate, false);
    CachedValue* res = bucket->find(hashes[0], ptrs[0]->key(), ptrs[0]->keySize);
    REQUIRE(nullptr == res);
    REQUIRE(!bucket->isFull());

    // check that we still find the right candidate if not full
    candidate = bucket->evictionCandidate();
    REQUIRE(candidate == ptrs[1]);
    bucket->evict(candidate, true);
    res = bucket->find(hashes[1], ptrs[1]->key(), ptrs[1]->keySize);
    REQUIRE(nullptr == res);
    REQUIRE(!bucket->isFull());

    // check that we can insert now after eviction optimized for insertion
    bucket->insert(hashes[16], ptrs[16]);
    res = bucket->find(hashes[16], ptrs[16]->key(), ptrs[16]->keySize);
    REQUIRE(res == ptrs[16]);

    bucket->unlock();

    // cleanup
    for (size_t i = 0; i < 17; i++) {
      delete ptrs[i];
    }
  }

  SECTION("verify that blacklisting works as expected") {
    auto bucket = std::make_unique<TransactionalBucket>();
    bool success;
    CachedValue* res;

    uint32_t hashes[20];  // don't have to be real, but should be unique
                          // and non-zero
    uint64_t keys[20];
    uint64_t values[20];
    CachedValue* ptrs[20];
    for (size_t i = 0; i < 20; i++) {
      hashes[i] = i;
      keys[i] = i;
      values[i] = i;
      ptrs[i] = CachedValue::construct(&(keys[i]), sizeof(uint64_t),
                                       &(values[i]), sizeof(uint64_t));
    }
    hashes[0] = 1;

    success = bucket->lock(-1LL);
    bucket->updateBlacklistTerm(1ULL);
    REQUIRE(success);

    // insert three to fill
    REQUIRE(!bucket->isFull());
    for (size_t i = 0; i < 16; i++) {
      bucket->insert(hashes[i], ptrs[i]);
      if (i < 15) {
        REQUIRE(!bucket->isFull());
      } else {
        REQUIRE(bucket->isFull());
      }
    }
    for (size_t i = 0; i < 16; i++) {
      res = bucket->find(hashes[i], ptrs[i]->key(), ptrs[i]->keySize);
      REQUIRE(res == ptrs[i]);
    }

    // blacklist 1-4 to fill blacklist
    for (size_t i = 1; i < 14; i++) {
      bucket->blacklist(hashes[i], ptrs[i]->key(), ptrs[i]->keySize);
    }
    for (size_t i = 1; i < 14; i++) {
      REQUIRE(bucket->isBlacklisted(hashes[i]));
      res = bucket->find(hashes[i], ptrs[i]->key(), ptrs[i]->keySize);
      REQUIRE(nullptr == res);
    }
    // verify actually not fully blacklisted
    REQUIRE(!bucket->isFullyBlacklisted());
    REQUIRE(!bucket->isBlacklisted(hashes[15]));
    // verify it didn't remove matching hash with non-matching key
    res = bucket->find(hashes[0], ptrs[0]->key(), ptrs[0]->keySize);
    REQUIRE(res == ptrs[0]);

    // verify we can't insert a key with a blacklisted hash
    bucket->insert(hashes[1], ptrs[1]);
    res = bucket->find(hashes[1], ptrs[1]->key(), ptrs[1]->keySize);
    REQUIRE(nullptr == res);

    // proceed to fully blacklist
    bucket->blacklist(hashes[14], ptrs[14]->key(), ptrs[14]->keySize);
    REQUIRE(bucket->isBlacklisted(hashes[14]));
    res = bucket->find(hashes[14], ptrs[14]->key(), ptrs[14]->keySize);
    REQUIRE(nullptr == res);
    // make sure it still didn't remove non-matching key
    res = bucket->find(hashes[0], ptrs[0]->key(), ptrs[0]->keySize);
    REQUIRE(ptrs[0] == res);
    // make sure it's fully blacklisted
    REQUIRE(bucket->isFullyBlacklisted());
    REQUIRE(bucket->isBlacklisted(hashes[15]));

    bucket->unlock();

    // check that updating blacklist term clears blacklist
    bucket->lock(-1LL);
    bucket->updateBlacklistTerm(2ULL);
    REQUIRE(!bucket->isFullyBlacklisted());
    for (size_t i = 0; i < 20; i++) {
      REQUIRE(!bucket->isBlacklisted(hashes[i]));
    }
    bucket->unlock();

    // cleanup
    for (size_t i = 0; i < 20; i++) {
      delete ptrs[i];
    }
  }
}
