import numpy as np
from sklearn.ensemble import RandomForestClassifier
import time

class RFAnomalyClassifier:
    """
    Upgrade 2: Random Forest Personal Baseline Anomaly Classifier.
    Trains dynamically on the user's initial 60-second baseline.
    """
    def __init__(self):
        self.classifier = RandomForestClassifier(n_estimators=50, random_state=42)
        self.is_trained = False
        
        # Buffer for baseline data (collected during 60s calib)
        self.baseline_hr = []
        self.baseline_sdnn = []
        self.baseline_stability = []
        
        self.last_classification_time = 0
        self.last_label = "Calibrating..."
        self.last_confidence = 0.0

        self.labels = ["Normal", "Early Warning", "High Risk", "Critical", "Exercise"]

    def add_baseline_data(self, hr, sdnn, stability):
        if not self.is_trained:
            self.baseline_hr.append(hr)
        self.baseline_sdnn.append(sdnn)
        self.baseline_stability.append(stability)
        self.baseline_motion = [] # Will be 0 during calibration usually

    def train_baseline(self):
        """
        Takes the user's specific baseline data and synthetically generates 
        deviations to train the Random Forest on 'what anomalous looks like' 
        for this exact user.
        """
        if len(self.baseline_hr) < 10:
            print("[RF MODULE] Not enough baseline data. Cannot train.")
            return

        base_hr = np.mean(self.baseline_hr)
        base_sdnn = np.mean(self.baseline_sdnn)
        base_stab = np.mean(self.baseline_stability)
        
        std_hr = np.std(self.baseline_hr) + 2.0
        std_sdnn = np.std(self.baseline_sdnn) + 5.0
        std_stab = np.std(self.baseline_stability) + 2.0
        
        # Baseline motion is assumed to be 0 (resting)
        base_motion = 0.0
        std_motion = 0.05

        X = []
        y = []

        # Generate synthetic classes based on personal baseline
        num_samples_per_class = 200

        for _ in range(num_samples_per_class):
            # Class 0: Normal (within bounds)
            X.append([
                np.random.normal(base_hr, std_hr), 
                np.random.normal(base_sdnn, std_sdnn), 
                np.random.normal(base_stab, std_stab),
                np.random.normal(0.02, 0.01) # Low motion
            ])
            y.append(0)

            # Class 1: Early Warning (drift)
            dir_stab = np.random.choice([-1, 1])
            X.append([
                np.random.normal(base_hr + 15 * np.random.choice([-1, 1]), std_hr * 1.5), 
                np.random.normal(base_sdnn - 15, std_sdnn * 1.5), 
                np.random.normal(base_stab - 15, std_stab * 1.5),
                np.random.normal(0.05, 0.05)
            ])
            y.append(1)

            # Class 2: High Risk (significant drop in SDNN/Stab, HR spike)
            X.append([
                np.random.normal(base_hr + 35 * np.random.choice([-1, 1]), std_hr * 2.0), 
                np.random.normal(base_sdnn - 35, std_sdnn * 2.0), 
                np.random.normal(base_stab - 40, std_stab * 2.0),
                np.random.normal(0.08, 0.05)
            ])
            y.append(2)

            # Class 3: Critical (extreme deviation)
            X.append([
                np.random.normal(base_hr + 60 * np.random.choice([-1, 1]), std_hr * 3.0), 
                np.random.normal(base_sdnn - 50, std_sdnn * 2.0), 
                np.random.normal(base_stab - 70, std_stab * 2.0),
                np.random.normal(0.1, 0.05) # Low motion even in critical (unless seizure?)
            ])
            y.append(3)

            # Class 4: Exercise (High HR, Good Stability, HIGH MOTION)
            X.append([
                np.random.normal(base_hr + 40, std_hr * 1.5), 
                np.random.normal(base_sdnn - 5, std_sdnn * 1.5), 
                np.random.normal(base_stab - 5, std_stab * 1.5),
                np.random.normal(0.6, 0.2) # High motion intensity
            ])
            y.append(4)


        X = np.array(X)
        y = np.array(y)

        # Train model locally
        self.classifier.fit(X, y)
        self.is_trained = True
        self.last_label = "Baseline Learned (Normal)"
        print("[RF MODULE] Trained personal Random Forest classifier.")

    def classify(self, hr, sdnn, stability, motion=0.0, current_time=None):
        if not self.is_trained:
            return "Calibrating...", 0.0

        t = current_time if current_time else time.time()
        
        # Only evaluate every 30 seconds
        if t - self.last_classification_time >= 30:
            probs = self.classifier.predict_proba([[np.float64(hr), np.float64(sdnn), np.float64(stability), np.float64(motion)]])[0]
            class_idx = np.argmax(probs)
            self.last_label = self.labels[class_idx]
            self.last_confidence = probs[class_idx] * 100
            self.last_classification_time = t
            
        return self.last_label, self.last_confidence
