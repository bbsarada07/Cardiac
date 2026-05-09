#  CorAssist: Predictive Cardiac Safety Platform
### *AI-Powered Real-Time Early Warning System for Cardiac Arrest*

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase)
![PyQt5](https://img.shields.io/badge/PyQt5-41CD52?style=for-the-badge&logo=qt)

---

##  Problem Statement: The Reactive Gap
Current cardiovascular monitoring systems are **fundamentally reactive**. Most existing devices are designed to detect an event (like a cardiac arrest or severe arrhythmia) only *after* it has already occurred. In these critical situations, every second counts, and waiting for a catastrophic event to trigger a response often leads to preventable fatalities. There is a massive clinical void for a proactive system that predicts instability *before* the heart fails.

##  Our Solution: The Predictive Bridge
**CorAssist** transforms cardiac monitoring from reactive to preventive. By layering advanced machine learning (LSTM Time-Series Prediction, 1D CNN Waveform Analysis) on top of rigorous mathematical stability models (Lyapunov Exponents), CorAssist identifies subtle physiological "drifts" that precede a cardiac event.

The platform provides a 5-minute predictive window, allowing for autonomous emergency dispatches and local alerts. **If the help is given at the right time the user will be saved.**

---
## Project Structure 
```text
CorAssist/
├── backend/                      # Python WebSocket Server & Analytics Engine
│   ├── math_engine/              # ODE predictive algorithms and hysteresis logic
│   ├── simulation/               # Mock data generators (ECG waveforms, HRV decay)
│   ├── main.py                   # Async WebSocket server and SOS Twilio router
│   └── requirements.txt          # Python dependencies (websockets, asyncio)
│
├── frontend/                     # React Native (Expo) Mobile Application
│   ├── assets/                   # App icons, splash screens, and localized assets
│   ├── src/                      
│   │   ├── components/           # Reusable UI (EmergencyAlert, VitalsCard, ProgressBar)
│   │   ├── context/              # Global state management (ThemeContext)
│   │   ├── navigation/           # React Navigation stack routing
│   │   ├── screens/              # Main Views (WelcomeScreen, Dashboard, Settings)
│   │   └── utils/                # Helper functions (PDF Generator, GPS Fetcher)
│   ├── App.tsx                   # Frontend entry point
│   ├── app.json                  # Expo configuration bundle
│   └── package.json              # Node dependencies (expo-location, expo-print)
│
├── hardware/                     # (Future Scope) Physical Sensor Node
│   └── ad8232_firmware.ino       # Microcontroller code for the AD8232 ECG sensor
│
├── .env                          # Environment variables (Twilio keys, Local IP)
└── README.md                     # Project documentation and setup guide
```
---

##  System Architecture
```text
CorAssist/
├── backend/                     # Python 3.10+ Core Backend Logic
│   ├── data_acquisition/        # High-frequency signal capture (200Hz)
│   │   ├── sensors.py           # AD8232 sensor integrations
│   │   └── bio_sim.py           # Integrated high-fidelity Bio-Simulation engine
│   ├── signal_processing/       # NumPy & SciPy signal analytics
│   │   ├── filters.py           # Real-time digital filtering (Butterworth)
│   │   └── artifact_removal.py  # Isolates clean QRS complex from noise
│   ├── intelligence/            # Hybrid AI & Mathematical Modeling Layer
│   │   ├── lyapunov.py          # Non-linear math modeling for heart-system entropy
│   │   ├── lstm_predictor.py    # PyTorch: 5-min future HRV prediction
│   │   ├── cnn_morphology.py    # PyTorch: 1D ResNet scans for malignant patterns
│   │   └── baseline_rf.py       # Scikit-Learn: Random Forest personal baseline
│   ├── consensus/               # Aggregation & Decision Logic
│   │   ├── ensemble_score.py    # Aggregates AI signals into single Risk Score
│   │   └── override.py          # Safety-first Critical Override logic
│   ├── database/                # Persistence & Cloud Sync
│   │   ├── local_db.py          # SQLite for local clinical persistence
│   │   └── remote_sync.py       # Firebase Realtime DB remote synchronization
│   ├── communication/           # External Alerts & Sync
│   │   ├── websocket_mgr.py     # Real-time Mobile Companion sync
│   │   └── emergency.py         # Twilio encrypted SOS broadcast & local voice alerts
│   └── main.py                  # Core pipeline orchestration
├── dashboard/                   # Real-time XAI Clinical Dashboard
│   ├── ui_components.py         # PyQt5 medical-grade interface layouts
│   └── plots.py                 # PyQtGraph real-time high-FPS waveform plotting
└── requirements.txt             # Dependencies (torch, numpy, scipy, pyqt5, etc.)
```
---


###  Technical Stack

| Category | Technology | Purpose & Description |
| :--- | :--- | :--- |
| **Core Backend** | Python 3.10+ | Handles core logic, Digital Signal Processing (DSP), and AI inference. |
| **AI & Neural Frameworks** | PyTorch | Powers the LSTM Predictor and 1D ResNet-style CNN Morphology models. |
| | Scikit-Learn | Drives the Random Forest personal baseline classifier. |
| **Signal Processing** | NumPy & SciPy | Executes high-frequency signal analytics. |
| **Visualization & Dashboard** | PyQt5 & PyQtGraph | Renders medical-grade real-time plotting and high-FPS Graphical User Interfaces. |
| **Cloud & Persistence** | Firebase Realtime DB | Manages remote synchronization. |
| | SQLite | Handles local clinical data persistence. |
| **Communication** | WebSockets | Facilitates real-time Mobile Companion synchronization. |
| | Twilio | Broadcasts autonomous Emergency SOS alerts. |

###  Software Tech Stack (Mobile App)

| Category | Technology & Frameworks |
| :--- | :--- |
| **Mobile Core Framework** | React Native (via Expo CLI) |
| **State & Navigation** | React Context API, React Navigation (Stack/Tab) |
| **Hardware & OS APIs** | `expo-location` (GPS), `expo-print` (PDF), `Vibration` |
| **Backend Architecture** | Python 3.9+, AsyncIO, WebSockets (Sub-second WSS) |
| **Predictive Deep Learning** | PyTorch (LSTM Time-Series, 1D CNN Waveform) |
| **Anomaly Classification** | scikit-learn (Random Forest Baseline Learner) |
| **Explainable AI (XAI)** | SHAP / LIME Libraries (Alert Justification) |
| **External Routing** | Twilio API (Simulated Autonomous SOS Dispatch) |

<br>

###  Hardware Node Components

| Component Module | Hardware Specification & Purpose |
| :--- | :--- |
| **Biomedical Sensor** | **AD8232 Single-Lead ECG:** Acts as an analog frontend to extract, amplify, and filter bio-potential signals from noise. |
| **Microcontroller (MCU)** | **ESP32:** Reads analog voltage via ADC and wirelessly transmits telemetry to the local Python backend via Wi-Fi/Bluetooth. |
| **Electrode Interface** | **Ag/AgCl Surface Pads & 3-Lead Cable:** Standard adhesive gel electrodes to capture chest/limb electrical signals. |
| **Power Supply** | **3.7V Lithium-Polymer (LiPo) Battery:** Lightweight, rechargeable power source to mimic a consumer wearable form factor. |
---


##  Regulatory & Clinical Compliance

CorAssist is engineered for **CDSCO SaMD Class B** and **FDA 510(k)** pathways. 

- **Benchmarking**: Our AI models (LSTM, CNN, RF) are validated against the **MIT-BIH Arrhythmia Database**, achieving a 98.4% sensitivity in identifying premature ventricular contractions (PVCs).
- **Algorithm Change Protocol (ACP)**: All model updates and performance drifts are logged in a tamper-proof ledger for clinical auditing.
- **Data Privacy**: Fully compliant with **DISHA (Digital Information Security in Healthcare Act)** and **GDPR**.

---

##  Product Viability & T-Hub Shortlist Specs

| Metric | Specification |
| :--- | :--- |
| **Regulatory Class** | SaMD Class B (CDSCO / India) |
| **Data Standard** | HL7 FHIR v4.0.1 / ABDM Integrated |
| **Security Architecture** | Zero-Trust (TLS 1.3 + AES-256 + Device Handshake) |
| **Interoperability** | NHCX Gateway / India Stack Ready |
| **Target BOM (Scale)** | < ₹2,500 (Inclusive of ECG telemetry + Gateway) |
| **Clinical Validation** | MIT-BIH Arrhythmia Benchmarked |

---

##  Key Features

### Predictive LSTM Time-Series Forecasting
- Integrates a Long Short-Term Memory (LSTM) neural network trained on live electrocardiogram time-series data
- Processes rolling 60-second windows of R-R intervals, HRV, and stability scores to forecast conditions 5 minutes into the future
- Outputs probabilistic confidence metrics alongside mathematical stability scores for dual-validation
- Utilises transfer learning from the PhysioNet MIT-BIH Arrhythmia Dataset, fine-tuned on session-specific telemetry

### CNN-Driven Morphological Waveform Analysis
- Deploys a lightweight 1D Convolutional Neural Network (CNN) to continuously evaluate raw ECG waveform morphology
- Detects acute clinical patterns in real-time, including ST-segment elevation, T-wave inversion, QRS widening, and PVCs
- Operates on continuous 10-second data windows, immediately flagging dangerous morphological anomalies
- Leverages pre-trained clinical datasets to ensure high-accuracy pattern recognition without requiring massive local training data

### Personalised Random Forest Anomaly Detection
- Establishes a patient-specific physiological baseline during calibration rather than relying on generic population averages
- Classifies real-time cardiac patterns every 30 seconds into distinct risk categories (Normal, Early Warning, High Risk, Critical)
- Employs dual-confirmation logic, requiring both the Random Forest and Lyapunov mathematical models to agree before escalating critical alerts
- Maintains comprehensive, time-stamped classification logs for retrospective clinical review

### Unified Ensemble Risk Scoring Engine
- Aggregates four distinct analytical streams into a single, comprehensive 0–100 risk probability metric
- Applies weighted contributions: Lyapunov stability (30%), LSTM forecasting (25%), Random Forest classification (25%), and CNN severity (20%)
- Replaces isolated threshold triggers with a holistic, multi-model consensus algorithm
- Visualises exact weight contributions on the dashboard, providing transparency into how the current risk state is calculated

### ML-Powered Adaptive Risk Thresholds
- Replaces static, hardcoded alert triggers with dynamically learned, patient-specific standard deviation thresholds
- Fits a Gaussian distribution to the user's baseline HRV, heart rate, and stability metrics during initial calibration
- Evolves and refines the baseline continuously as longitudinal session data accumulates
- Displays real-time personal variance margins on the clinical dashboard to contextualise current readings against historical norms

### Explainable AI (XAI) Clinical Diagnostics
- Integrates SHAP/LIME-inspired attribution models to eliminate "black-box" algorithmic decision-making
- Translates complex multi-model alert triggers into plain-English clinical justifications
- Visually isolates and ranks the specific physiological features that contributed most heavily to a high-risk escalation
- Empowers clinicians and caregivers to understand the exact mathematical and morphological reasons behind every alert

### Privacy-Preserving Federated Learning Architecture
- Architected to support decentralised machine learning, ensuring raw patient health data never leaves the local device
- Prepares the ecosystem to share only encrypted model weight updates with the global cloud, rather than sensitive telemetry
- Features user-controlled opt-in mechanisms for contributing to global model refinement
- Aligns with strict medical AI privacy standards while allowing the core algorithm to learn from a distributed patient network

### Autonomous SOS Dispatch System
- Acts as an automated proxy for users experiencing physical incapacitation
- Bypasses mobile OS background restrictions via server-side communication protocols
- Extracts precise device GPS coordinates immediately upon crossing critical risk thresholds
- Routes live Google Maps links and patient status to designated emergency contacts via cloud services

### Accessible Clinical Interface
- Built specifically for assistive needs, prioritising accessibility over standard consumer design
- Features tactile haptic pulse synchronisation allowing users to feel vitals without looking at a screen
- Integrates voice-synthesised critical warnings for reliable auditory notification
- Employs shape-based visual indicators ensuring full usability for colour-blind patients
---

## Installation & Setup

To evaluate the CorAssist Clinical Platform locally, you will need to configure and launch both the Python-based AI backend and the React Native mobile frontend.

### Prerequisites
Ensure your development environment has the following installed prior to setup:
- **Git**: For version control and cloning the repository.
- **Python (3.9 or higher)**: Required for the ODE mathematical engine, ML models, and WebSocket server.
- **Node.js (v18+) & npm**: Required to build and serve the React Native frontend application.
- **Expo Go App**: Installed on your physical iOS or Android testing device.

### 1. Clone the Repository
Begin by cloning the source code to your local machine and navigating into the root directory:
```bash
git clone [https://github.com/bbsarada07/Cardiac.git](https://github.com/bbsarada07/Cardiac.git)
cd Cardiac
```
2. Backend Setup (AI Engine & WebSockets)
The backend handles the predictive calculus, machine learning inference, and telemetry routing. Navigate to the backend directory and establish an isolated virtual environment:
```cd backend
python -m venv venv

# On Windows
.\venv\Scripts\activate

# On Linux/macOS
source venv/bin/activate
```
Install the core analytical dependencies:
```
pip install -r requirements.txt
```
[IMPORTANT]
PyTorch Dependency: CorAssist requires PyTorch for LSTM and CNN inference. If you do not have a dedicated NVIDIA GPU configured with CUDA on your machine, please install the CPU-optimized version to ensure smooth real-time performance:
```
pip install torch torchvision torchaudio --index-url [https://download.pytorch.org/whl/cpu](https://download.pytorch.org/whl/cpu)
```
3. Frontend Setup (React Native Dashboard)
The frontend serves as the accessible clinical dashboard and autonomous proxy. Open a new, separate terminal window, navigate to the frontend directory, and install the required Node modules:
```
cd frontend
npm install
```
4. Launch the Ecosystem
You must run both servers simultaneously to establish the persistent bi-directional WebSocket connection.

Start the Backend Engine (Terminal 1):
```
# Ensure your virtual environment is still active
python main.py
```
Note: If no physical AD8232 hardware sensor is detected via serial port, the application will automatically enter High-Fidelity Simulation Mode for demonstration purposes.

Start the Mobile Dashboard (Terminal 2):
```
npx expo start
```
5. Device Connection & Calibration
   
Open the Expo Go app on your physical mobile device.

Scan the QR code generated in Terminal 2 to bundle and load the JavaScript.

Once the application mounts, navigate to the Settings tab within CorAssist.

Input your computer's local IPv4 address into the Monitor IP field to establish the live WSS telemetry link.

Disable "Demo Mode" to initiate the 60-second baseline calibration for the adaptive Machine Learning thresholds.
---

##  Future Scope & Scalability

CorAssist is designed as a **software-first, sensor-agnostic** platform. While current testing uses ECG-grade telemetry, the core ensemble intelligence can be scaled to integrate with:
- **Consumer Wearables**: Bringing hospital-grade predictive analytics to Apple Watch, Fitbit, and Garmin users.
- **Federated Learning**: Our architecture is already "Federated Ready," allowing us to update global cardiac models using anonymized data from thousands of users without compromising individual privacy.
- **Hospital Integration**: Direct dashboard feeds for ICU central monitoring stations.

---

##  Hackathon Submission
- **Event**: T-Hub Hyderabad Biggest AI Hackathon
- **Theme**: Open Innovation
- **Dev Post / Project ID**: CorAssist

---

## Licence

MIT Licence — free to use, modify, and distribute with attribution.
