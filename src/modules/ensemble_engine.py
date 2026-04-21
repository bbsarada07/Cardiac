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

    def calculate_ensemble_risk(self, math_stab, lstm_pred, rf_label, cnn_label, adaptive_breaches=None):
        """
        Calculates a 0-100 risk score.
        100 = Highest clinical risk.
        """
        # 1. Convert inputs to risk components (0-100 scale)
        # Math: Stability (inverse, higher risk if low stability)
        math_risk = 100 - math_stab
        
        # LSTM: Predicted 5-min Stability (inverse)
        lstm_risk = 100 - lstm_pred
        
        # RF: Anomaly Label mapping
        rf_map = {"Normal": 0, "Early Warning": 30, "High Risk": 70, "Critical": 95}
        rf_risk = rf_map.get(rf_label, 0)
        
        # CNN: Morphology Label mapping
        cnn_map = {"Normal": 0, "PVC Detected": 40, "ST Elevation": 90, "T-Wave Inversion": 60, "QRS Widening": 50}
        cnn_risk = cnn_map.get(cnn_label, 0)
        
        # 2. Critical Overrides (Safety Logic)
        if cnn_label == "ST Elevation":
            return 98, "CRITICAL MORPHOLOGY (ST Elevation)"
        
        if lstm_pred < 40 and math_stab < 50:
            return 95, "CONVERGENT DECLINE (Math + LSTM)"
            
        if rf_label == "Critical" and cnn_label in ["PVC Detected", "QRS Widening"]:
            return 92, "COMPLEX ARRYTHMIA (RF + CNN)"

        # 3. Weighted Average
        ensemble_score = (
            (math_risk * self.weights["math"]) +
            (lstm_risk * self.weights["lstm"]) +
            (rf_risk * self.weights["rf"]) +
            (cnn_risk * self.weights["cnn"])
        )
        
        # 4. Adaptive Penalty (Bonus risk if metrics are outside personal normal)
        boost = 0
        if adaptive_breaches:
            # Each breach adds a small confidence boost to the risk
            boost = len(adaptive_breaches) * 5
            
        final_score = min(100, int(ensemble_score + boost))
        
        driving_force = "Mathematical Stability"
        if lstm_risk > math_risk + 20: driving_force = "Predictive Drift"
        if rf_risk > 60: driving_force = "Anomaly Classifier"
        if cnn_risk > 30: driving_force = "Waveform Morphology"
        
        return final_score, driving_force
