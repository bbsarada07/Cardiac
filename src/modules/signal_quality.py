import numpy as np
import time

class SignalQualityMonitor:
    """
    Feature D: Signal Quality Indicator
    Calculates SNR and provides quality status (Green/Amber/Red).
    """
    def __init__(self, sampling_rate=200):
        self.fs = sampling_rate
        self.snr = 0.0
        self.quality = "Clean" # Clean, Moderate, Poor
        self.consecutive_poor_start = 0
        self.alert_triggered = False
        
        self.buffer = []
        self.max_buffer_size = sampling_rate * 2 # 2 seconds of data
        
    def add_sample(self, val):
        self.buffer.append(val)
        if len(self.buffer) > self.max_buffer_size:
            self.buffer.pop(0)
            
    def update_snr(self, is_peak):
        """Calculates SNR based on signal variance vs noise variance."""
        if len(self.buffer) < self.max_buffer_size:
            return
            
        # Estimate signal power (RMS of recent buffer)
        # In a real system, we'd separate QRS from P-T segments, 
        # but for this module, common SNR approximation uses signal variance.
        sig_arr = np.array(self.buffer)
        
        # Simple noise estimation: assume noise is the component that isn't the heartbeat
        # We'll use the ratio of peak magnitude to baseline noise
        signal_amp = np.max(sig_arr) - np.min(sig_arr)
        noise_floor = np.std(sig_arr) # Standard deviation as noise estimate
        
        if noise_floor > 0:
            self.snr = 20 * np.log10(signal_amp / noise_floor)
        else:
            self.snr = 50.0 # Perfect signal
            
        # Classify
        if self.snr > 15:
            self.quality = "Clean"
            self.consecutive_poor_start = 0
            self.alert_triggered = False
        elif self.snr > 8:
            self.quality = "Moderate"
            self.consecutive_poor_start = 0
            self.alert_triggered = False
        else:
            self.quality = "Poor"
            if self.consecutive_poor_start == 0:
                self.consecutive_poor_start = time.time()
            elif time.time() - self.consecutive_poor_start > 15:
                self.alert_triggered = True

    def get_status(self):
        color = "#22c55e" # Green
        if self.quality == "Moderate": color = "#eab308" # Amber
        if self.quality == "Poor": color = "#ef4444" # Red
        
        return {
            "quality": self.quality,
            "snr": self.snr,
            "color": color,
            "alert": self.alert_triggered
        }
