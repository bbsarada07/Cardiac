# Hardware Setup Guide

## Components Required
- 1 x Arduino (Uno, Nano, or Mega)
- 1 x AD8232 Single Lead Heart Rate Monitor Sensor
- 3 x ECG Electrode Pads
- Jumper Wires

## Wiring Diagram

Connect the AD8232 board to the Arduino as follows:

| AD8232 Pin | Arduino Pin | Description |
| :--- | :--- | :--- |
| **GND** | GND | Ground |
| **3.3V** | 3.3V | Power Supply (Ensure it is 3.3V, avoid 5V if possible depending on your AD8232 variant) |
| **OUTPUT** | A0 | Analog Output signal |
| **LO-** | Pin 11 | Leads-off detect minus |
| **LO+** | Pin 10 | Leads-off detect plus |

## Electrode Placement
The standard 3-lead placement normally uses:
1. **Red (Right Arm - RA)**: Under right collarbone
2. **Yellow (Left Arm - LA)**: Under left collarbone
3. **Green (Right/Left Leg - RL/LL)**: Lower left abdomen (ground location)

*Note: Sensor colors might vary depending on your kit. Follow the AD8232 color code or markings.*

## Preparing the Code
1. Open the file `arduino/ad8232_read/ad8232_read.ino` in the Arduino IDE.
2. Select your Board and COM Port from `Tools`.
3. Click "Upload".
4. Close the Arduino IDE Serial Monitor before running the Python software (the Serial port can only be accessed by one program at a time).
