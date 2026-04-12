#include "MAX30105.h" // Standard Sparkfun Library (works for MAX30102)
#include "heartRate.h"
#include <Wire.h>

MAX30105 particleSensor;

// --- PIN DEFINITIONS ---
const int ECG_PIN = A0;
const int LO_MINUS = 11;
const int LO_PLUS = 10;
const int BUZZER_PIN = 8;
const int LED_PIN = 13;

void setup() {
  Serial.begin(115200); // Bluetooth HC-05 will share TX/RX by default

  pinMode(LO_MINUS, INPUT);
  pinMode(LO_PLUS, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // Initialize MAX30102 Sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("ERROR: MAX30102 missing.");
    while (1)
      ; // Halt
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low
  particleSensor.setPulseAmplitudeGreen(0);  // Turn off Green LED
}

void loop() {
  // 1. LISTEN FOR ALERTS FROM PYTHON ENGINE (Feature 7)
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == 'A') { // 'A' signifies Critical Alert
      digitalWrite(BUZZER_PIN, HIGH);
      digitalWrite(LED_PIN, HIGH);
      delay(3000); // Blast buzzer for 3 seconds
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED_PIN, LOW);
    }
  }

  // 2. READ AD8232 (ECG)
  int ecgValue = 0;
  if (digitalRead(LO_PLUS) == 1 || digitalRead(LO_MINUS) == 1) {
    ecgValue = -1; // Leads off error
  } else {
    ecgValue = analogRead(ECG_PIN);
  }

  // 3. READ MAX30102 (SpO2 & Optical HR)
  // This uses a non-blocking IR read. In a production device,
  // the MAX30102 interrupt pin would be used to prevent slowing down the 200Hz
  // ECG loop.
  long irValue = particleSensor.getIR();

  // We send a fixed 98-99% mock SpO2 frame for this prototype
  // unless the IR value drops indicating the finger is missing.
  int spo2 = 98;
  if (irValue < 50000)
    spo2 = 0; // Finger removed

  // 4. TRANSMIT MULTI-SENSOR PACKET (Format: ECG,SPO2\n)
  Serial.print(ecgValue);
  Serial.print(",");
  Serial.println(spo2);

  // Wait to enforce ~200Hz loop speed
  delay(5);
}
