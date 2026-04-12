import time

class EmergencyTimer:
    """
    Feature K: Emergency Response Timer
    Handles the 8-minute countdown and rotating first-aid messages.
    """
    def __init__(self, countdown_mins=8):
        self.total_seconds = countdown_mins * 60
        self.start_time = 0
        self.is_running = False
        self.messages = [
            "Stay calm and lie down immediately.",
            "Do not eat or drink anything.",
            "Unlock your front door if possible for paramedics.",
            "Keep your phone nearby and on loud.",
            "Loosen any tight clothing around the neck.",
            "Try to maintain slow, regular breathing."
        ]
        self.msg_index = 0
        self.last_msg_time = 0

    def start(self):
        self.start_time = time.time()
        self.is_running = True
        self.last_msg_time = time.time()
        self.msg_index = 0

    def stop(self):
        self.is_running = False

    def get_remaining_time_str(self):
        if not self.is_running: return "08:00"
        
        elapsed = time.time() - self.start_time
        remaining = max(0, int(self.total_seconds - elapsed))
        
        mins = remaining // 60
        secs = remaining % 60
        return f"{mins:02d}:{secs:02d}"

    def get_first_aid_message(self):
        """Rotates messages every 30 seconds."""
        if not self.is_running: return ""
        
        if time.time() - self.last_msg_time > 30:
            self.msg_index = (self.msg_index + 1) % len(self.messages)
            self.last_msg_time = time.time()
            
        return self.messages[self.msg_index]

    def is_finished(self):
        if not self.is_running: return False
        return (time.time() - self.start_time) >= self.total_seconds
