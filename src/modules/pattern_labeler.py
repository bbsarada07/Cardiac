class AIPatternLabeler:
    """
    Feature G: AI Pattern Labeler
    Classifies the current cardiac rhythm based on multiple metrics.
    """
    def __init__(self):
        self.last_label = "Analyzing..."

    def classify(self, hr, sdnn, rmssd, qtc, stability):
        """
        Rule-based classification engine.
        Values are based on standard clinical ranges.
        """
        # 1. Life-Threatening/Extreme Patterns first
        if stability < 25 and sdnn < 10:
            return "Pre-Instability Pattern"
            
        if hr > 120:
            return "Tachycardia Pattern"
            
        if 0 < hr < 45:
            return "Bradycardia Pattern"
            
        # 2. HRV Based
        if sdnn < 20 and stability < 60:
            return "Suppressed HRV"
            
        if sdnn > 100:
            # Often seen in athletes or during specific respiratory patterns
            return "Elevated HRV Variability"
            
        # 3. Arrhythmia / Irregularity
        # If RMSSD is significantly higher than SDNN, it often indicates irregular intervals
        if rmssd > sdnn * 1.5 and stability < 70:
            return "Irregular Rhythm Detected"
            
        # 4. Long QT
        if qtc > 480:
            return "Prolonged QTc Warning"

        # 5. Normal
        if 50 <= hr <= 100 and stability > 75:
            return "Normal Sinus Rhythm"
            
        return "Stable / Monitoring"

    def get_label(self, hr, sdnn, rmssd, qtc, stability):
        self.last_label = self.classify(hr, sdnn, rmssd, qtc, stability)
        return self.last_label
