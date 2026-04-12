import numpy as np

class HRVAnalyzer:
    """
    Feature 1: HRV Analysis Module
    Calculates SDNN (Standard Deviation of NN intervals) and
    RMSSD (Root Mean Square of Successive Differences) in real-time.
    """
    def __init__(self):
        pass
        
    def calculate_metrics(self, rr_intervals):
        if len(rr_intervals) < 2:
            return 0.0, 0.0
            
        rr = np.array(rr_intervals)
        
        # SDNN
        sdnn = np.std(rr)
        
        # RMSSD
        diff_rr = np.diff(rr)
        rmssd = np.sqrt(np.mean(diff_rr**2))
        
        return float(sdnn), float(rmssd)
