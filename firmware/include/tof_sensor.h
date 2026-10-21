#pragma once

#include <Arduino.h>
#include <Adafruit_VL53L1X.h>
#include <VL53L0X.h>
#include <Wire.h>

// Supports either sensor at the shared default address. The VL53L0X driver
// checks its model ID before writing its initialization settings, so it is
// safe to try it first and then fall back to the VL53L1X driver.
class ToFSensor {
 public:
  enum class Model : uint8_t { NONE, VL53L0X, VL53L1X };

  bool begin() {
    vl53l0x_.setTimeout(500);
    if (vl53l0x_.init()) {
      model_ = Model::VL53L0X;
      vl53l0x_.startContinuous(100);
      return true;
    }

    if (vl53l1x_.begin(0x29, &Wire) && vl53l1x_.startRanging()) {
      model_ = Model::VL53L1X;
      vl53l1x_.setTimingBudget(50);
      return true;
    }

    model_ = Model::NONE;
    return false;
  }

  bool readRangeMillimeters(uint16_t& distanceMm) {
    if (model_ == Model::VL53L0X) {
      distanceMm = vl53l0x_.readRangeContinuousMillimeters();
      return !vl53l0x_.timeoutOccurred() && distanceMm < 8190;
    }

    if (model_ == Model::VL53L1X) {
      if (!vl53l1x_.dataReady()) return false;
      const int16_t distance = vl53l1x_.distance();
      vl53l1x_.clearInterrupt();
      if (distance <= 0) return false;
      distanceMm = static_cast<uint16_t>(distance);
      return true;
    }

    return false;
  }

  Model model() const { return model_; }

  const char* modelName() const {
    switch (model_) {
      case Model::VL53L0X: return "VL53L0X";
      case Model::VL53L1X: return "VL53L1X";
      case Model::NONE: return "unknown";
    }
    return "unknown";
  }

 private:
  VL53L0X vl53l0x_;
  // Adafruit's constructor forwards irq_pin to its base class as a GPIO pin.
  // Its default -1 becomes 255 in the uint8_t argument and triggers invalid
  // GPIO writes on ESP32. GPIO26 is unused by this station and is not wired
  // to the sensor, so use it as the library's required valid placeholder.
  Adafruit_VL53L1X vl53l1x_{255, 26};
  Model model_ = Model::NONE;
};
