import time
import numpy as np

class SessionHistoryRecorder:
    """
    Feature L: Session History Panel
    Records and provides the last 30 minutes of cardiac metrics for visualization.
    """
    def __init__(self, history_mins=30):
        self.history_seconds = history_mins * 60
        self.timestamps = []
        self.hr_history = []
        self.stability_history = []
        self.risk_history = []
        self.alert_markers = [] # List of timestamps where alerts occurred

    def clear_history(self):
        self.timestamps = []
        self.hr_history = []
        self.stability_history = []
        self.risk_history = []
        self.alert_markers = []

    def add_entry(self, hr, stability, risk_pct, timestamp=None):
        now = timestamp if timestamp is not None else time.time()
        self.timestamps.append(now)
        self.hr_history.append(hr)
        self.stability_history.append(stability)
        self.risk_history.append(risk_pct)
        
        # Prune old data
        while self.timestamps and (now - self.timestamps[0] > self.history_seconds):
            self.timestamps.pop(0)
            self.hr_history.pop(0)
            self.stability_history.pop(0)
            self.risk_history.pop(0)
            
        # Prune old alert markers
        while self.alert_markers and (now - self.alert_markers[0] > self.history_seconds):
            self.alert_markers.pop(0)

    def log_alert_marker(self):
        self.alert_markers.append(time.time())

    def get_history_data(self):
        """Returns relative time (seconds from start of window) and metrics."""
        if not self.timestamps:
            return np.array([]), np.array([]), np.array([]), np.array([]), np.array([])
            
        base_time = self.timestamps[0]
        rel_times = np.array(self.timestamps) - base_time
        
        # Calculate relative alert markers
        rel_alerts = []
        for a in self.alert_markers:
            if a >= base_time:
                rel_alerts.append(a - base_time)
                
        return rel_times, np.array(self.hr_history), np.array(self.stability_history), np.array(self.risk_history), np.array(rel_alerts)
