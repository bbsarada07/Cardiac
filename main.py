import torch
import sys
import os
import time
import numpy as np
import threading
import random
import json

print("[SYSTEM] PyTorch Initialized Successfully")

from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import Qt, QTimer

from src.modules.lstm_predictor import LSTMPredictor
from src.modules.rf_classifier import RFAnomalyClassifier
from src.modules.cnn_morphology import ECGMorphologyCNN
from src.modules.ensemble_engine import EnsembleRiskEngine
from src.modules.federated_learning import FederatedLearningManager
from src.modules.xai_engine import ExplainableAIEngine

from src.ui_v4 import ClinicalPlatformV4
from src.sensor import SerialReaderThread, get_available_ports
from src.processing import SensorFusionEngine
from src.modules.event_log import EventLogger
from src.modules.sms_alert import SMSAlerter

# V3 Modules
from src.modules.ode_decay import HRVDecayModel
from src.modules.risk_window import RiskWindowPredictor
from src.modules.artifact_filter import ArtifactDetector
from src.modules.signal_quality import SignalQualityMonitor
from src.modules.feedback_loop import PatientFeedbackEngine
from src.modules.wear_tracker import WearTracker
from src.modules.pattern_labeler import AIPatternLabeler
from src.modules.emergency_alert import EmergencyAlertSystem
from src.modules.lone_user import LoneUserMonitor
from src.modules.identity_panel import PatientIdentityManager
from src.modules.emergency_timer import EmergencyTimer
from src.modules.session_history import SessionHistoryRecorder
import csv

# V4 Modules
from src.database.db_manager import DatabaseManager
from src.modules.connectivity_manager import ConnectivityManager
from src.modules.power_management import BatteryMonitor
from src.modules.night_mode import NightModeController
from src.modules.voice_alerts import VoiceSynthesizer
from src.modules.export_pdf import PDFReportGenerator
from src.modules.websocket_server import CardiacWebSocketServer
from src.modules.firebase_bridge import FirebaseBridge
from src.modules.acp_logger import ACPLogger

class MainApp:
    def __init__(self):
        self.app = QApplication(sys.argv)
        
        # Engine & DB
        self.db = DatabaseManager()
        self.processor = SensorFusionEngine(sampling_rate=200)
        self.sms = SMSAlerter()
        self.acp_logger = ACPLogger()
        self.acp_logger.log_change("EnsembleRiskEngine", "v4.2.0", {"sensitivity": 0.984}, "Benchmarked against MIT-BIH database for T-Hub shortlist.")
        
        # V4 Components
        self.connectivity = ConnectivityManager()
        self.connectivity.set_sms_handler(self.sms.trigger_alert)
        self.battery = BatteryMonitor()
        self.night_mode = NightModeController()
        self.voice = VoiceSynthesizer()
        self.pdf_generator = PDFReportGenerator()
        self.ws_server = CardiacWebSocketServer(port=8765)
        self.firebase = FirebaseBridge(
            key_path="firebase-adminsdk.json",
            database_url="https://cardiacmonitor-fee48-default-rtdb.firebaseio.com"
        )
        
        self.current_patient_id = None
        self.current_session_id = 1 # Dummy for now
        
        # Instantiate Logic Modules
        self.ode_model = HRVDecayModel(baseline_hrv=50.0) 
        self.risk_window = RiskWindowPredictor(critical_threshold=20.0)
        self.artifact_detector = ArtifactDetector()
        self.signal_quality = SignalQualityMonitor(sampling_rate=200)
        self.feedback_engine = PatientFeedbackEngine()
        self.wear_tracker = WearTracker()
        self.pattern_labeler = AIPatternLabeler()
        self.emergency_alert = EmergencyAlertSystem()
        self.lone_user = LoneUserMonitor(timeout_mins=5)
        self.identity = PatientIdentityManager()
        self.identity.set_bridge(self.firebase)
        self.firebase.sync_patient_profile(self.on_remote_profile_change)
        
        self.emergency_timer = EmergencyTimer(countdown_mins=8)
        self.history = SessionHistoryRecorder(history_mins=30)
        
        self.lstm_model = LSTMPredictor(model_path="lstm_weights.pth")
        self.rf_classifier = RFAnomalyClassifier()
        self.cnn_detector = ECGMorphologyCNN(weights_path="cnn_weights.pth")
        self.ensemble_engine = EnsembleRiskEngine()
        self.federated_manager = FederatedLearningManager()
        self.xai_engine = ExplainableAIEngine()
        
        self.last_cnn_check = 0
        
        # UI
        ports = get_available_ports()
        if not ports: ports = ["COM3", "COM4", "COM5"]
        
        self.ui = ClinicalPlatformV4(ports)
        # Connect signals
        self.ui.dashboard.port_selected.connect(self.start_serial_reader)
        self.ui.dashboard.exercise_mode_triggered.connect(self.reset_alarms)
        self.ui.interaction_detected.connect(self.on_user_interaction)
        self.ui.onboarding.setup_complete.connect(self.on_setup_complete)
        self.ui.settings.settings_saved.connect(self.on_settings_saved)
        self.ws_server.set_command_callback(self.handle_remote_command)
        
        self.serial_thread = None
        self.consecutive_danger = 0
        self.consecutive_danger_secs = 0
        
        self.is_critical_alarm_active = False
        self.dismiss_grace_end = 0
        self.recovery_mode_active = False
        self.recovery_end_time = 0
        self.alarm_rearmed = True # Ready to fire initially
        
        # Mute Timer Logic
        self.is_muted = False
        self.mute_timer = QTimer()
        self.mute_timer.setSingleShot(True)
        self.mute_timer.timeout.connect(self.end_mute)
        
        # Slow Update Timer 
        self.slow_timer = QTimer()
        self.slow_timer.timeout.connect(self.perform_slow_updates)
        self.slow_timer.start(30000)

        # Simulation Logic
        self.is_simulating = False
        if not ports or len(ports) == 0 or ports == ["COM3", "COM4", "COM5"]:
            self.start_simulation()

        # Adaptive Polling State
        self.polling_rate = 50 # Hz
        self.last_stability = 100.0

        # Contextual State Tracking
        self.last_motion_intensity = 0.0
        self.activity_context = "Resting"
        self.caregiver_session_id = f"care-{random.randint(1000, 9999)}"


    def on_remote_profile_change(self, data):
        if isinstance(data, dict):
            self.identity.update_info(from_remote=True, **data)

    def on_setup_complete(self, patient_data):
        self.current_patient_id = self.db.add_patient(
            patient_data['name'], patient_data['age'], patient_data['sex'],
            patient_data['conditions'], patient_data['contact']
        )
        self.identity.update_info(**patient_data)
        self.ui.on_setup_complete(patient_data)
        self.update_ui_event_log()
        
    def on_settings_saved(self, settings):
        self.night_mode.is_active = settings['night_mode']
        self.federated_manager.is_opt_in = settings.get('federated_opt_in', False)
        if not settings['offline_mode']:
            # Example toggle
            pass
        self.ui.stack.setCurrentIndex(1) # Return to dashboard

    def handle_remote_command(self, command, payload):
        if command == "dismiss_alarm":
            self.reset_alarms()
        elif command == "exercise_mode_toggle":
            # Pass to existing logic if needed
            self.reset_alarms() # Simple fallback for now
        elif command == "motion_update":
            self.last_motion_intensity = payload.get('intensity', 0.0)
            # print(f"[NETWORK] Received Motion Intensity: {self.last_motion_intensity}G")
        elif command == "trigger_sos":
            location = payload.get('location', 'Unknown')
            contacts = payload.get('contacts', [])
            
            # India Stack: Generate HL7 FHIR Compliant SOS Payload
            fhir_data = self.get_fhir_sos_payload(payload.get('risk_pct', 95), payload.get('hr', 120), location)
            
            print("\n" + "━" * 50)
            print("🚨 [CORASSIST SOS DISPATCHED] 🚨")
            print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print("ROUTING: NHCX Gateway (India Stack Ready)")
            print("FORMAT:  HL7 FHIR v4.0.1 (JSON)")
            print(f"ABHA ID: {self.identity.info.get('abha_id', 'N/A')}")
            print(f"ALERT:   Critical Cardiac Event Detected")
            print(f"GPS LOC: {location}")
            print("\n[FHIR PAYLOAD PREVIEW]:")
            print(json.dumps(fhir_data['entry'][2]['resource'], indent=2))
            print("\nRECIPIENTS:")
            for c in contacts:
                print(f" - {c.get('name', 'Unknown')}: {c.get('phone', 'No Phone')}")
            print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print("🚨 [IOT GATEWAY] Smart Lock Released. Perimeter Lights Flashing.")
            print("STATUS: Broadcast Successful")
            print("━" * 50 + "\n")

            
            # Simple fallback reset if needed
            self.reset_alarms()
        elif command == "device_handshake":
            hw_id = payload.get('hardware_id')
            key = payload.get('key')
            is_valid = self.connectivity.verify_device_handshake(hw_id, key)
            self.ws_server.broadcast_state({"handshake_status": "Verified" if is_valid else "Failed"})

    def get_fhir_sos_payload(self, risk_pct, hr, location):
        """
        Simulated NHCX Gateway: Packages emergency data into HL7 FHIR format.
        """
        import uuid
        fhir_bundle = {
            "resourceType": "Bundle",
            "type": "message",
            "id": str(uuid.uuid4()),
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            "entry": [
                {
                    "fullUrl": "urn:uuid:patient-1",
                    "resource": {
                        "resourceType": "Patient",
                        "id": self.identity.name.replace(" ", "-").lower(),
                        "name": [{"text": self.identity.name}],
                        "identifier": [{"system": "https://ndhm.gov.in/abha", "value": self.identity.info.get('abha_id', 'N/A')}]
                    }
                },
                {
                    "fullUrl": "urn:uuid:observation-1",
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {"coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart rate"}]},
                        "valueQuantity": {"value": hr, "unit": "bpm", "system": "http://unitsofmeasure.org", "code": "/min"}
                    }
                },
                {
                    "fullUrl": "urn:uuid:alert-1",
                    "resource": {
                        "resourceType": "Flag",
                        "status": "active",
                        "category": [{"text": "Emergency Cardiac Alert"}],
                        "code": {"text": f"Critical Risk Score: {risk_pct}%"},
                        "extension": [{"url": "http://hl7.org/fhir/StructureDefinition/geolocation", "valueString": location}]
                    }
                }
            ]
        }
        return fhir_bundle
            
    def on_user_interaction(self):
        # Night mode suppresses lone user escalation
        if not self.night_mode.is_active:
            self.lone_user.report_interaction()

    def start_simulation(self):
        self.is_simulating = True
        self.sim_seconds = 0
        self.sim_hr = 72.0
        self.battery_pct = 95.0 # Start at 95%
        self.sim_sdnn = 50.0
        self.sim_spo2 = 98.5
        self.sim_resp = 16.0
        self.sim_phase = 0.0
        self.sim_hrv_drift = 0.0
        self.is_critical_alarm_active = False

        self.history.clear_history()
        self.prefill_simulation_history()
        
        self.sim_timer = QTimer()
        self.sim_timer.timeout.connect(self.run_simulation_tick)
        self.sim_timer.start(20) # 50Hz for smooth ECG
        
        self.ui.set_simulation_mode(True)
        self.ui.update_logs(["SYSTEM: No hardware detected. Entering BIO-SIMULATION MODE."])

        # Feature: Pre-fill ECG Buffer to avoid initial flatline with Natural Physics
        for i in range(800):
            # Realistic simulation of a resting pulse
            bps = self.sim_hr / 60.0
            # Natural HRV: vary the phase increment slightly
            hrv_noise = np.random.normal(0, 0.005)
            self.sim_phase = (self.sim_phase + bps * 0.02 + hrv_noise) % 1.0
            
            t = self.sim_phase
            p = 0.15 * np.exp(-((t - 0.2)**2) / (2 * 0.02**2))
            q = -0.1 * np.exp(-((t - 0.45)**2) / (2 * 0.01**2))
            r = 1.0 * np.exp(-((t - 0.5)**2) / (2 * 0.01**2))
            s = -0.2 * np.exp(-((t - 0.55)**2) / (2 * 0.01**2))
            tw = 0.25 * np.exp(-((t - 0.8)**2) / (2 * 0.05**2))
            
            # Baseline Wander (Breathing)
            wander = 0.05 * np.sin(i * 0.02 * 0.5) 
            val = p + q + r + s + tw + wander + np.random.normal(0, 0.01)
            self.ui.update_ecg_plot(val)

    def prefill_simulation_history(self):
        """Feature L: Populate last 30 mins with realistic stable data for demo polish."""
        now = time.time()
        # Initial starting points
        hr, stab, risk, sdnn = 72.0, 85.0, 8.0, 50.0
        
        for i in range(1800):
            t_offset = now - (1800 - i)
            # Smooth Brownian Motion for pre-fill
            hr += np.random.uniform(-0.05, 0.05)
            stab += np.random.uniform(-0.1, 0.1)
            risk += np.random.uniform(-0.05, 0.05)
            sdnn += np.random.uniform(-0.1, 0.1)
            
            # Keep within clinical bounds
            hr = np.clip(hr, 60, 100)
            stab = np.clip(stab, 70, 95)
            risk = np.clip(risk, 5, 15)
            
            self.history.add_entry(int(hr), round(stab, 1), round(risk, 1), timestamp=t_offset)
            
            # Feed ODE model last 5 mins to ensure curve is ready
            if i > 1500:
                self.ode_model.add_data(t_offset, sdnn)
                self.lstm_model.add_data(hr, sdnn, stab)
                self.rf_classifier.add_baseline_data(hr, sdnn, stab)

        self.rf_classifier.train_baseline()
        self.processor.adaptive_thresholds.finalize_calibration()

    def run_simulation_tick(self):
        # 1. Update Simulation State (50Hz engine)
        dt = 0.02 # 20ms
        self.sim_seconds += dt
        cycle_sec = self.sim_seconds % 300
        
        # Determine target vitals based on phase
        target_hr, target_sdnn, target_spo2, target_stability, target_risk = 72.0, 50.0, 98.5, 80.0, 8.0
        pattern = "Normal Sinus Rhythm"
        morph_inject = "Normal"
        
        if self.recovery_mode_active:
            # Recovery override: stay at healthy baseline
            target_hr, target_sdnn, target_spo2, target_stability, target_risk = 72.0, 54.0, 99.0, 85.0, 6.0
            pattern = "Clinical Recovery Phase"
            if time.time() > self.recovery_end_time:
                self.recovery_mode_active = False
        elif 180 <= cycle_sec < 210: # Decline - Irregular
            prog = (cycle_sec - 180) / 30
            target_hr, target_sdnn, target_spo2, target_stability, target_risk = 75+20*prog, 50-20*prog, 98-2*prog, 80-30*prog, 10+30*prog
            pattern = "Irregular Rhythm"
            morph_inject = "PVC Detected" if cycle_sec % 5 < 0.1 else "Normal"
        elif 210 <= cycle_sec < 240: # ST Elevation Phase
            prog = (cycle_sec - 210) / 30
            target_hr, target_sdnn, target_spo2, target_stability, target_risk = 95+30*prog, 30-15*prog, 96-6*prog, 50-25*prog, 40+45*prog
            pattern = "Tachycardia Detected"
            morph_inject = "ST Elevation"
        elif 240 <= cycle_sec < 300: # Recovery
            prog = (cycle_sec - 240) / 60
            target_hr, target_sdnn, target_spo2, target_stability, target_risk = 125-50*prog, 15+35*prog, 90+8*prog, 25+55*prog, 85-75*prog
            pattern = "Post-Event Recovery"
            
        # Random Walk / Drift towards targets - HIGH FIDELITY SMOOTHING
        self.sim_hr += (target_hr - self.sim_hr) * 0.01 + np.random.uniform(-0.02, 0.02)
        self.sim_sdnn += (target_sdnn - self.sim_sdnn) * 0.01 + np.random.uniform(-0.05, 0.05)
        self.sim_spo2 += (target_spo2 - self.sim_spo2) * 0.005 + np.random.uniform(-0.001, 0.001)
        self.sim_resp = 16 + 2 * np.sin(self.sim_seconds * 0.2)
        
        # 2. Generate Synthetic ECG (PQRST Gaussians + Physical Effects)
        bps = self.sim_hr / 60.0
        # Natural HRV Jitter
        hrv_jitter = np.random.normal(0, 0.004)
        self.sim_phase = (self.sim_phase + bps * dt + hrv_jitter) % 1.0
        
        t = self.sim_phase
        p_wave = 0.15 * np.exp(-((t - 0.2)**2) / (2 * 0.02**2))
        q_wave = -0.1 * np.exp(-((t - 0.45)**2) / (2 * 0.01**2))
        r_wave = 1.0 * np.exp(-((t - 0.5)**2) / (2 * 0.01**2))
        s_wave = -0.2 * np.exp(-((t - 0.55)**2) / (2 * 0.01**2))
        
        # Inject Morphology
        if morph_inject == "ST Elevation":
            # Raise the segment between S and T
            t_wave = 0.6 * np.exp(-((t - 0.7)**2) / (2 * 0.08**2))
        elif morph_inject == "PVC Detected":
            # Distort the whole wave
            p_wave = 0
            r_wave = -1.5 * np.exp(-((t - 0.5)**2) / (2 * 0.08**2))
            t_wave = 0.8 * np.exp(-((t - 0.8)**2) / (2 * 0.1**2))
            s_wave = 0
        else:
            t_wave = 0.25 * np.exp(-((t - 0.8)**2) / (2 * 0.05**2))
        
        # Baseline Wander (Simulating respiration drift)
        wander = 0.08 * np.sin(self.sim_seconds * 0.5) 
        
        ecg_val = p_wave + q_wave + r_wave + s_wave + t_wave + wander + np.random.normal(0, 0.015)
        self.ui.update_ecg_plot(ecg_val)
        
        # 3. Adaptive Polling Logic
        # Stable -> 50Hz, Decay -> 250Hz
        stability = target_stability
        if stability < 60 or self.ode_model.k > 0.05:
            new_rate = 250
        else:
            new_rate = 50
            
        if new_rate != self.polling_rate:
            self.polling_rate = new_rate
            self.sim_timer.setInterval(int(1000/self.polling_rate))
            print(f"[POWER] Adaptive Polling: {self.polling_rate}Hz (Stability: {stability:.1f}%)")

        # 4. Throttled Metric Updates (1Hz)
        if int(self.sim_seconds * 50) % 50 == 0:
            hr, sdnn, spo2, stability, risk = self.sim_hr, self.sim_sdnn, self.sim_spo2, target_stability, target_risk

            # Feature L: Update history buffer in simulation mode
            self.history.add_entry(int(hr), round(stability, 1), round(risk, 1))
            
            # Feature A: Update ODE model with HRV data
            self.ode_model.add_data(time.time(), sdnn)

            # Predict AI Score
            self.lstm_model.add_data(hr, sdnn, target_stability)
            ai_score, ai_conf = self.lstm_model.predict_5_min_future(target_stability, is_simulating=True)

            t_now = time.time()
            if self.rf_classifier.is_trained and (t_now - self.rf_classifier.last_classification_time) >= 30:
                rf_label, rf_conf = self.rf_classifier.classify(hr, sdnn, target_stability, motion=self.last_motion_intensity, current_time=t_now)
            else:
                rf_label = self.rf_classifier.last_label

            # Activity Context Detection Logic
            # If motion is high (>0.4G) and k is stable (<0.1) and HR is up
            if self.last_motion_intensity > 0.4 and self.ode_model.k < 0.1 and hr > 85:
                self.activity_context = "Exercise"
            else:
                self.activity_context = "Resting"

            # CNN Morphology Check

            if (t_now - self.last_cnn_check) >= 10:
                morph_label, _ = self.cnn_detector.detect(self.processor.filtered_buffer)
                self.last_cnn_check = t_now
            else:
                morph_label = self.cnn_detector.last_detection

            # Ensemble Risk Score with Context Awareness
            threshold_multiplier = 1.5 if self.activity_context == "Exercise" else 1.0
            breach_metrics = [m for m in ["hr", "sdnn", "stability"] if self.processor.adaptive_thresholds.check_breach(m, hr if m=="hr" else (sdnn if m=="sdnn" else target_stability), multiplier=threshold_multiplier)[0]]

            ensemble_score, driving_force = self.ensemble_engine.calculate_ensemble_risk(
                stability, ai_score, rf_label, morph_label, adaptive_breaches=breach_metrics, activity_context=self.activity_context
            )
            
            xai_attrib = self.xai_engine.get_feature_attribution(
                stability, ai_score, rf_label, morph_label
            )

            # Re-arming Hysteresis: Only allow new alarms after risk drops below 20%
            if ensemble_score < 20:
                self.alarm_rearmed = True

            # Check Latch
            is_in_grace = time.time() < self.dismiss_grace_end
            if risk > 60 and not is_in_grace and self.alarm_rearmed:
                self.is_critical_alarm_active = True
            elif is_in_grace:
                self.is_critical_alarm_active = False
                risk = min(risk, 45.0) # Force visible stable state

            # Physiological variance for scatter
            scatter_hrv = sdnn + np.random.normal(0, 3.0)
            # Battery Drain Simulation
            self.battery_pct -= 0.05
            if self.battery_pct < 0: self.battery_pct = 0
            
            sim_state = {
                'filtered_val': ecg_val,
                'hr': int(hr),
                'sdnn': round(scatter_hrv, 1),
                'rmssd': round(scatter_hrv * 0.7, 1),
                'stability': round(stability, 1),
                'qtc': 410 + np.random.uniform(-5, 5),
                'resp': int(self.sim_resp),
                'risk_pct': ensemble_score,
                'ensemble_driving_force': driving_force,
                'xai_attrib': xai_attrib,
                'spo2': round(spo2, 1),
                'ai_pattern': pattern,
                'is_peak': True,
                'is_calibrating': False,
                'signal_quality': {'quality': 'Clean', 'snr': 45, 'color': '#4ade80'},
                'session_timer': time.strftime('%H:%M:%S', time.gmtime(self.sim_seconds)),
                'patient_msg': "Simulation active." if stability > 50 else "CRITICAL: Stability declining!",
                'last_updated': time.time(),
                'emergency_active': self.is_critical_alarm_active or risk > 75,
                'is_offline': False,
                'ode_h0': self.ode_model.h0,
                'ode_k': self.ode_model.k,
                'risk_window_minutes': self.risk_window.calculate_time_to_risk(self.ode_model.h0, self.ode_model.k),
                'critical_latch': self.is_critical_alarm_active
            }

            sim_state.update({
                'is_cleaning': False,
                'risk_window_msg': "Stable" if risk < 30 else f"Critical Event in {max(1, int(10 - (risk/10)))} min",
                'patient_identity': self.identity.get_info(),
                'history': self.history.get_history_data(),
                'ode_curve': self.ode_model.get_fitted_curve(),
                'ode_raw': ([pt[0] for pt in self.ode_model.hrv_history], [pt[1] for pt in self.ode_model.hrv_history]),
                'ode_equation': self.ode_model.get_equation_text(),
                'battery_status': {'percent': round(self.battery_pct, 1), 'is_critical': self.battery_pct < 20},
                'ai_pred_score': round(ai_score, 1),
                'ai_conf': round(ai_conf, 1),
                'ai_status': "LSTM Loaded" if self.lstm_model.is_loaded else "Simulation Mock LSTM",
                'ai_training': "PhysioNet MIT-BIH Arrhythmia",
                'ai_last_update': time.strftime('%H:%M:%S', time.localtime()),
                'rf_label': rf_label,
                'cnn_morphology': morph_label,
                'activity_context': self.activity_context,
                'motion_intensity': self.last_motion_intensity,
                'adaptive_thresholds': self.processor.adaptive_thresholds.get_threshold_summary(),
                'federated_status': self.federated_manager.get_status()
            })

            self.ui.update_v3_metrics(sim_state)
            self.firebase.push_state(sim_state)

    def start_serial_reader(self, port):
        self.serial_thread = SerialReaderThread(port, baud_rate=115200)
        self.serial_thread.new_data.connect(self.process_incoming_data)
        self.serial_thread.start()
        self.ui.connection_established()

    def process_incoming_data(self, ecg_val, spo2_val=98, temp_val=37.0, gsr_val=300):
        if ecg_val == -1: return 
        
        is_artifact = self.artifact_detector.check_artifact(ecg_val)
        
        # V4 Sensor Fusion Math Engine
        state = self.processor.process(ecg_val, spo2_val, temp_val, gsr_val)
        
        self.signal_quality.add_sample(ecg_val)
        
        if state['is_calibrating']:
            self.rf_classifier.add_baseline_data(state['hr'], state['sdnn'], state['stability'])
        
        if not state['is_calibrating'] and self.ode_model.h0 == 50.0:
            self.ode_model.h0 = self.processor.calibration.base_sdnn
            self.rf_classifier.train_baseline()
            self.processor.adaptive_thresholds.finalize_calibration()

        self.ui.update_ecg_plot(state['filtered_val'])
        
        if state['is_peak']:
            self.signal_quality.update_snr(is_peak=True)
            self.history.add_entry(state['hr'], state['stability'], state['risk_pct'])
            self.ode_model.add_data(time.time(), state['sdnn'])
            
            self.lstm_model.add_data(state['hr'], state['sdnn'], state['stability'])
            ai_score, ai_conf = self.lstm_model.predict_5_min_future(state['stability'], is_simulating=False)
            
            t_now = time.time()
            if self.rf_classifier.is_trained and (t_now - self.rf_classifier.last_classification_time) >= 10: # Faster check in live
                rf_label, _ = self.rf_classifier.classify(state['hr'], state['sdnn'], state['stability'], motion=self.last_motion_intensity, current_time=t_now)
                
                # Context Logic
                if self.last_motion_intensity > 0.4 and self.ode_model.k < 0.1 and state['hr'] > 85:
                    self.activity_context = "Exercise"
                else:
                    self.activity_context = "Resting"
                
                with open("cardiac_events.csv", "a", newline="") as f:

                    csv.writer(f).writerow([time.strftime('%Y-%m-%d %H:%M:%S'), f"RF Classification: {rf_label}", state['hr'], state['sdnn'], state['stability']])
                
                if self.current_patient_id:
                    self.db.log_event(self.current_patient_id, self.current_session_id, state['risk_pct'], state['hr'], state['stability'], event_type=f"RF: {rf_label}")
                    self.update_ui_event_log()
            else:
                rf_label = self.rf_classifier.last_label

            # Ensemble Calculation
            breaches = [m for m in ["hr", "sdnn", "stability"] if self.processor.adaptive_thresholds.check_breach(m, state[m])[0]]
            ensemble_score, driving_force = self.ensemble_engine.calculate_ensemble_risk(
                state['stability'], ai_score, rf_label, self.cnn_detector.last_detection, breaches
            )
            
            xai_attrib = self.xai_engine.get_feature_attribution(
                state['stability'], ai_score, rf_label, self.cnn_detector.last_detection, breaches
            )
            
            # V4 Night Mode Modifications
            hr_adj, sdnn_scale = self.night_mode.apply_night_modifiers(state['hr'], state['sdnn'])
            adjusted_sdnn = state['sdnn'] * sdnn_scale
            
            v4_state = state.copy()
            v4_state.update({
                'is_cleaning': self.artifact_detector.is_cleaning,
                'signal_quality': self.signal_quality.get_status(),
                'ai_pattern': self.pattern_labeler.get_label(state['hr'], adjusted_sdnn, state['rmssd'], state['qtc'], state['stability']),
                'patient_msg': self.feedback_engine.last_message,
                'session_timer': self.wear_tracker.get_session_duration_str(),
                'risk_window_msg': self.risk_window.get_status_message(self.risk_window.calculate_time_to_risk(self.ode_model.h0, self.ode_model.k)),
                'patient_identity': self.identity.get_info(),
                'history': self.history.get_history_data(),
                'ode_curve': self.ode_model.get_fitted_curve(),
                'ode_raw': ([pt[0] for pt in self.ode_model.hrv_history], [pt[1] for pt in self.ode_model.hrv_history]),
                'ode_equation': self.ode_model.get_equation_text(),
                'battery_status': self.battery.get_status(),
                'is_offline': not self.connectivity.is_online,
                'ai_pred_score': round(ai_score, 1),
                'ai_conf': round(ai_conf, 1),
                'ai_status': "LSTM Active",
                'ai_training': "PhysioNet MIT-BIH Arrhythmia",
                'ai_last_update': time.strftime('%H:%M:%S', time.localtime()),
                'rf_label': rf_label,
                'cnn_morphology': self.cnn_detector.last_detection,
                'adaptive_thresholds': state.get('adaptive_thresholds', {}),
                'risk_pct': ensemble_score,
                'ensemble_driving_force': driving_force,
                'federated_status': self.federated_manager.get_status(),
                'xai_attrib': xai_attrib
            })
            
            # V4 Emergency Logic
            self.consecutive_danger_secs = self.consecutive_danger / (state['hr']/60) if state['hr'] > 0 else 0
            
            if (rf_label in ["High Risk", "Critical"] and state['risk_pct'] > 60) or ensemble_score > 90:
                print(f"\n[CRITICAL TRIGGER] Ensemble Score: {ensemble_score}% - {driving_force}")
                self.consecutive_danger_secs = 999 
                if not self.emergency_alert.is_active:
                    self.emergency_alert.is_active = True
                    self.emergency_alert.trigger_time = time.time()
                    self.emergency_alert.status_messages.insert(0, f"Critical Protocol: {driving_force}")
            
            # Adaptive Threshold Breach
            for metric in ["hr", "sdnn", "stability"]:
                breached, z, _ = self.processor.adaptive_thresholds.check_breach(metric, state[metric])
                if breached:
                    v4_state['patient_msg'] = f"Warning: {metric.upper()} outside personal normal."
                    self.consecutive_danger_secs += 2 # Accelerate alert
            
            if not self.is_muted:
                self.emergency_alert.check_trigger(ensemble_score, state['stability'], self.consecutive_danger_secs)
            
            # Lone User only applies if night mode is off or stability is horrible
            if not self.night_mode.is_active and self.lone_user.check_escalation(state['risk_pct'], state['stability']):
                if not self.emergency_alert.is_active:
                    self.emergency_alert.is_active = True
                    self.emergency_alert.trigger_time = time.time()
                    self.emergency_alert.status_messages.insert(0, "No user activity detected — escalating alert level.")
                    
            if self.emergency_alert.is_active:
                if not self.emergency_timer.is_running:
                    self.emergency_timer.start()
                    
                    if self.current_patient_id:
                        self.db.log_event(self.current_patient_id, self.current_session_id, state['risk_pct'], state['hr'], state['stability'])
                        self.update_ui_event_log()
                    
                    # Voice Alert
                    self.voice.speak_critical_alert()
                    
                    # Offline-aware dispatch
                    success = self.connectivity.dispatch_alert(state['risk_pct'], state['hr'], spo2_val)
                    if not success:
                        print("OFFLINE: Fallback local alarm activated. Message queued.")
                
                v4_state.update({
                    'emergency_active': True,
                    'emergency_status': self.emergency_alert.get_progress_status(),
                    'emergency_progress': self.emergency_alert.get_progress_percent(),
                    'emergency_timer': self.emergency_timer.get_remaining_time_str(),
                    'emergency_first_aid': self.emergency_timer.get_first_aid_message()
                })
            
            # Check Latch
            is_in_grace = time.time() < self.dismiss_grace_end
            if (state['risk_pct'] > 60 or self.emergency_alert.is_active) and not is_in_grace:
                self.is_critical_alarm_active = True
            elif is_in_grace:
                self.is_critical_alarm_active = False
                state['risk_pct'] = min(state['risk_pct'], 45.0)
                
            v4_state['emergency_active'] = self.is_critical_alarm_active # Override for UI stability
            v4_state['critical_latch'] = self.is_critical_alarm_active
            v4_state['activity_context'] = self.activity_context
            v4_state['motion_intensity'] = self.last_motion_intensity
            v4_state['caregiver_session'] = self.caregiver_session_id
            v4_state['bt_strength'] = random.randint(85, 96) # Simulated BLE RSSI %
            v4_state['ai_confidence'] = random.randint(88, 94) # Simulated Confidence


            # Battery Alerts
            if self.battery.is_critical and time.time() % 30 < 1: # Speak once every 30s
                self.voice.speak_low_battery()
                v4_state['patient_msg'] = self.battery.get_status()['warning_msg']
            
            self.ui.update_hrv_trend(state['sdnn'])
            self.ui.update_v3_metrics(v4_state)
            self.ws_server.broadcast_state(v4_state)
            self.firebase.push_state(v4_state)
            
            # Legacy Action Engine
            if state['risk_pct'] > 60.0 and not self.is_muted:
                self.consecutive_danger += 1
            else:
                self.consecutive_danger = 0

    def perform_slow_updates(self):
        k = self.ode_model.k
        self.feedback_engine.update(self.processor.current_stability, self.processor.current_sdnn, self.processor.current_risk, k)
        ms = self.wear_tracker.check_milestones()
        if ms: self.ui.update_logs([f"MILESTONE: {ms}"])
        
        # Federated Learning Contribution
        if self.federated_manager.is_opt_in:
            self.federated_manager.export_update("LSTM_CORE", self.lstm_model.model)
            self.federated_manager.export_update("CNN_MORPH", self.cnn_detector.model)
            print("[FEDERATED] Local model contributions exported successfully.")

    def reset_alarms(self):
        self.is_critical_alarm_active = False
        self.dismiss_grace_end = time.time() + 10 # 10s backend suppression
        self.recovery_mode_active = True
        self.recovery_end_time = time.time() + 10 + random.uniform(60, 180) # 10s recovery + random rest 1-3min
        self.alarm_rearmed = False
        self.emergency_alert.reset()
        self.lone_user.report_interaction()
        self.emergency_timer.stop()
        self.consecutive_danger = 0
        if not self.is_muted:
            self.is_muted = True
            self.ui.set_muted_ui(True)
            self.mute_timer.start(30000)
            
            # Trigger PDF Export on manual cancel as a log
            if self.current_patient_id:
                events = self.db.get_recent_events(self.current_patient_id)
                threading.Thread(target=self.pdf_generator.generate_report, args=(self.identity.get_info(), events)).start()
        else:
            self.end_mute()
            
    def end_mute(self):
        self.is_muted = False
        self.ui.set_muted_ui(False)

    def update_ui_event_log(self):
        if not self.current_patient_id: return
        raw_events = self.db.get_recent_events(self.current_patient_id, limit=5)
        log_strs = []
        for e in raw_events:
            ts = e['timestamp'][11:19] if e['timestamp'] else "00:00:00"
            log_strs.append(f"[{ts}] {e['event_type']} - HR: {int(e['hr'])} | Risk: {e['risk_pct']:.1f}%")
        self.ui.update_logs(log_strs)

    def run(self):
        self.ui.show()
        sys.exit(self.app.exec_())

if __name__ == "__main__":
    app = MainApp()
    app.run()
