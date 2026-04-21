import numpy as np
from scipy.signal import butter, lfilter

# Import all V2 Modules
from .modules.hrv_analysis import HRVAnalyzer
from .modules.stability_score import StabilityAnalyzer
from .modules.qt_detection import QTDetection
from .modules.prediction_engine import RiskPredictor
from .modules.calibration import BaselineCalibration
from .modules.adaptive_thresholds import AdaptiveThresholdManager

class SensorFusionEngine:
    """
    V4 Feature: The orchestrator that streams data through all modules 
    and incorporates multi-sensor fusion (ECG, SpO2, Temp, GSR).
    """
    def __init__(self, sampling_rate=200):
        self.fs = sampling_rate
        
        # Hardware Integration (Bandpass Filter 0.5 - 40 Hz)
        nyq = 0.5 * self.fs
        self.b, self.a = butter(2, [0.5 / nyq, 40.0 / nyq], btype='band')
        
        self.raw_buffer = np.zeros(self.fs * 10) 
        self.filtered_buffer = np.zeros(self.fs * 10)
        
        # Beat Tracking
        self.threshold = 0
        self.last_peak_time = 0
        self.current_time = 0
        self.rr_intervals = []
        
        # EDR (Respiration)
        self.peak_amplitudes = []
        
        # Instantiate V2 Modules
        self.hrv = HRVAnalyzer()
        self.stability = StabilityAnalyzer()
        self.qt_detector = QTDetection(self.fs)
        self.predictor = RiskPredictor()
        self.calibration = BaselineCalibration(self.fs, calibration_seconds=60)
        self.adaptive_thresholds = AdaptiveThresholdManager(metrics=["hr", "sdnn", "stability"])
        
        # State variables
        self.current_hr = 0
        self.current_sdnn = 0.0
        self.current_rmssd = 0.0
        self.current_stability = 100.0
        self.current_qtc = 0.0
        self.current_risk = 0.0
        self.current_resp = 0
        self.last_r_peak_idx = -1

    def filter_signal(self):
        self.filtered_buffer = lfilter(self.b, self.a, self.raw_buffer)

    def process(self, value, spo2_val=98, temp_val=37.0, gsr_val=0):
        """
        Takes raw ECG point and auxiliary sensor data.
        Returns a dictionary of all metrics including Sensor Fusion modifications.
        """
        self.raw_buffer = np.roll(self.raw_buffer, -1)
        self.raw_buffer[-1] = value
        self.current_time += 1
        
        self.filter_signal()
        filtered_val = self.filtered_buffer[-1]
        
        # Tick the calibration engine
        is_calibrating = self.calibration.step()
        
        # --- QTc Delayed Detection ---
        if self.last_r_peak_idx > 0 and self.current_time > self.last_r_peak_idx + int(0.500 * self.fs):
            # Try to extract T-wave 500ms after the last R-peak
            buffer_idx = len(self.filtered_buffer) - 1 - (self.current_time - self.last_r_peak_idx)
            if buffer_idx > 0:
                current_rr = self.rr_intervals[-1] if len(self.rr_intervals) > 0 else 800
                qtc = self.qt_detector.get_qtc(self.filtered_buffer, buffer_idx, current_rr)
                if qtc > 0: self.current_qtc = qtc
            self.last_r_peak_idx = -1 # reset search

        # --- Peak Detection ---
        is_peak = False
        recent_max = np.max(self.filtered_buffer[-self.fs:])
        self.threshold = recent_max * 0.6 
        
        time_since_last = self.current_time - self.last_peak_time
        refractory = int(0.200 * self.fs)
        
        if filtered_val > self.threshold and time_since_last > refractory:
            if self.filtered_buffer[-2] > filtered_val and self.filtered_buffer[-2] > self.threshold:
                is_peak = True
                self.last_r_peak_idx = self.current_time - 1
                
                # Respiration Tracking (EDR)
                self.peak_amplitudes.append(self.filtered_buffer[-2])
                if len(self.peak_amplitudes) > 60: self.peak_amplitudes.pop(0)
                
                if self.last_peak_time > 0:
                    rr_ms = (time_since_last / self.fs) * 1000
                    if 300 < rr_ms < 2000:
                        self.rr_intervals.append(rr_ms)
                        if len(self.rr_intervals) > 60:
                            self.rr_intervals.pop(0)
                
                self.last_peak_time = self.current_time - 1
                
                # --- Fire Math Modules on Heartbeat ---
                if len(self.rr_intervals) > 0:
                    avg_rr = np.mean(self.rr_intervals[-5:])
                    self.current_hr = int(60000 / avg_rr) if avg_rr > 0 else 0
                    
                if len(self.rr_intervals) >= 10:
                    # Feature 1: HRV
                    self.current_sdnn, self.current_rmssd = self.hrv.calculate_metrics(self.rr_intervals)
                    # Feature 2: Stability Score
                    self.current_stability = self.stability.calculate(self.rr_intervals)
                    
                    # Feature 5: Inject to Calibration Memory
                    self.calibration.add_data(self.current_hr, self.current_sdnn, self.current_stability)
                    
                    if is_calibrating:
                        self.adaptive_thresholds.add_calibration_point("hr", self.current_hr)
                        self.adaptive_thresholds.add_calibration_point("sdnn", self.current_sdnn)
                        self.adaptive_thresholds.add_calibration_point("stability", self.current_stability)
                    else:
                        # Slow drift update
                        self.adaptive_thresholds.update_drift("hr", self.current_hr)
                        self.adaptive_thresholds.update_drift("sdnn", self.current_sdnn)
                        self.adaptive_thresholds.update_drift("stability", self.current_stability)
                    
                    # Feature 4: Base Risk Prediction %
                    base_risk = self.predictor.calculate_risk(
                        self.current_hr, self.current_sdnn, self.current_stability, 
                        self.current_qtc, spo2_val, self.calibration
                    )
                    
                    # V4 Feature: Sensor Fusion Multipliers
                    temp_multiplier = 1.0 + max(0, abs(temp_val - 37.0) * 0.1) 
                    stress_factor = 1.2 if gsr_val > 500 else 1.0 # >500 implies high sympathetic arousal
                    fusion_risk = base_risk * temp_multiplier * stress_factor
                    self.current_risk = min(100.0, fusion_risk)
                    
        # --- Respiration (EDR) Calculation ---
        if len(self.peak_amplitudes) >= 20:
            # Look for cycles in peak amplitudes (breathing affects R-peak height)
            amps = np.array(self.peak_amplitudes)
            amps_detrend = amps - np.mean(amps)
            crossings = np.where(np.diff(np.sign(amps_detrend)))[0]
            if len(crossings) > 2:
                # breaths = count crossings / 2
                resps_in_window = len(crossings) / 2
                time_span = (len(self.peak_amplitudes) / (self.current_hr / 60)) if self.current_hr > 0 else 60
                self.current_resp = int((resps_in_window / time_span) * 60)
                self.current_resp = max(8, min(25, self.current_resp)) # Clamp to human range
            else:
                self.current_resp = 16 # Default

        # Return state dictionary
        return {
            "filtered_val": filtered_val,
            "is_peak": is_peak,
            "hr": self.current_hr,
            "sdnn": self.current_sdnn,
            "rmssd": self.current_rmssd,
            "stability": self.current_stability,
            "qtc": self.current_qtc,
            "resp": self.current_resp,
            "risk_pct": self.current_risk,
            "is_calibrating": is_calibrating,
            "cal_progress": self.calibration.get_progress_percent(),
            "spo2": spo2_val,
            "adaptive_thresholds": self.adaptive_thresholds.get_threshold_summary()
        }
