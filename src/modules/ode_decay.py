import numpy as np
from scipy.optimize import curve_fit

class HRVDecayModel:
    """
    Feature A: ODE Decay Curve Visualization
    Models the HRV trend using the exponential decay equation: H(t) = H0 * e^(-kt).
    """
    def __init__(self, baseline_hrv=50.0):
        self.h0 = baseline_hrv
        self.k = 0.0
        self.hrv_history = []  # List of (timestamp_sec, hrv_val)
        self.start_time = None
        
    def add_data(self, timestamp_sec, hrv_val):
        """Adds a new HRV measurement at a specific time."""
        if self.start_time is None:
            self.start_time = timestamp_sec
            
        relative_time = (timestamp_sec - self.start_time) / 60.0 # Time in minutes
        self.hrv_history.append((relative_time, hrv_val))
        
        # Keep only last 5 minutes of data for fitting the current trend
        while self.hrv_history and self.hrv_history[-1][0] - self.hrv_history[0][0] > 5.0:
            self.hrv_history.pop(0)
            
        # Update k every time we have enough data (at least 5 points)
        if len(self.hrv_history) >= 5:
            self.update_k()

    def exponential_decay(self, t, k):
        """Equation: H(t) = H0 * e^(-kt)"""
        return self.h0 * np.exp(-k * t)

    def update_k(self):
        """Calculates k using non-linear least squares curve fitting."""
        try:
            times = np.array([pt[0] for pt in self.hrv_history])
            values = np.array([pt[1] for pt in self.hrv_history])
            
            # Initial guess k=0.1
            popt, _ = curve_fit(self.exponential_decay, times, values, p0=[0.1], maxfev=1000)
            self.k = popt[0]
        except Exception as e:
            # Fallback for unstable fitting (e.g. constant data)
            self.k = 0.0

    def get_fitted_curve(self, duration_mins=10, num_points=100):
        """Returns the fitted curve for visualization."""
        t_vals = np.linspace(0, duration_mins, num_points)
        h_vals = self.exponential_decay(t_vals, self.k)
        return t_vals, h_vals

    def get_equation_text(self):
        """Returns the equation string with current values for rendering."""
        return f"H(t) = {self.h0:.1f} * e^(-{self.k:.4f}t)"
