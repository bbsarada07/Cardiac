import time

class EmergencyAlertSystem:
    """
    Feature H: Automated Emergency Alert Simulation
    Handles the logic and sequence of the emergency alert.
    """
    def __init__(self):
        self.is_active = False
        self.trigger_time = 0
        self.last_status_update = 0
        self.status_index = 0
        self.status_messages = [
            "Attempting to establish connection...",
            "Connecting to nearest emergency hub...",
            "Transmitting patient health fingerprint...",
            "Location coordinates sent...",
            "Emergency services notified. Dispatch in progress.",
            "Stand by - Do not close this window."
        ]
        
    def check_trigger(self, risk_pct, stability, consecutive_danger_secs):
        """
        Triggers if risk > 85% or stability < 20 for > 15s.
        """
        if self.is_active: return True
        
        if risk_pct > 85.0 or (stability < 20.0 and consecutive_danger_secs >= 15):
            self.is_active = True
            self.trigger_time = time.time()
            self.last_status_update = time.time()
            self.status_index = 0
            return True
        return False

    def get_progress_status(self):
        """
        Simulates progress of emergency call.
        """
        if not self.is_active: return ""
        
        elapsed = time.time() - self.last_status_update
        if elapsed > 2.0 and self.status_index < len(self.status_messages) - 1:
            self.status_index += 1
            self.last_status_update = time.time()
            
        return self.status_messages[self.status_index]

    def reset(self):
        self.is_active = False
        self.status_index = 0

    def get_progress_percent(self):
        if not self.is_active: return 0
        # Smooth progress bar simulation
        total_time = len(self.status_messages) * 2.0
        elapsed = time.time() - self.trigger_time
        return min(100, int((elapsed / total_time) * 100))
