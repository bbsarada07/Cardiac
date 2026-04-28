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
            "contacts": [] # List of {name, phone}
        }
        self.load_data()

    def load_data(self):
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    raw_data = json.load(f)
                    self.data.update(raw_data)
                    
                    # Migration logic for older contact formats
                    if not self.data.get('contacts'):
                        migrated_contacts = []
                        # Check for contact1, contact2, contact3
                        for i in range(1, 4):
                            name = raw_data.get(f"contact{i}_name")
                            phone = raw_data.get(f"contact{i}_phone")
                            if name and phone:
                                migrated_contacts.append({"name": name, "phone": phone})
                        
                        # Fallback for old emergency_contact
                        if not migrated_contacts:
                            name = raw_data.get("emergency_contact") or raw_data.get("emergency_contact_name")
                            phone = raw_data.get("emergency_phone") or raw_data.get("emergency_contact_phone")
                            if name and phone:
                                migrated_contacts.append({"name": name, "phone": str(phone)})
                        
                        self.data['contacts'] = migrated_contacts
            except Exception as e:
                print(f"[IDENTITY] Load error: {e}")

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
