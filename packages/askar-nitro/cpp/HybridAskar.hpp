#include "HybridAskarSpec.hpp"

namespace margelo::nitro::askarnitro {
  class HybridAskar: public HybridAskarSpec {
  public:
    HybridAskar(): HybridObject(TAG) {}
    std::string version() override;
  };
}
