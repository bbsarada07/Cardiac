from PyQt5.QtWidgets import QWidget, QStackedLayout, QVBoxLayout
from PyQt5.QtCore import pyqtSignal

from .ui_v3 import DashboardV3
from .ui_onboarding import OnboardingWizard
from .ui_settings import SettingsPanel

class ClinicalPlatformV4(QWidget):
    """
    V4 Feature: Master UI Wrapper using QStackedLayout
    Navigates between Onboarding, the Main Dashboard, and Settings.
    """
    interaction_detected = pyqtSignal()
    
    def __init__(self, available_ports):
        super().__init__()
        self.setWindowTitle("V4.0 Clinical Enterprise Healthcare Monitor")
        self.resize(1600, 950)
        self.setStyleSheet("background-color: #0f172a; color: #f8fafc;")
        
        # We handle layout centrally here
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        
        self.stack = QStackedLayout()
        
        # 1. Onboarding
        self.onboarding = OnboardingWizard()
        self.onboarding.setup_complete.connect(self.on_setup_complete)
        
        # 2. Main Dashboard (V3 code used as component)
        self.dashboard = DashboardV3(available_ports)
        self.dashboard.interaction_detected.connect(self.interaction_detected.emit)
        
        # 3. Settings
        self.settings = SettingsPanel()
        self.settings.close_requested.connect(lambda: self.stack.setCurrentIndex(1))
        
        self.stack.addWidget(self.onboarding)  # Index 0
        self.stack.addWidget(self.dashboard)   # Index 1
        self.stack.addWidget(self.settings)    # Index 2
        
        main_layout.addLayout(self.stack)
        
        # Start at onboarding if no patient configured (we'll assume new patient for now)
        self.stack.setCurrentIndex(0)

    def on_setup_complete(self, patient_data):
        # We would theoretically pass this to the DB manager
        # For now, just advance to dashboard
        self.stack.setCurrentIndex(1)
        
    def show_settings(self):
        self.stack.setCurrentIndex(2)

    # Add proxy methods to pass data through to the embedded DashboardV3
    def update_v3_metrics(self, data):
        self.dashboard.update_v3_metrics(data)
        
    def update_ecg_plot(self, val):
        self.dashboard.update_ecg_plot(val)
        
    def update_hrv_trend(self, val):
        self.dashboard.update_hrv_trend(val)
        
    def update_logs(self, logs):
        self.dashboard.update_logs(logs)

    def connection_established(self):
        self.dashboard.connection_established()
        
    def set_muted_ui(self, muted):
        self.dashboard.set_muted_ui(muted)
        
    def set_simulation_mode(self, active):
        self.dashboard.set_simulation_mode(active)
        
    def show(self):
        super().show()
