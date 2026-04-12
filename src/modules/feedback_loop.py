class PatientFeedbackEngine:
    """
    Feature E: Patient Feedback Loop Messages
    Generates plain-English status messages based on cardiac trends.
    """
    def __init__(self):
        self.last_message = "Initializing system. Please stay calm while we establish your baseline."
        self.history_stability = []
        self.history_hrv = []
        
    def generate_message(self, stability, hrv, risk_pct, hrv_trend_k):
        """
        Maps current metrics and trends to a human-readable message.
        """
        # Maintain history for trend analysis
        self.history_stability.append(stability)
        self.history_hrv.append(hrv)
        if len(self.history_stability) > 20: self.history_stability.pop(0)
        
        # Logic Hierarchy
        if risk_pct > 80:
            return "Critical risk detected. Please sit down, remain calm, and ensure your emergency contacts are aware."
            
        if hrv_trend_k > 0.05:
            return "Your HRV has been declining steadily for the last 15 minutes — please rest and focus on deep breathing."
            
        if stability < 40:
            return "We've detected some instability in your heart rhythm. This can sometimes be resolved by adjusting your posture."
            
        if len(self.history_stability) > 10 and all(s > 80 for s in self.history_stability[-10:]):
            return "Your heart rhythm has been very stable for the last several minutes. Excellent readings."
            
        if risk_pct < 20 and stability > 70:
            return "Your heart health metrics are looking good. Continue with your normal activity."
            
        if risk_pct > 50:
            return "Caution: An unusual pattern was detected. We are monitoring closely. No immediate action needed, but stay rested."
            
        return "System monitoring active. Data is flowing normally."

    def update(self, stability, hrv, risk_pct, hrv_trend_k):
        self.last_message = self.generate_message(stability, hrv, risk_pct, hrv_trend_k)
        return self.last_message
