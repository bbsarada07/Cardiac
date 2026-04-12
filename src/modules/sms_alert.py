import json
import time
from datetime import datetime

class SMSAlerter:
    """
    Feature 9: Emergency SMS Alert
    Sends a Twilio SMS after 10 seconds of >75% risk probability.
    Loads settings from config.json.
    """
    def __init__(self, config_path="config.json"):
        self.config_path = config_path
        self._load_config()
        self.last_sent = 0
        
    def _load_config(self):
        try:
            with open(self.config_path, 'r') as f:
                self.config = json.load(f)
        except:
            # Default config creation
            self.config = {
                "patient_name": "Primary Patient",
                "emergency_contact": "+15550199",
                "twilio_sid": "mock_sid",
                "twilio_token": "mock_token",
                "twilio_from": "+15550100"
            }
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=4)
                
    def trigger_alert(self, risk_pct, hr, spo2):
        # Rate limit to 1 SMS every 5 minutes to prevent spam
        if time.time() - self.last_sent < 300:
            return False
            
        name = self.config.get("patient_name", "Patient")
        contact = self.config.get("emergency_contact", "911")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        msg = f"EMERGENCY ALERT: {name} | Risk: {risk_pct:.1f}% | HR: {hr} | SpO2: {spo2}% | Time: {timestamp}"
        
        print("\n" + "="*50)
        print("!!! [TWILIO API STUB] DISPATCHING SMS !!!")
        print(f"To: {contact}")
        print(f"Message: {msg}")
        print("="*50 + "\n")
        
        self.last_sent = time.time()
        return True
