// Cardiac Arrest Early Warning System - AD8232 Reader
// This code samples the AD8232 ECG sensor and sends data over Serial.

const int ecgPin = A0; // ECG analog output connected to A0
const int loPlusPin = 10; // LO+ connected to digital pin 10
const int loMinusPin = 11; // LO- connected to digital pin 11

unsigned long lastSampleTime = 0;
const int sampleInterval = 5; // 5ms = 200 Hz sampling rate

void setup() {
  Serial.begin(115200); // High baud rate for smooth data transfer
  
  pinMode(loPlusPin, INPUT); // Setup for leads off detection LO +
  pinMode(loMinusPin, INPUT); // Setup for leads off detection LO -
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastSampleTime >= sampleInterval) {
    lastSampleTime = currentTime;

    // Check for leads off
    if((digitalRead(loPlusPin) == 1) || (digitalRead(loMinusPin) == 1)){
      // Lead off condition. Send an unphysical value or an error code
      // We will send -1 to indicate lead off.
      Serial.println(-1);
    }
    else {
      // Read the ECG value
      int ecgValue = analogRead(ecgPin);
      
      // Output the value as a single line
      Serial.println(ecgValue);
    }
  }
}
