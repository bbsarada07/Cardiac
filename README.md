# 🫀 CorAssist: Predictive Cardiac Safety Platform
### *AI-Powered Real-Time Early Warning System for Cardiac Arrest*

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase)
![PyQt5](https://img.shields.io/badge/PyQt5-41CD52?style=for-the-badge&logo=qt)

---

## 🚩 Problem Statement: The Reactive Gap
Current cardiovascular monitoring systems are **fundamentally reactive**. Most existing devices are designed to detect an event (like a cardiac arrest or severe arrhythmia) only *after* it has already occurred. In these critical situations, every second counts, and waiting for a catastrophic event to trigger a response often leads to preventable fatalities. There is a massive clinical void for a proactive system that predicts instability *before* the heart fails.

## 💡 Our Solution: The Predictive Bridge
**CorAssist** transforms cardiac monitoring from reactive to preventive. By layering advanced machine learning (LSTM Time-Series Prediction, 1D CNN Waveform Analysis) on top of rigorous mathematical stability models (Lyapunov Exponents), CorAssist identifies subtle physiological "drifts" that precede a cardiac event.

The platform provides a 5-minute predictive window, allowing for autonomous emergency dispatches and local alerts. **If the help is given at the right time the user will be saved.**

---

## 🏛️ System Architecture

CorAssist employs a multi-layered Intelligence architecture designed for high-fidelity clinical monitoring and zero-latency local inference:

1.  **Data Acquisition Layer**: Captures high-frequency electrical signals via AD8232 sensors or the integrated high-fidelity Bio-Simulation engine (200Hz sampling).
2.  **Signal Processing Layer**: Real-time digital filtering (Butterworth) and artifact detection to isolate the clean QRS complex from baseline wander and muscular noise.
3.  **Hybrid Intelligence Layer**: 
    -   **Lyapunov Stability Engine**: Uses non-linear mathematical modeling to calculate heart-system entropy.
    -   **Deep Learning Predictor (LSTM)**: Analyzes time-series HRV to predict stability 5 minutes into the future.
    -   **1D CNN Morphology Monitor**: Scans raw waveforms for malignant patterns (ST-Elevation, PVCs).
4.  **Ensemble Consensus Layer**: Aggregates all mathematical and AI signals into a single "Ensemble Risk Score" with a safety-first "Critical Override" override logic.
5.  **Alert & Action Layer**: Triggers local voice synthesis alerts, updates the real-time XAI dashboard, and broadcasts encrypted SOS packets via Firebase and Twilio.

---

## 💻 Technical Stack

-   **Core Backend**: Python 3.10+ (Logic, DSP, and AI Inference)
-   **AI & Neural Frameworks**: 
    -   **PyTorch**: Powers the LSTM Predictor and 1D ResNet-style CNN Morphology models.
    -   **Scikit-Learn**: Drives the Random Forest personal baseline classifier.
-   **Signal Processing**: NumPy & SciPy (High-frequency signal analytics).
-   **Visualization & Dashboard**: PyQt5 & PyQtGraph (Medical-grade real-time plotting and high-FPS GUI).
-   **Cloud & Persistence**: Firebase Realtime DB (Remote Sync), SQLite (Local Clinical Persistence).
-   **Communication**: WebSockets (Real-time Mobile Companion sync), Twilio (Emergency SOS).

---

## 🚀 Key Features

- **🧠 Hybrid Intelligence Engine**: Combines Lyapunov mathematical stability scores with a **Long Short-Term Memory (LSTM)** network to predict future heart rate variability (HRV) trends.
- **⚡ Real-Time CNN Morphology**: A 1D ResNet-style Convolutional Neural Network that scans raw ECG waveforms (200Hz) to detect PVCs, ST Elevation, and other dangerous electrical patterns instantly.
- **🛡️ Adaptive Threshold Learning**: Moves beyond fixed clinical limits. CorAssist uses Gaussian baseline modeling to learn the user's "Personal Normal" and adapts to natural physiological drift.
- **🚨 Autonomous Emergency Dispatch**: Integrated with Firebase and Twilio to trigger automatic SOS broadcasts with precise GPS location when a critical ensemble risk score (>90%) is reached.
- **📊 XAI (Explainable AI) Panel**: A clinical-grade transparency layer that visualizes which features (Stability, Prediction, or Morphology) are driving the current risk assessment.

---

## 🛠️ Installation & Setup

To run the CorAssist Clinical Platform locally for evaluation:

### 1. Clone the Repository
```bash
git clone https://github.com/bbsarada07/Cardiac.git
cd Cardiac
```

### 2. Set Up a Virtual Environment (Recommended)
```bash
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
Install the core requirements first:
```bash
pip install -r requirements.txt
```

> [!IMPORTANT]
> **PyTorch Dependency**: CorAssist requires PyTorch for AI inference. If you do not have a dedicated NVIDIA GPU, please install the CPU-optimized version to ensure smooth real-time performance:
> ```bash
> pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
> ```

### 4. Launch the Platform
```bash
python main.py
```
*Note: If no hardware sensor is detected, the application will automatically enter **High-Fidelity Simulation Mode** for demonstration.*

---

## 📈 Future Scope & Scalability

CorAssist is designed as a **software-first, sensor-agnostic** platform. While current testing uses ECG-grade telemetry, the core ensemble intelligence can be scaled to integrate with:
- **Consumer Wearables**: Bringing hospital-grade predictive analytics to Apple Watch, Fitbit, and Garmin users.
- **Federated Learning**: Our architecture is already "Federated Ready," allowing us to update global cardiac models using anonymized data from thousands of users without compromising individual privacy.
- **Hospital Integration**: Direct dashboard feeds for ICU central monitoring stations.

---

## 🏆 Hackathon Submission
- **Event**: T-Hub Hyderabad Biggest AI Hackathon
- **Theme**: Open Innovation
- **Dev Post / Project ID**: [Insert Link Here]

---
*Built with ❤️ for a safer heart.*
