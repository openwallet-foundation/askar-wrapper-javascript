#include "HybridAskar.hpp"
#include "include/libaries_askar.h"

namespace margelo::nitro::askarnitro {
  std::string HybridAskar::version() {
    return askar_version();
  }
}
