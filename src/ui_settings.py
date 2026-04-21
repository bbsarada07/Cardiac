from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QLineEdit, QPushButton, QHBoxLayout, QFormLayout, QCheckBox
from PyQt5.QtCore import pyqtSignal
from PyQt5.QtGui import QFont

class SettingsPanel(QWidget):
    """
    V4 Feature: Clinical Settings Dashboard.
    Allows caretakers to override default physiological thresholds and enable special modes.
    """
    settings_saved = pyqtSignal(dict)
    close_requested = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.setStyleSheet("background-color: #0f172a; color: #f8fafc;")
        
        layout = QVBoxLayout(self)
        
        title = QLabel("Clinical Threshold Settings")
        title.setFont(QFont("Arial", 20, QFont.Bold))
        title.setStyleSheet("color: #38bdf8;")
        layout.addWidget(title)
        
        form = QFormLayout()
        
        self.min_hr = QLineEdit("40")
        self.max_hr = QLineEdit("150")
        self.crit_sp = QLineEdit("90")
        self.night_mode_cb = QCheckBox("Enable Night Mode (Reduces sensitivity)")
        self.offline_mode_cb = QCheckBox("Enable Offline Fallback Alarm", checked=True)
        self.federated_cb = QCheckBox("Participate in Global Research (Federated Learning)", checked=False)
        self.federated_cb.setStyleSheet("color: #818cf8; font-weight: bold;")
        
        for w in [self.min_hr, self.max_hr, self.crit_sp]:
            w.setStyleSheet("background-color: #1e293b; padding: 5px;")
            
        form.addRow(QLabel("Minimum HR Alarm (BPM):"), self.min_hr)
        form.addRow(QLabel("Maximum HR Alarm (BPM):"), self.max_hr)
        form.addRow(QLabel("Critical SpO2 (%):"), self.crit_sp)
        form.addRow(self.night_mode_cb)
        form.addRow(self.offline_mode_cb)
        form.addRow(self.federated_cb)
        
        layout.addLayout(form)
        
        btn_layout = QHBoxLayout()
        
        self.save_btn = QPushButton("Save Settings")
        self.save_btn.setStyleSheet("background-color: #10b981; padding: 10px; font-weight: bold;")
        self.save_btn.clicked.connect(self.on_save)
        
        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.setStyleSheet("background-color: #64748b; padding: 10px;")
        self.cancel_btn.clicked.connect(lambda: self.close_requested.emit())
        
        btn_layout.addWidget(self.save_btn)
        btn_layout.addWidget(self.cancel_btn)
        
        layout.addLayout(btn_layout)
        layout.addStretch()
        
    def on_save(self):
        data = {
            "min_hr": int(self.min_hr.text()) if self.min_hr.text().isdigit() else 40,
            "max_hr": int(self.max_hr.text()) if self.max_hr.text().isdigit() else 150,
            "crit_sp": int(self.crit_sp.text()) if self.crit_sp.text().isdigit() else 90,
            "night_mode": self.night_mode_cb.isChecked(),
            "offline_mode": self.offline_mode_cb.isChecked(),
            "federated_opt_in": self.federated_cb.isChecked()
        }
        self.settings_saved.emit(data)
