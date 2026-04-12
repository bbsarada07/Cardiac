class NightModeController:
    """
    V4 Feature: Sleep Mode / Night Monitoring
    Adjusts algorithm sensitivity for nocturnal states and suppresses non-critical UI interactions.
    """
    def __init__(self):
        self.is_active = False

    def toggle(self):
        self.is_active = not self.is_active
        return self.is_active

    def apply_night_modifiers(self, current_hr, current_sdnn):
        """
        Nocturnal heart rates are lower, HRV is higher.
        This suppresses false positive "Low HR" alerts and adjusts SDNN baseline scaling.
        Returns modifiers: (hr_threshold_adjust, sdnn_scale)
        """
        if self.is_active:
            hr_threshold_adjust = -15 # Allow HR to drop 15 bpm lower without alarm
            sdnn_scale = 1.15 # Allow 15% higher variability
        else:
            hr_threshold_adjust = 0
            sdnn_scale = 1.0
            
        return hr_threshold_adjust, sdnn_scale
