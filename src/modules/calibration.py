class BaselineCalibration:
    """
    Feature 5: Per-User Baseline Calibration
    Learns the user's normal baseline for the first 60 seconds.
    """
    def __init__(self, fs=200, calibration_seconds=60):
        self.fs = fs
        self.cal_samples = fs * calibration_seconds
        self.samples_processed = 0
        self.is_calibrated = False
        
        # History arrays
        self.hr_history = []
        self.hrv_sdnn_history = []
        self.stability_history = []
        
        # Baseline metrics (Defaults if no data)
        self.base_hr = 70.0
        self.base_sdnn = 50.0
        self.base_stability = 100.0
        
    def add_data(self, hr, sdnn, stability):
        if self.is_calibrated: return
        if hr > 0: self.hr_history.append(hr)
        if sdnn > 0: self.hrv_sdnn_history.append(sdnn)
        self.stability_history.append(stability)
        
    def step(self):
        """Called every raw sample (e.g. 200 times a second). Returns True if calibrating."""
        if self.is_calibrated: return False
        
        self.samples_processed += 1
        if self.samples_processed >= self.cal_samples:
            self._finalize_calibration()
            return False
            
        return True
        
    def _finalize_calibration(self):
        self.is_calibrated = True
        if len(self.hr_history) > 0:
            self.base_hr = sum(self.hr_history) / len(self.hr_history)
        if len(self.hrv_sdnn_history) > 0:
            self.base_sdnn = sum(self.hrv_sdnn_history) / len(self.hrv_sdnn_history)
        if len(self.stability_history) > 0:
            self.base_stability = sum(self.stability_history) / len(self.stability_history)
        print(f"[CALIBRATION COMPLETE] HR: {self.base_hr:.1f}, SDNN: {self.base_sdnn:.1f}")
        
    def get_progress_percent(self):
        return min(100, int((self.samples_processed / self.cal_samples) * 100))
