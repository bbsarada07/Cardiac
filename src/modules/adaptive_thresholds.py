import numpy as np

class AdaptiveThresholdManager:
    """
    Upgrade 4: Adaptive Threshold Learning.
    Calculates personalized clinical ranges based on a Gaussian distribution 
    (Mean +/- 2 StdDev) learned during baseline calibration.
    """
    def __init__(self, metrics=["hr", "sdnn", "stability"]):
        self.metrics = metrics
        self.stats = {m: {"history": [], "mean": 0.0, "std": 0.0, "is_ready": False} for m in metrics}
        self.learning_rate = 0.01 # Alpha for slow baseline drift adaptation

    def add_calibration_point(self, metric_name, value):
        if metric_name not in self.stats: return
        if value <= 0 and metric_name != "stability": return
        
        self.stats[metric_name]["history"].append(float(value))

    def finalize_calibration(self):
        """
        Fits the initial Gaussian distribution to the calibration data.
        """
        for m in self.metrics:
            hist = self.stats[m]["history"]
            if len(hist) > 10:
                self.stats[m]["mean"] = np.mean(hist)
                self.stats[m]["std"] = np.std(hist)
                self.stats[m]["is_ready"] = True
                print(f"[ADAPTIVE] Threshold Learnt for {m}: {self.stats[m]['mean']:.1f} +/- {2*self.stats[m]['std']:.1f}")
            else:
                print(f"[ADAPTIVE] Warning: Not enough data for {m} calibration.")

    def update_drift(self, metric_name, value):
        """
        Slowly updates the baseline mean and std to adapt to physiological drift.
        Uses exponential moving average.
        """
        if metric_name not in self.stats or not self.stats[metric_name]["is_ready"]:
            return
        
        # Exponential Moving Average for Mean
        old_mean = self.stats[metric_name]["mean"]
        self.stats[metric_name]["mean"] = (1 - self.learning_rate) * old_mean + self.learning_rate * value
        
        # Update Variance/Std (Simplified)
        diff = abs(value - self.stats[metric_name]["mean"])
        self.stats[metric_name]["std"] = (1 - self.learning_rate) * self.stats[metric_name]["std"] + self.learning_rate * diff

    def check_breach(self, metric_name, value, multiplier=1.0):
        """
        Checks if the value is outside the personalized threshold.
        Default is 2-sigma. Multiplier allows dynamic widening (e.g. 3-sigma during exercise).
        Returns: (is_breached, z_score, range_tuple)
        """
        if metric_name not in self.stats or not self.stats[metric_name]["is_ready"]:
            return False, 0.0, (0.0, 0.0)
        
        mean = self.stats[metric_name]["mean"]
        std = max(1.0, self.stats[metric_name]["std"]) # Avoid division by zero
        
        z_score = (value - mean) / std
        threshold = 2.0 * multiplier
        is_breached = abs(z_score) > threshold
        
        lower = max(0, mean - threshold * std)
        upper = mean + threshold * std
        
        return is_breached, z_score, (lower, upper)

    def get_threshold_summary(self):
        summary = {}
        for m in self.metrics:
            if self.stats[m]["is_ready"]:
                lower = max(0, self.stats[m]["mean"] - 2 * self.stats[m]["std"])
                upper = self.stats[m]["mean"] + 2 * self.stats[m]["std"]
                summary[m] = {"range": (round(lower, 1), round(upper, 1)), "mean": round(self.stats[m]["mean"], 1)}
        return summary
