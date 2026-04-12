# Cardiac — BIO-FEA Cardiac Clinical Platform

A real-time cardiac arrest early-warning system combining 
first-year engineering mathematics, embedded hardware, 
a clinical desktop monitor, and a companion mobile app.

---

## The Problem

Every year millions of people die from cardiac arrest with 
no prior warning. Most of them would have survived if someone 
knew 30 minutes earlier that their heart was about to stop. 
Current medical devices only detect cardiac arrest after it 
is already happening. No portable, affordable system exists 
that can mathematically predict cardiac instability before 
it occurs.

---

## Our Solution

We built a wearable ECG monitoring system that uses 
**dynamical systems mathematics** — specifically Lyapunov 
stability analysis and ODE decay modelling — to detect 
mathematical instability in the heart's rhythm before any 
visible symptoms appear.

The system raises an alarm up to 30 minutes before a 
cardiac event, giving the patient and caregivers enough 
time to respond.

---

## How It Works

The heart's electrical rhythm follows mathematical rules. 
A healthy rhythm is mathematically stable. A rhythm about 
to fail is mathematically unstable — like a pendulum that 
starts wobbling before it falls.

We model HRV (Heart Rate Variability) using the ODE:
H(t) = H₀ · e^(−kt)

Where:
- `H₀` = baseline HRV established during personal calibration
- `k` = current decay rate calculated from live data
- `t` = time in minutes

When `k` becomes positive and grows, the system predicts 
the exact number of minutes until the critical threshold 
is reached — and raises the alarm before it gets there.

---

## Tech Stack

### Hardware
| Component | Purpose |
|---|---|
| AD8232 ECG sensor | Reads heart electrical signal |
| MAX30102 SpO2 sensor | Blood oxygen + pulse rate |
| Arduino Nano | Microcontroller — reads sensors |
| Li-Po battery 3.7V | Portable power |
| TP4056 module | Battery charging circuit |
| Active buzzer | Audio alarm on device |
| Red LED | Visual alarm indicator |
| Push button | Dismiss false alarm |
| Disposable ECG electrodes | Skin contact for ECG reading |

### Desktop Monitor (Python)
| Library | Purpose |
|---|---|
| PySerial | Read Arduino serial data |
| NumPy / SciPy | Mathematical analysis |
| PyQt5 | Real-time dashboard UI |
| firebase-admin | Push data to Firebase |
| Matplotlib | ECG and ODE graph rendering |
| Twilio | Emergency SMS alerts |

### Mobile App (React Native + Expo)
| Library | Purpose |
|---|---|
| Expo | Cross-platform mobile framework |
| Firebase Realtime Database | Live data sync from monitor |
| React Navigation | Tab and screen navigation |
| Victory Native | ECG and trend graphs |
| expo-notifications | Push notifications and alerts |
| expo-location | GPS for emergency SOS |
| AsyncStorage | Save settings locally |
| expo-print | Generate PDF session reports |

### Cloud
| Service | Purpose |
|---|---|
| Firebase Realtime Database | Live data bridge (monitor → phone) |
| Firebase patient_profile node | Synced patient data across devices |
| Twilio API | Emergency SMS delivery |

---
## System Architecture

```
AD8232 + MAX30102
         |
         v
   Arduino Nano
   (reads sensors every 10ms)
         |
         v  USB Serial
   Python main.py
         |
         |-- Signal processing and noise removal
         |-- Lyapunov stability score (0-100)
         |-- ODE decay model  H(t) = H0 x e^(-kt)
         |-- HRV analysis  (SDNN + RMSSD)
         |-- QTc detection  (Bazett formula)
         |-- Risk probability calculation
         |-- Alert system + Twilio SMS
         |
         v  every 1 second
   Firebase Realtime Database
         |
         v
   React Native Mobile App
         |
         |-- Live dashboard (stability score, HR, SpO2)
         |-- ODE decay graph (live H0 and k values)
         |-- 30-minute trend history
         |-- Plain-English notification feed
         |-- Emergency alert screen + countdown
         |-- Caregiver companion mode
         |-- PDF session report generator
```


---

## Features

### Mathematical Engine
- Lyapunov exponent → stability score (0–100)
- ODE decay model H(t) = H₀e^(−kt) with live k value
- Predictive risk window — "risk threshold in X minutes"
- HRV analysis (SDNN + RMSSD)
- QRS complex detection + QTc (Bazett formula)
- Per-user 60-second baseline calibration

### Desktop Monitor
- Live ECG waveform display
- 30-minute system trends graph
- AI pattern classification label
- Signal quality indicator
- Motion artifact filter
- Patient identity panel (synced from Firebase)
- Session history and event log (CSV)
- Emergency alert simulation
- Hardware buzzer + LED control

### Mobile App
- Live stability score circle (green → amber → red)
- Real-time metric cards (HR, HRV, SpO2, QTc, Risk %)
- ODE decay curve graph with live H₀ and k values
- 30-minute trend history graphs
- Plain-English notification feed
- Exercise mode (smart threshold shifting)
- One-tap SOS with GPS location
- Emergency response countdown timer
- Lone user detection and auto-escalation
- Caregiver companion mode (read-only live feed)
- Daily summary push notifications
- Shareable PDF session report
- Dark mode + accessibility options
- Demo mode (full simulation loop — no hardware needed)

### Hardware
- Wearable ECG + SpO2 sensing
- Buzzer alarm with pattern variations
- Dismiss button for false alarms
- Li-Po battery powered
- USB charging via TP4056

---
## Project Structure

```
Cardiac/
 |
 |-- main.py                     Python desktop monitor entry point
 |-- requirements.txt            Python dependencies
 |-- firebase-adminsdk.json      Firebase service account (not committed)
 |
 |-- arduino/
 |    |-- cardiac_sensor.ino     Arduino firmware
 |
 |-- src/
 |    |-- ecg_processor.py       Signal cleaning and R-R extraction
 |    |-- stability_score.py     Lyapunov exponent calculation
 |    |-- hrv_analysis.py        SDNN and RMSSD
 |    |-- ode_model.py           H(t) = H0 x e^(-kt) decay model
 |    |-- qt_detection.py        QRS and QTc calculation
 |    |-- risk_engine.py         Risk probability calculation
 |    |-- event_log.py           CSV event logging
 |    |-- sms_alert.py           Twilio emergency SMS
 |    |-- firebase_sync.py       Firebase push module
 |    |-- simulation.py          Hardware-free simulation mode
 |
 |-- CardiacAppCompanion/
 |    |-- App.js
 |    |-- package.json
 |    |-- src/
 |         |-- screens/
 |         |    |-- HomeScreen.js
 |         |    |-- TrendsScreen.js
 |         |    |-- ODEScreen.js
 |         |    |-- AlertsScreen.js
 |         |    |-- SettingsScreen.js
 |         |-- context/
 |         |    |-- ThemeContext.js
 |         |    |-- DataContext.js
 |         |-- config/
 |              |-- firebase.js
 |
 |-- docs/
      |-- wiring_diagram.png
      |-- system_architecture.png
      |-- project_report.pdf
```
---

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 18 or higher
- Arduino IDE
- Expo Go app on your phone
- Firebase account (free)
- Twilio account (free trial)

### Hardware Setup
1. Wire AD8232 ECG sensor to Arduino Nano (OUT→A0, LO+→D2, LO-→D3, 3.3V, GND)
2. Wire MAX30102 to Arduino Nano via I2C (SDA→A4, SCL→A5, VIN→3.3V, GND)
3. Wire buzzer positive to D8, negative to GND
4. Upload `arduino/cardiac_sensor.ino` using Arduino IDE
5. Attach disposable ECG electrodes: RA (right wrist), LA (left wrist), RL (left abdomen)

### Desktop Monitor Setup
```bash
pip install -r requirements.txt
```
Add your `firebase-adminsdk.json` to the project root folder.

```bash
python main.py
```

### Mobile App Setup
```bash
cd CardiacAppCompanion
npm install
npx expo start
```
Scan the QR code with Expo Go on your phone.

### Demo Mode (no hardware needed)
In the mobile app Settings screen, toggle **Demo Mode ON**.
The app will simulate a full 5-minute cardiac event cycle automatically.

---

## Environment Variables

Create a `.env` file in the project root (never commit this):
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
EMERGENCY_TO_NUMBER=+91xxxxxxxxxx
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

---

## What Makes This Different

| Feature | This project | Apple Watch | KardiaMobile | Hospital DEWS |
|---|---|---|---|---|
| Real-time ECG capture | Yes | Yes | Manual | Yes |
| Mathematical stability analysis | Yes | No | No | No |
| ODE decay prediction | Yes | No | No | No |
| Predicts before arrest | Yes | No | No | Yes |
| Portable + wearable | Yes | Yes | Yes | No |
| Works without EHR/lab data | Yes | Yes | Yes | No |
| Open source | Yes | No | No | No |
| Cost | ~₹2,000 | ~₹40,000 | ~₹15,000 | N/A |

---

## Team

Built as a first-year engineering mathematics project.

Project: BIO-FEA Cardiac Clinical Platform V4.0

Institution: G.Narayanamma Institute Of Technology and Sciences

Year: 2026

---

## Licence

MIT Licence — free to use, modify, and distribute with attribution.
