from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QLineEdit, QPushButton, QHBoxLayout, QFormLayout
from PyQt5.QtCore import pyqtSignal
from PyQt5.QtGui import QFont

class OnboardingWizard(QWidget):
    """
    V4 Feature: First-time setup wizard to collect patient baselines and contacts.
    """
    setup_complete = pyqtSignal(dict)
    
    def __init__(self):
        super().__init__()
        self.setStyleSheet("background-color: #0f172a; color: #f8fafc;")
        
        layout = QVBoxLayout(self)
        
        title = QLabel("Welcome to CorAssist Clinical Monitor")
        title.setFont(QFont("Arial", 24, QFont.Bold))
        title.setStyleSheet("color: #38bdf8;")
        layout.addWidget(title)
        
        form_layout = QFormLayout()
        self.name_input = QLineEdit("Jane Doe")
        self.name_input.setStyleSheet("background-color: #1e293b; padding: 10px;")
        
        self.age_input = QLineEdit("45")
        self.age_input.setStyleSheet("background-color: #1e293b; padding: 10px;")
        
        self.sex_input = QLineEdit("Female")
        self.sex_input.setStyleSheet("background-color: #1e293b; padding: 10px;")
        
        self.conditions_input = QLineEdit("Hypertension")
        self.conditions_input.setStyleSheet("background-color: #1e293b; padding: 10px;")
        
        self.contact_input = QLineEdit("+1234567890")
        self.contact_input.setStyleSheet("background-color: #1e293b; padding: 10px;")
        
        form_layout.addRow(QLabel("Patient Name:"), self.name_input)
        form_layout.addRow(QLabel("Age:"), self.age_input)
        form_layout.addRow(QLabel("Sex:"), self.sex_input)
        form_layout.addRow(QLabel("Pre-existing Conditions:"), self.conditions_input)
        form_layout.addRow(QLabel("Emergency Caretaker Phone:"), self.contact_input)
        
        layout.addLayout(form_layout)
        
        self.finish_btn = QPushButton("Complete Setup & Start Monitoring")
        self.finish_btn.setStyleSheet("background-color: #0284c7; padding: 15px; font-weight: bold; font-size: 16px;")
        self.finish_btn.clicked.connect(self.on_finish)
        layout.addWidget(self.finish_btn)
        
    def on_finish(self):
        data = {
            "name": self.name_input.text(),
            "age": int(self.age_input.text()) if self.age_input.text().isdigit() else 45,
            "sex": self.sex_input.text(),
            "conditions": self.conditions_input.text(),
            "contact": self.contact_input.text()
        }
        self.setup_complete.emit(data)
