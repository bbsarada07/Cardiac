import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
import time
import os
import threading

class FirebaseBridge:
    def __init__(self, key_path="firebase-adminsdk.json", database_url=None):
        """
        Initializes the Firebase Admin SDK.
        Requires a 'firebase-adminsdk.json' file locally, and the Realtime Database URL.
        """
        self.is_connected = False
        
        # We will fail gracefully if the creds are missing so the rest of the app doesn't crash on startup.
        if not os.path.exists(key_path):
            print(f"FIREBASE OFFLINE: Could not find credentials at {key_path}")
            return
            
        if not database_url:
            # We enforce passing a explicitly or using a fixed one if it's set in code.
            print("FIREBASE OFFLINE: No database URL provided.")
            return

        try:
            cred = credentials.Certificate(key_path)
            # Check if already initialized (prevents crash on auto-reloads)
            if not len(firebase_admin._apps):
                firebase_admin.initialize_app(cred, {
                    'databaseURL': database_url
                })
            self.live_ref = db.reference('/cardiac_state')
            self.profile_ref = db.reference('/patient_profile')
            self.is_connected = True
            print("FIREBASE ONLINE: Successfully connected to Realtime Database.")
        except Exception as e:
            print(f"FIREBASE ERROR: Failed to initialize: {e}")

    def push_state(self, state_dict):
        """
        Pushes the current state telemetry dictionary to Firebase.
        """
        if not self.is_connected:
            return
            
        try:
            # Add a timestamp so the mobile app knows when the data was last updated
            payload = state_dict.copy()
            payload['last_updated'] = time.time()
            
            # Use .set() to overwrite the current live state, treating it as a dynamic mirror.
            self.live_ref.set(payload)
        except Exception as e:
            # Suppress excessive logging if internet drops temporarily
            pass

    def sync_patient_profile(self, callback):
        if not self.is_connected: return
        def listener(event):
            try:
                if event.data is not None:
                    callback(event.data)
            except: pass
        
        # Run listener in a background thread so we don't block
        threading.Thread(target=lambda: self.profile_ref.listen(listener), daemon=True).start()

    def update_patient_profile(self, data_dict):
        if not self.is_connected: return
        try:
            self.profile_ref.update(data_dict)
        except Exception as e:
            print(f"FIREBASE ERROR: profile update failed: {e}")
