class BatteryMonitor:
    """
    V4 Feature: Power Management
    Tracks device battery voltage and raises warnings if critically low.
    """
    def __init__(self, max_voltage=4.2, min_voltage=3.3):
        self.max_voltage = max_voltage
        self.min_voltage = min_voltage
        self.current_voltage = max_voltage
        self.battery_pct = 100.0
        self.is_critical = False

    def update_voltage(self, voltage):
        """Called when serial string provides 'B:3.7V' format data."""
        self.current_voltage = voltage
        pct = ((self.current_voltage - self.min_voltage) / (self.max_voltage - self.min_voltage)) * 100
        self.battery_pct = max(0.0, min(100.0, pct))
        self.is_critical = self.battery_pct < 15.0

    def get_status(self):
        return {
            'voltage': self.current_voltage,
            'percent': self.battery_pct,
            'is_critical': self.is_critical,
            'warning_msg': "LOW BATTERY - CONNECT CHARGER IMMEDIATELY" if self.is_critical else ""
        }
