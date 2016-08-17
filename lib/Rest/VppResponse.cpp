///////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2014-2016 ArangoDB GmbH, Cologne, Germany
/// Copyright 2004-2014 triAGENS GmbH, Cologne, Germany
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
/// @author Dr. Frank Celler
/// @author Achim Brandt
////////////////////////////////////////////////////////////////////////////////

#include "VppResponse.h"

#include <velocypack/Builder.h>
#include <velocypack/Dumper.h>
#include <velocypack/Options.h>
#include <velocypack/velocypack-aliases.h>

#include "Basics/Exceptions.h"
#include "Basics/StringBuffer.h"
#include "Basics/StringUtils.h"
#include "Basics/VPackStringBufferAdapter.h"
#include "Basics/VelocyPackDumper.h"
#include "Basics/tri-strings.h"
#include "Meta/conversion.h"
#include "Rest/VppRequest.h"

using namespace arangodb;
using namespace arangodb::basics;

bool VppResponse::HIDE_PRODUCT_HEADER = false;

VppResponse::VppResponse(ResponseCode code, uint64_t id)
    : GeneralResponse(code), _header(nullptr), _payload(), _messageID(id) {
  _contentType = ContentType::VPACK;
  _connectionType = CONNECTION_KEEP_ALIVE;
}

void VppResponse::reset(ResponseCode code) {
  _responseCode = code;
  _headers.clear();
  _connectionType = CONNECTION_KEEP_ALIVE;
  _contentType = ContentType::TEXT;
  _generateBody = false;  // payload has to be set
}

void VppResponse::setPayload(ContentType contentType,
                             arangodb::velocypack::Slice const& slice,
                             bool generateBody, VPackOptions const& options) {
  if (generateBody) {
    _generateBody = true;
    _payload.append(slice.startAs<char>(),
                    std::distance(slice.begin(), slice.end()));
  }
};

VPackMessageNoOwnBuffer VppResponse::prepareForNetwork() {
  VPackBuilder builder;
  builder.openObject();
  builder.add("version", VPackValue(int(1)));
  builder.add("type", VPackValue(int(1)));  // 2 == response
  builder.add(
      "responseCode",
      VPackValue(static_cast<int>(meta::underlyingValue(_responseCode))));
  builder.close();
  _header = builder.steal();
  return VPackMessageNoOwnBuffer(VPackSlice(_header->data()),
                                 VPackSlice(_payload.data()), _messageID,
                                 _generateBody);
}
// void VppResponse::writeHeader(basics::StringBuffer*) {}