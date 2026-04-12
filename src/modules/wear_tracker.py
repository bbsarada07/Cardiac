import time
from datetime import timedelta

class WearTracker:
    """
    Feature F: Wear Duration Tracker
    Tracks how long the patient has been wearing the device.
    """
    def __init__(self):
        self.session_start = time.time()
        self.daily_total_seconds = 0
        self.last_milestone_notified = 0 # in minutes
        
    def get_session_duration_str(self):
        elapsed = int(time.time() - self.session_start)
        return str(timedelta(seconds=elapsed))

    def get_daily_total_str(self, current_session_included=True):
        total = self.daily_total_seconds
        if current_session_included:
            total += int(time.time() - self.session_start)
        return str(timedelta(seconds=total))

    def check_milestones(self):
        """
        Returns a milestone message if a new threshold is passed.
        Passes every 30 minutes.
        """
        elapsed_mins = int((time.time() - self.session_start) / 60)
        
        # Check milestones: 30, 60, 120, 180...
        milestones = [30, 60, 120, 180, 240, 300, 360, 480, 720]
        for m in milestones:
            if elapsed_mins >= m and self.last_milestone_notified < m:
                self.last_milestone_notified = m
                hours = m // 60
                if hours > 0:
                    return f"{hours} hours of continuous monitoring completed."
                else:
                    return "30 minutes of continuous monitoring completed."
        return None

    def get_duration_seconds(self):
        return int(time.time() - self.session_start)
