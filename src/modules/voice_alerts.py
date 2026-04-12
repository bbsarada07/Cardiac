import pyttsx3
import threading

class VoiceSynthesizer:
    """
    V4 Feature: Voice Alerts.
    Overrides standard beeps with instructional spoken audio.
    Runs asynchronously to avoid blocking the UI thread.
    """
    def __init__(self):
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 150) # Slower, clear speech
        self.engine.setProperty('volume', 1.0) # Max volume
        self.is_speaking = False

    def speak(self, text):
        if self.is_speaking:
            return
            
        def run_speech():
            self.is_speaking = True
            try:
                # Need separate init per thread on Windows/SAPI5 sometimes, but let's try standard
                engine = pyttsx3.init()
                engine.setProperty('rate', 150)
                engine.say(text)
                engine.runAndWait()
            except Exception as e:
                print(f"Speech error: {e}")
            finally:
                self.is_speaking = False

        threading.Thread(target=run_speech, daemon=True).start()

    def speak_critical_alert(self):
        self.speak("Critical Warning. Heart rate anomaly detected. Please check on patient immediately.")
        
    def speak_low_battery(self):
        self.speak("Warning. Battery is critically low. Please connect the charger.")
