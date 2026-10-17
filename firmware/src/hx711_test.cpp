#include <Arduino.h>
#include <HX711.h>

#include "regrade_config.h"

namespace {
HX711 loadCell;
bool readyAtBoot = false;
uint32_t lastReadingAt = 0;
}  // namespace

void setup() {
  Serial.begin(115200);
  loadCell.begin(config::HX711_DOUT_PIN, config::HX711_SCK_PIN);
  readyAtBoot = loadCell.wait_ready_timeout(1000);

  Serial.println("ReGrade HX711-only test");
  Serial.printf("HX711 startup=%s (DOUT=%u, SCK=%u)\n",
                readyAtBoot ? "ready" : "not_ready",
                static_cast<unsigned int>(config::HX711_DOUT_PIN),
                static_cast<unsigned int>(config::HX711_SCK_PIN));
  Serial.println("Connect a load cell to test load response.");
}

void loop() {
  if (millis() - lastReadingAt < 1000) {
    return;
  }
  lastReadingAt = millis();

  if (loadCell.is_ready()) {
    Serial.printf("HX711 raw_counts=%ld\n", loadCell.read());
  } else {
    Serial.println("HX711 status=not_ready");
  }
}
