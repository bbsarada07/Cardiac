import numpy as np

class EnsembleRiskEngine:
    """
    Upgrade 5: Ensemble Risk Engine.
    Unifies all four layers (Math, LSTM, RF, CNN) into a single clinical risk score.
    Includes Critical Override logic for high-risk morphologies or predictions.
    """
    def __init__(self):
        # Base weights for non-critical states
        self.weights = {
            "math": 0.35,      # Lyapunov/ODE Stability
            "lstm": 0.30,      # 5-min Predictor
            "rf": 0.20,        # Anomaly Classifier
            "cnn": 0.15        # Morphology Analysis
        }

    def calculate_ensemble_risk(self, math_stab, lstm_pred, rf_label, cnn_label, adaptive_breaches=None, activity_context="Resting"):
        """
        Calculates a 0-100 risk score with activity-context awareness.
        100 = Highest clinical risk.
        """
        is_exercise = (activity_context == "Exercise" or rf_label == "Exercise")
        
        # 1. Convert inputs to risk components (0-100 scale)
        math_risk = 100 - math_stab
        lstm_risk = 100 - lstm_pred
        
        # RF: Anomaly Label mapping (Exercise has 0 risk by default)
        rf_map = {"Normal": 0, "Early Warning": 30, "High Risk": 70, "Critical": 95, "Exercise": 0}
        rf_risk = rf_map.get(rf_label, 0)
        
        # CNN: Morphology Label mapping
        cnn_map = {"Normal": 0, "PVC Detected": 40, "ST Elevation": 90, "T-Wave Inversion": 60, "QRS Widening": 50}
        cnn_risk = cnn_map.get(cnn_label, 0)
        
        # 2. Critical Overrides (Safety Logic)
        # SAFETY OVERRIDE: Morphological danger ignores Activity Context
        if cnn_label == "ST Elevation":
            return 98, "CRITICAL MORPHOLOGY (ST Elevation) — Safety Override"
        
        if cnn_label in ["PVC Detected", "QRS Widening"] and rf_label == "Critical":
            return 92, "COMPLEX ARRYTHMIA (RF + CNN) — Override Active"

        # 3. Weighted Average (Reduce weights of Math/LSTM if in Exercise mode to avoid false positives)
        weight_math = self.weights["math"] if not is_exercise else 0.15
        weight_lstm = self.weights["lstm"] if not is_exercise else 0.15
        weight_rf = self.weights["rf"] if not is_exercise else 0.40 # Trust RF/Activity classifier more
        
        ensemble_score = (
            (math_risk * weight_math) +
            (lstm_risk * weight_lstm) +
            (rf_risk * weight_rf) +
            (cnn_risk * self.weights["cnn"])
        )
        
        # 4. Adaptive Penalty
        boost = 0
        if adaptive_breaches:
            # If in exercise, we ignore single breaches that often happen during tachycardia
            penalty = 3 if is_exercise else 5
            boost = len(adaptive_breaches) * penalty
            
        final_score = min(100, int(ensemble_score + boost))
        
        driving_force = "Mathematical Stability"
        if is_exercise: driving_force = "🏃 Exercise Mode (Adaptive)"
        elif lstm_risk > math_risk + 20: driving_force = "Predictive Drift"
        elif rf_risk > 60: driving_force = "Anomaly Classifier"
        elif cnn_risk > 30: driving_force = "Waveform Morphology"
        
        return final_score, driving_force
