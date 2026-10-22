#include <Arduino.h>

namespace {
constexpr uint32_t kSampleIntervalMs = 1000;
uint32_t lastSampleAt = 0;
uint32_t sampleNumber = 0;
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);
  randomSeed(micros());
  Serial.println(
      "EXHIBIT SIMULATION ONLY: values and outcome are fabricated; "
      "not a device test.");
  Serial.println(
      "mode,sample,weight_g,tof_distance_mm,thickness_mm,source_v,load_v,"
      "current_ma,ambient_c,surface_c,temp_rise_c,demo_result");
}

void loop() {
  const uint32_t now = millis();
  if (now - lastSampleAt < kSampleIntervalMs) {
    return;
  }
  lastSampleAt = now;
  ++sampleNumber;

  const float weightG = random(1880, 1951) / 10.0F;
  const uint16_t tofDistanceMm =
      static_cast<uint16_t>(random(180, 231));
  const float thicknessMm = random(70, 86) / 10.0F;
  const float sourceV = random(495, 511) / 100.0F;
  const float loadV = sourceV - random(1, 6) / 100.0F;
  const float currentMa = static_cast<float>(random(250, 851));
  const float ambientC = random(235, 251) / 10.0F;
  const float surfaceC = ambientC + random(1, 31) / 10.0F;
  const float temperatureRiseC = surfaceC - ambientC;

  Serial.printf(
      "SIMULATED,%lu,%.1f,%u,%.1f,%.2f,%.2f,%.0f,%.1f,%.1f,%.1f,"
      "DEMO_PASS_NOT_A_REAL_GRADE\n",
      static_cast<unsigned long>(sampleNumber), static_cast<double>(weightG),
      static_cast<unsigned int>(tofDistanceMm),
      static_cast<double>(thicknessMm), static_cast<double>(sourceV),
      static_cast<double>(loadV), static_cast<double>(currentMa),
      static_cast<double>(ambientC), static_cast<double>(surfaceC),
      static_cast<double>(temperatureRiseC));
}
