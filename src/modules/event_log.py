import csv
import os
import time
from datetime import datetime

class EventLogger:
    """
    Feature 6: Timestamp Event Log
    Logs critical cardiac events to a CSV and stores the last 5 in memory for the UI.
    """
    def __init__(self, filename="cardiac_events.csv"):
        self.filename = filename
        self.recent_events = []
        
        # Create file with headers if it doesn't exist
        if not os.path.exists(self.filename):
            with open(self.filename, mode='w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Timestamp", "Risk_Pct", "HR", "SDNN", "RMSSD", "Stability", "QTc", "SpO2"])
                
    def log_event(self, risk_pct, hr, sdnn, rmssd, stability, qtc, spo2):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        event_str = f"[{timestamp}] RISK: {risk_pct:.1f}% | HR: {hr} | QTc: {qtc:.1f}"
        
        # Update memory limit for UI (last 5)
        self.recent_events.append(event_str)
        if len(self.recent_events) > 5:
            self.recent_events.pop(0)
            
        # Write to disk
        try:
            with open(self.filename, mode='a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([timestamp, risk_pct, hr, sdnn, rmssd, stability, qtc, spo2])
        except Exception as e:
            print(f"Failed to log event: {e}")
            
    def get_recent_events(self):
        return self.recent_events
