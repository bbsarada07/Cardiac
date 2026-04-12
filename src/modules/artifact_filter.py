import time

class ArtifactDetector:
    """
    Feature C: Motion Artifact Filter Indicator
    Detects sudden spikes and amplitude jumps in the raw ECG signal.
    """
    def __init__(self, threshold_spike=1000, jump_limit=400):
        self.is_cleaning = False
        self.artifact_start_time = 0
        self.session_start_time = time.time()
        self.total_artifact_duration = 0
        self.last_val = 0
        self.consecutive_artifacts = 0
        
    def check_artifact(self, raw_val):
        """
        Checks if the current sample is an artifact.
        Thresholds are based on typical AD8232 ranges.
        """
        is_spike = abs(raw_val) > 2000 # Extreme saturation
        is_jump = abs(raw_val - self.last_val) > 600 # Sudden jump
        
        self.last_val = raw_val
        
        if is_spike or is_jump:
            if not self.is_cleaning:
                self.is_cleaning = True
                self.artifact_start_time = time.time()
            self.consecutive_artifacts = 200 # Flag for 1 second of "cleaning" message (at 200Hz)
            return True
        else:
            if self.consecutive_artifacts > 0:
                self.consecutive_artifacts -= 1
                if self.consecutive_artifacts == 0:
                    self.is_cleaning = False
                    # Accumulate duration
                    if self.artifact_start_time > 0:
                        self.total_artifact_duration += (time.time() - self.artifact_start_time)
                        self.artifact_start_time = 0
            return False

    def get_artifact_percentage(self):
        """Returns % of session duration that was noisy."""
        total_session = time.time() - self.session_start_time
        if total_session <= 0: return 0.0
        
        current_active = 0
        if self.is_cleaning and self.artifact_start_time > 0:
            current_active = time.time() - self.artifact_start_time
            
        return ((self.total_artifact_duration + current_active) / total_session) * 100.0
