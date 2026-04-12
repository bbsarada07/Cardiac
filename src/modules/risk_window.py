import numpy as np

class RiskWindowPredictor:
    """
    Feature B: Predictive Risk Window
    Calculates the time until HRV reaches a critical threshold based on the ODE decay model.
    """
    def __init__(self, critical_threshold=20.0):
        self.critical_threshold = critical_threshold
        
    def calculate_time_to_risk(self, h0, k):
        """
        Solves for t in H(t) = H0 * e^(-kt) where H(t) = critical_threshold.
        t = -ln(threshold / H0) / k
        """
        if k <= 0:
            return None # Trend is stable or improving
            
        try:
            # H_threshold = H0 * exp(-k * t)
            # ln(H_threshold / H0) = -k * t
            # t = -ln(H_threshold / H0) / k
            
            # Ensure we don't take log of non-positive
            if self.critical_threshold <= 0 or h0 <= 0:
                return None
                
            t_mins = -np.log(self.critical_threshold / h0) / k
            
            # If t_mins is negative, it means we already passed the threshold theoretically
            # but we'll cap it at 0.
            return max(0.0, float(t_mins))
        except:
            return None

    def get_status_message(self, t_mins):
        """Returns the dashboard display string."""
        if t_mins is None:
            return "Trend stable — no risk window projected."
        else:
            return f"At current trend — risk threshold in {t_mins:.1f} minutes."
