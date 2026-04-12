import time

class LoneUserMonitor:
    """
    Feature I: Lone User Detection
    Tracks application interaction and escalates alerts if user is unresponsive.
    """
    def __init__(self, timeout_mins=5):
        self.timeout_seconds = timeout_mins * 60
        self.last_interaction_time = time.time()
        self.is_escalated = False

    def report_interaction(self):
        """User clicked, moved mouse, or pressed key."""
        self.last_interaction_time = time.time()
        self.is_escalated = False

    def check_escalation(self, risk_pct, stability):
        """
        Escalates if in "Caution" state and timeout reached.
        Caution: Stability 40-70 OR Risk 40-75.
        """
        if self.is_escalated: return True
        
        is_caution = (40 <= stability <= 70) or (40 <= risk_pct <= 75)
        elapsed = time.time() - self.last_interaction_time
        
        if is_caution and elapsed > self.timeout_seconds:
            self.is_escalated = True
            return True
            
        return False

    def get_time_since_interaction(self):
        return int(time.time() - self.last_interaction_time)
        
    def get_remaining_seconds(self):
        elapsed = time.time() - self.last_interaction_time
        return max(0, int(self.timeout_seconds - elapsed))
