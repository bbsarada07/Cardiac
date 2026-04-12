import numpy as np

class QTDetection:
    """
    Feature 3: QRS Complex and QT Interval Detection
    Extracts waves and calculates Bazett's QTc.
    """
    def __init__(self, fs=200):
        self.fs = fs
        
    def get_qtc(self, buffer, r_peak_index, current_rr_ms):
        """
        Searches forward from the R-peak (index) to find the T-wave.
        This operates on a delayed buffer since T-wave happens ~300ms after R-peak.
        Returns QTc in ms.
        """
        if current_rr_ms <= 0:
            return 0.0
            
        # 1. T-wave search window (approx 100ms to 400ms after R-peak)
        start_idx = r_peak_index + int(0.100 * self.fs)
        end_idx = r_peak_index + int(0.450 * self.fs)
        
        if end_idx >= len(buffer):
            # Not enough future data yet
            return -1.0
            
        # The T-wave is the local maxima in this window 
        search_window = buffer[start_idx:end_idx]
        if len(search_window) == 0: return 0.0
        
        t_wave_local_idx = np.argmax(search_window)
        t_wave_global_idx = start_idx + t_wave_local_idx
        
        # Calculate raw QT interval in ms (from Q-onset to T-offset). 
        # For real-time AD8232 limits, we approximate R-peak to T-peak width + constant offset.
        qt_raw_samples = (t_wave_global_idx - r_peak_index) + int(0.04 * self.fs) # add ~40ms for QRS width
        qt_raw_ms = (qt_raw_samples / self.fs) * 1000.0
        
        # Bazett's Formula: QTc = QT / sqrt(RR_in_seconds)
        rr_sec = current_rr_ms / 1000.0
        qtc = qt_raw_ms / np.sqrt(rr_sec)
        
        return float(qtc)
