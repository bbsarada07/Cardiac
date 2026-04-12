class RiskPredictor:
    """
    Feature 4: Prediction Confidence Percentage
    Calculates a 0-100% Risk of Cardiac Arrest dynamically.
    """
    def calculate_risk(self, hr, sdnn, stability, qtc, spo2, baseline_sys):
        # Prevent false alarms during startup by forcing 0 risk while calibrating
        if not baseline_sys.is_calibrated:
            return 0.0 
            
        risk = 0.0
        
        # 1. Stability drops vs user's personal baseline (Max Weight: 40%)
        stab_drop_ratio = stability / max(1, baseline_sys.base_stability)
        if stab_drop_ratio < 0.7: 
            risk += 40 * (1 - stab_drop_ratio)
        
        # 2. HRV (SDNN) drops (Max Weight: 20%)
        sdnn_drop_ratio = sdnn / max(1, baseline_sys.base_sdnn)
        if sdnn_drop_ratio < 0.6: 
            risk += 20 * (1 - sdnn_drop_ratio)
        
        # 3. QTc Prolongation (Max Weight: 20%)
        # > 450ms is borderline, > 500ms is dangerous
        if qtc > 450:
            risk += min(20, (qtc - 450) / 2)
            
        # 4. SpO2 Drop Fusion (Max Weight: 20%)
        if spo2 < 95:
            risk += min(20, (95 - spo2) * 3)
            
        # 5. Heart Rate Extremes Penalty (Flat 10% bonus risk)
        if hr > 160 or hr < 40:
            risk += 10
            
        return float(min(100.0, max(0.0, risk)))
