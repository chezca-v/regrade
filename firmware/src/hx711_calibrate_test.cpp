#include <Arduino.h>
#include <HX711.h>

#include "regrade_config.h"

// Interactive HX711 calibration bench test. Not used by the main firmware.
// It derives a scale factor (raw counts per gram) from a known reference
// weight, then reports live readings in grams so the factor can be checked.
// This performs no grading and makes no claim about accuracy beyond what the
// reference weight and load cell allow.
namespace {
HX711 loadCell;
bool calibrated = false;
uint32_t lastReadingAt = 0;

constexpr uint8_t AVERAGE_SAMPLES = 10;

void printInstructions() {
  Serial.println();
  Serial.println("=== HX711 calibration ===");
  Serial.println("1. Make sure the load cell platform is empty.");
  Serial.println("2. Wait for 'Taring...done.' below.");
  Serial.println("3. Place a known reference weight on the platform.");
  Serial.println("4. Type its mass in grams into the Serial Monitor input "
                 "box and press Enter (e.g. 100).");
}

bool readGramsFromSerial(float* outGrams) {
  if (!Serial.available()) {
    return false;
  }
  const String line = Serial.readStringUntil('\n');
  const float grams = line.toFloat();
  if (grams <= 0.0f) {
    Serial.println("Ignored: enter a positive number of grams.");
    return false;
  }
  *outGrams = grams;
  return true;
}
}  // namespace

void setup() {
  Serial.begin(115200);
  loadCell.begin(config::HX711_DOUT_PIN, config::HX711_SCK_PIN);

  const bool readyAtBoot = loadCell.wait_ready_timeout(1000);
  Serial.printf("HX711 startup=%s (DOUT=%u, SCK=%u)\n",
                readyAtBoot ? "ready" : "not_ready",
                static_cast<unsigned int>(config::HX711_DOUT_PIN),
                static_cast<unsigned int>(config::HX711_SCK_PIN));
  if (!readyAtBoot) {
    Serial.println("Cannot calibrate: HX711 not responding. Check wiring.");
    return;
  }

  printInstructions();
  Serial.print("Taring (keep platform empty)...");
  loadCell.set_scale();  // raw mode until calibrated
  loadCell.tare(20);     // average 20 reads as the zero offset
  Serial.println("done.");
  Serial.println("Now place the reference weight and type its grams.");
}

void loop() {
  if (!loadCell.is_ready()) {
    return;
  }

  if (!calibrated) {
    float referenceGrams = 0.0f;
    if (readGramsFromSerial(&referenceGrams)) {
      const long rawWithWeight = loadCell.get_value(AVERAGE_SAMPLES);
      const float scale = static_cast<float>(rawWithWeight) / referenceGrams;
      if (scale == 0.0f || isnan(scale)) {
        Serial.println("Calibration failed: raw reading was zero. Check "
                       "the load cell is actually under the weight.");
        return;
      }
      loadCell.set_scale(scale);
      calibrated = true;
      Serial.printf("Calibrated: raw=%ld for %.2f g -> scale=%.4f "
                    "counts/gram\n",
                    rawWithWeight, static_cast<double>(referenceGrams),
                    static_cast<double>(scale));
      Serial.println("Remove the reference weight to confirm it reads "
                     "close to 0 g.");
      Serial.println("Live readings:");
    }
    return;
  }

  if (millis() - lastReadingAt < 300) {
    return;
  }
  lastReadingAt = millis();

  const float grams = loadCell.get_units(AVERAGE_SAMPLES);
  Serial.printf("HX711 mass_g=%.1f mass_kg=%.4f\n",
                static_cast<double>(grams),
                static_cast<double>(grams) / 1000.0);
}
