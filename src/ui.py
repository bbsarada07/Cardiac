import numpy as np
import pyqtgraph as pg
from PyQt5.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, 
                             QLabel, QComboBox, QPushButton, QFrame, QProgressBar, QListWidget)
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QFont

class DashboardUI(QWidget):
    port_selected = pyqtSignal(str)
    exercise_mode_triggered = pyqtSignal()
    
    def __init__(self, available_ports):
        super().__init__()
        self.available_ports = available_ports
        self.is_connected = False
        
        self.init_ui()
        self.setup_plots()
        
    def init_ui(self):
        self.setWindowTitle("CorAssist Monitor - Predictive Clinical Platform")
        self.resize(1400, 900)
        self.setStyleSheet("background-color: #0f172a; color: #f8fafc;")

        main_layout = QVBoxLayout()
        
        # --- TOP CONTROLS ---
        top_bar = QHBoxLayout()
        title = QLabel("CORASSIST: AI PREDICTIVE PLATFORM")
        title.setFont(QFont("Arial", 20, QFont.Bold))
        title.setStyleSheet("color: #38bdf8;")
        
        self.port_combo = QComboBox()
        self.port_combo.addItems(self.available_ports)
        self.port_combo.setStyleSheet("background-color: #1e293b; padding: 5px;")
        
        self.connect_btn = QPushButton("Connect")
        self.connect_btn.setStyleSheet("background-color: #0284c7; font-weight: bold; padding: 8px 15px;")
        self.connect_btn.clicked.connect(self.on_connect_clicked)
        
        self.sim_label = QLabel("SIMULATION MODE — No hardware detected")
        self.sim_label.setFont(QFont("Arial", 10, QFont.Bold))
        self.sim_label.setStyleSheet("color: #fbbf24; background-color: #451a03; padding: 5px 10px; border-radius: 4px;")
        self.sim_label.hide()

        top_bar.addWidget(title)
        top_bar.addStretch()
        top_bar.addWidget(self.sim_label)
        top_bar.addSpacing(20)
        top_bar.addWidget(self.port_combo)
        top_bar.addWidget(self.connect_btn)
        
        # --- MASTER GRID ---
        grid = QGridLayout()
        grid.setColumnStretch(0, 3) # Left (Plots) is wider
        grid.setColumnStretch(1, 1) # Right (Metrics) is narrower
        
        # LEFT PANEL: PLOTS
        left_layout = QVBoxLayout()
        
        self.alert_banner = QLabel("SYSTEM STARTING...")
        self.alert_banner.setFont(QFont("Arial", 24, QFont.Bold))
        self.alert_banner.setAlignment(Qt.AlignCenter)
        self.alert_banner.setStyleSheet("background-color: #334155; padding: 15px;")
        
        self.cal_bar = QProgressBar()
        self.cal_bar.setValue(0)
        self.cal_bar.setFormat("Calibration %p%")
        
        self.ecg_plot = pg.PlotWidget(title="LIVE ECG WAVEFORM")
        self.ecg_plot.setBackground('#0f172a')
        
        self.hrv_plot = pg.PlotWidget(title="HRV TREND (SDNN)")
        self.hrv_plot.setBackground('#0f172a')
        self.hrv_plot.setMaximumHeight(200)
        
        left_layout.addWidget(self.alert_banner)
        left_layout.addWidget(self.cal_bar)
        left_layout.addWidget(self.ecg_plot, stretch=2)
        left_layout.addWidget(self.hrv_plot, stretch=1)
        
        # RIGHT PANEL: METRICS & LOGS
        right_layout = QVBoxLayout()
        metrics_grid = QGridLayout()
        
        self.hr_val = self.create_metric_box(metrics_grid, "HEART RATE", "--", 0, 0)
        self.spo2_val = self.create_metric_box(metrics_grid, "SpO2 %", "--", 0, 1)
        self.hrv_val = self.create_metric_box(metrics_grid, "HRV (SDNN)", "--", 1, 0)
        self.qtc_val = self.create_metric_box(metrics_grid, "QTc (ms)", "--", 1, 1)
        self.stab_val = self.create_metric_box(metrics_grid, "STABILITY", "100", 2, 0)
        self.resp_val = self.create_metric_box(metrics_grid, "RESPIRATION", "--", 2, 1)
        
        # MASSIVE RISK SCORE
        risk_frame = QFrame()
        risk_frame.setStyleSheet("background-color: #1e293b; border: 2px solid #334155;")
        risk_layout = QVBoxLayout(risk_frame)
        risk_title = QLabel("CARDIAC ARREST RISK %")
        risk_title.setAlignment(Qt.AlignCenter)
        self.risk_val = QLabel("0.0%")
        self.risk_val.setAlignment(Qt.AlignCenter)
        self.risk_val.setFont(QFont("Arial", 50, QFont.Bold))
        self.risk_val.setStyleSheet("color: #4ade80;")
        risk_layout.addWidget(risk_title)
        risk_layout.addWidget(self.risk_val)
        
        # EVENT LOG
        log_title = QLabel("Recent Events:")
        self.event_list = QListWidget()
        self.event_list.setStyleSheet("background-color: #1e293b; color: #f8fafc;")
        
        # DISMISS BUTTON
        self.exercise_btn = QPushButton("DISMISS WARNING (MUTE)")
        self.exercise_btn.setStyleSheet("background-color: #64748b; padding: 15px; font-weight: bold;")
        self.exercise_btn.clicked.connect(lambda: self.exercise_mode_triggered.emit())
        
        right_layout.addLayout(metrics_grid)
        right_layout.addWidget(risk_frame)
        right_layout.addWidget(log_title)
        right_layout.addWidget(self.event_list)
        right_layout.addWidget(self.exercise_btn)
        
        # Assemble
        grid.addLayout(left_layout, 0, 0)
        grid.addLayout(right_layout, 0, 1)
        
        main_layout.addLayout(top_bar)
        main_layout.addLayout(grid)
        self.setLayout(main_layout)

    def create_metric_box(self, grid, title, default_val, row, col):
        frame = QFrame()
        frame.setStyleSheet("background-color: #1e293b; border-radius: 5px;")
        layout = QVBoxLayout(frame)
        t_label = QLabel(title)
        t_label.setAlignment(Qt.AlignCenter)
        t_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        v_label = QLabel(default_val)
        v_label.setAlignment(Qt.AlignCenter)
        v_label.setFont(QFont("Arial", 28, QFont.Bold))
        layout.addWidget(t_label)
        layout.addWidget(v_label)
        grid.addWidget(frame, row, col)
        return v_label

    def setup_plots(self):
        self.plot_x = np.arange(800)
        self.plot_y = np.zeros(800)
        self.ecg_line = self.ecg_plot.plot(self.plot_x, self.plot_y, pen=pg.mkPen('#22c55e', width=2))
        
        self.hrv_x = np.arange(60)
        self.hrv_y = np.zeros(60)
        self.hrv_line = self.hrv_plot.plot(self.hrv_x, self.hrv_y, pen=pg.mkPen('#eab308', width=2), fillLevel=0, brush=(234, 179, 8, 50))

    def set_simulation_mode(self, active):
        if active:
            self.sim_label.show()
            self.connect_btn.setText("Simulating...")
            self.connect_btn.setEnabled(False)
        else:
            self.sim_label.hide()

    def on_connect_clicked(self):
        if not self.is_connected:
            self.port_selected.emit(self.port_combo.currentText())
            self.connect_btn.setText("Connecting...")
            self.connect_btn.setEnabled(False)

    def connection_established(self):
        self.is_connected = True
        self.connect_btn.setText("Connected")
        self.connect_btn.setStyleSheet("background-color: #22c55e;")

    def update_ecg_plot(self, new_val):
        self.plot_y = np.roll(self.plot_y, -1)
        self.plot_y[-1] = new_val
        self.ecg_line.setData(self.plot_x, self.plot_y)
        
    def update_hrv_trend(self, sdnn):
        # We only roll HRV when a new stable beat happens to avoid flattening the graph
        self.hrv_y = np.roll(self.hrv_y, -1)
        self.hrv_y[-1] = sdnn
        self.hrv_line.setData(self.hrv_x, self.hrv_y)

    def update_metrics(self, data):
        """ Receives the master state dictionary from V2 Processing framework """
        
        # 1. Update Core Metrics
        self.hr_val.setText(str(data['hr']))
        self.hrv_val.setText(f"{data['sdnn']:.1f}")
        self.stab_val.setText(f"{data['stability']:.1f}")
        self.qtc_val.setText(f"{data['qtc']:.0f}")
        self.spo2_val.setText(str(data['spo2']))
        self.resp_val.setText(str(data.get('resp', '--')))
        self.risk_val.setText(f"{data['risk_pct']:.1f}%")
        
        # 2. Calibration State Override
        if data['is_calibrating']:
            self.cal_bar.setValue(data['cal_progress'])
            self.alert_banner.setText(f"CALIBRATING PERSONAL BASELINE... {data['cal_progress']}%")
            self.alert_banner.setStyleSheet("background-color: #0284c7; color: white;")
            return
        
        self.cal_bar.hide() # Hide once done
        
        # 3. Coloring Logic
        if data['spo2'] < 94: self.spo2_val.setStyleSheet("color: #ef4444;")
        else: self.spo2_val.setStyleSheet("color: #f8fafc;")
        
        if data['qtc'] > 450: self.qtc_val.setStyleSheet("color: #eab308;")
        else: self.qtc_val.setStyleSheet("color: #f8fafc;")
        
        # 4. Master Risk Assessment Banner
        risk = data['risk_pct']
        is_latched = data.get('critical_latch', False)
        
        if is_latched or risk >= 60:
            self.risk_val.setStyleSheet("color: #ef4444;")
            self.alert_banner.setStyleSheet("background-color: #991b1b; color: yellow;")
            self.alert_banner.setText("CRITICAL: CORASSIST RISK ALERT")
        elif risk < 30:
            self.risk_val.setStyleSheet("color: #22c55e;")
            self.alert_banner.setStyleSheet("background-color: #166534; color: white;")
            self.alert_banner.setText("SYSTEM NORMAL - HEALTHY")
        else: # 30 - 60
            self.risk_val.setStyleSheet("color: #eab308;")
            self.alert_banner.setStyleSheet("background-color: #a16207; color: white;")
            self.alert_banner.setText("WARNING: ELEVATED FATIGUE / INSTABILITY")

    def update_logs(self, logs):
        self.event_list.clear()
        self.event_list.addItems(logs)

    def set_muted_ui(self, is_muted):
        if is_muted:
            self.exercise_btn.setText("WARNING MUTED (30s)")
            self.exercise_btn.setStyleSheet("background-color: #f59e0b; color: black; padding: 15px; font-weight: bold;")
            self.alert_banner.setText("ALARMS MUTED BY USER")
            self.alert_banner.setStyleSheet("background-color: #f59e0b; color: black;")
        else:
            self.exercise_btn.setText("DISMISS WARNING (MUTE)")
            self.exercise_btn.setStyleSheet("background-color: #64748b; color: white; padding: 15px; font-weight: bold;")
