class ExplainableAIEngine:
    """
    Upgrade 7: XAI (Explainable AI) Engine.
    Provides real-time feature attribution for the Ensemble Risk Score.
    Visualizes the "Why" behind clinical decisions.
    """
    def __init__(self):
        pass

    def get_feature_attribution(self, math_stab, lstm_pred, rf_label, cnn_label, adaptive_breaches=None):
        """
        Calculates local feature importance (0-100 scale for each feature).
        """
        # 1. Base contributions (Raw Risk Components)
        math_risk = 100 - math_stab
        lstm_risk = 100 - lstm_pred
        
        # RF Anomaly mapping
        rf_map = {"Normal": 5, "Early Warning": 30, "High Risk": 70, "Critical": 95}
        rf_risk = rf_map.get(rf_label, 0)
        
        # CNN Morphology mapping
        cnn_map = {"Normal": 2, "PVC Detected": 40, "ST Elevation": 95, "T-Wave Inversion": 65, "QRS Widening": 55}
        cnn_risk = cnn_map.get(cnn_label, 0)
        
        # Adaptive Penalty
        breach_count = len(adaptive_breaches) if adaptive_breaches else 0
        drift_risk = min(100, breach_count * 25)

        # 2. Critical Weighting (XAI Focus)
        # If a model triggers a critical override, it should dominate the explanation
        if cnn_label == "ST Elevation":
            return {
                "Mathematical Stability": 5,
                "Predictive Future": 5,
                "Anomaly Baseline": 5,
                "Waveform Morphology": 95,
                "Adaptive Drift": 5
            }
            
        if lstm_pred < 40:
            return {
                "Mathematical Stability": 20,
                "Predictive Future": 80,
                "Anomaly Baseline": 10,
                "Waveform Morphology": 10,
                "Adaptive Drift": 10
            }

        # 3. Normalized Relativistic Attribution
        total = math_risk + lstm_risk + rf_risk + cnn_risk + drift_risk + 1 # avoid div by zero
        
        attrib = {
            "Mathematical Stability": round((math_risk / total) * 100),
            "Predictive Future": round((lstm_risk / total) * 100),
            "Anomaly Baseline": round((rf_risk / total) * 100),
            "Waveform Morphology": round((cnn_risk / total) * 100),
            "Adaptive Drift": round((drift_risk / total) * 100)
        }
        
        return attrib
