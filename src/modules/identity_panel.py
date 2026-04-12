import json
import os

class PatientIdentityManager:
    """
    Feature J: Location and Identity Panel
    Manages patient personal and emergency contact information.
    """
    def __init__(self, config_path="patient_info.json"):
        self.config_path = config_path
        self.firebase_bridge = None
        self.data = {
            "name": "",
            "age": "",
            "sex": "",
            "conditions": "",
            "blood_type": "",
            "emergency_contact": "",
            "emergency_phone": ""
        }
        self.load_data()

    def load_data(self):
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    self.data.update(json.load(f))
            except:
                pass

    def save_data(self):
        try:
            with open(self.config_path, 'w') as f:
                json.dump(self.data, f, indent=4)
        except:
            pass

    def set_bridge(self, bridge):
        self.firebase_bridge = bridge

    def update_info(self, from_remote=False, **kwargs):
        self.data.update(kwargs)
        self.save_data()
        if not from_remote and self.firebase_bridge:
            self.firebase_bridge.update_patient_profile(self.data)

    def get_info(self):
        return self.data
