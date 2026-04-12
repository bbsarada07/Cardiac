import numpy as np

class StabilityAnalyzer:
    """
    Feature 2: Enhanced Lyapunov Stability Score
    Converts raw Lyapunov/Poincare chaos metrics into a 0-100 human readable score.
    """
    def calculate(self, rr_intervals):
        if len(rr_intervals) < 2:
            return 100.0
            
        rr = np.array(rr_intervals)
        diff_rr = np.diff(rr)
        rmssd = np.sqrt(np.mean(diff_rr**2))
        
        # Non-linear Poincare geometry
        sd1 = np.sqrt(0.5 * np.var(diff_rr))
        rr_n = rr[:-1]
        rr_n1 = rr[1:]
        sd2 = np.sqrt(0.5 * np.var(rr_n + rr_n1))
        
        # Normalization
        score_rmssd = min(100, (rmssd / 40.0) * 100)
        ratio = sd1 / sd2 if sd2 > 0 else 0
        score_ratio = min(100, (ratio / 0.15) * 100)
        
        final_score = (score_rmssd * 0.5) + (score_ratio * 0.5)
        return float(max(0, min(100, final_score)))
