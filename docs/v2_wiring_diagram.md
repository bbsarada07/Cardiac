# V2 Hardware Wiring Guide 

This guide connects the AD8232 (ECG), MAX30102 (Pulse Oximeter), HC-05 (Bluetooth), and the Hardware Buzzer to an Arduino Uno/Nano.

## 1. AD8232 ECG Sensor
| AD8232 Pin | Arduino Pin | Description |
|---|---|---|
| GND | GND | Ground |
| 3.3V | 3.3V | Power (Do NOT use 5V) |
| OUTPUT | A0 | Analog Voltage Signal |
| LO- | D11 | Leads-off Detection |
| LO+ | D10 | Leads-off Detection |

## 2. MAX30102 SpO₂ Sensor (Feature 8)
*Requires I2C protocol.*
| MAX Pin | Arduino Uno Pin | Description |
|---|---|---|
| VIN | 5V | Power |
| GND | GND | Ground |
| SCL | A5 (or dedicated SCL) | I2C Clock |
| SDA | A4 (or dedicated SDA) | I2C Data |

## 3. Hardware Buzzer & LED (Feature 7)
| Component | Arduino Pin | Description |
|---|---|---|
| Active Buzzer (+) | D8 | Triggers alarm sound |
| Active Buzzer (-) | GND | Ground |
| Red LED (w/ 220Ω resistor) | D13 | Visual visual flash |

## 4. HC-05 Bluetooth Module (Feature 10)
*Allows the system to become completely wireless to a mobile app or laptop.*
| HC-05 Pin | Arduino Pin | Description |
|---|---|---|
| VCC | 5V | Power |
| GND | GND | Ground |
| TXD | RX (Pin 0) | Bluetooth send -> Arduino receive |
| RXD | TX (Pin 1) *via voltage divider* | Arduino send -> Bluetooth receive |

> **IMPORTANT BLUETOOTH NOTE:** You MUST unplug the HC-05 module's RX/TX wires when flashing/uploading code to the Arduino via USB, otherwise the upload will fail due to serial conflict!
