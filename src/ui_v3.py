from PyQt5.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, 
                             QLabel, QComboBox, QPushButton, QFrame, QProgressBar, QListWidget, QLayout, QStackedLayout)
from PyQt5.QtCore import Qt, pyqtSignal, QTimer
from PyQt5.QtGui import QFont, QColor, QPalette
import pyqtgraph as pg
# Enable clinical-grade antialiasing for smoother rendering
pg.setConfigOptions(antialias=True, useOpenGL=True)
import numpy as np

from .ui import DashboardUI

class EmergencyOverlay(QFrame):
    """
    Feature H Component: Full-screen emergency alert
    """
    cancel_requested = pyqtSignal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(Qt.Window | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint)
        self.setStyleSheet("background-color: rgba(153, 27, 27, 230); border: 10px solid #ef4444;")
        self.hide()
        
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        
        self.alert_title = QLabel("CRITICAL EMERGENCY ALERT")
        self.alert_title.setFont(QFont("Arial", 48, QFont.Bold))
        self.alert_title.setStyleSheet("color: white; border: none;")
        self.alert_title.setAlignment(Qt.AlignCenter)
        
        self.patient_info = QLabel("Loading patient info...")
        self.patient_info.setFont(QFont("Arial", 20))
        self.patient_info.setStyleSheet("color: #fca5a5; border: none;")
        self.patient_info.setAlignment(Qt.AlignCenter)
        
        self.status_msg = QLabel("Contacting Emergency Services...")
        self.status_msg.setFont(QFont("Arial", 24, QFont.Bold))
        self.status_msg.setStyleSheet("color: #fde047; border: none;")
        self.status_msg.setAlignment(Qt.AlignCenter)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setStyleSheet("QProgressBar { border: 2px solid white; border-radius: 5px; text-align: center; } QProgressBar::chunk { background-color: #ef4444; }")
        self.progress_bar.setFixedHeight(30)
        self.progress_bar.setFixedWidth(600)
        
        self.timer_label = QLabel("Estimated Response: 08:00")
        self.timer_label.setFont(QFont("Arial", 40, QFont.Bold))
        self.timer_label.setStyleSheet("color: white; border: none;")
        self.timer_label.setAlignment(Qt.AlignCenter)
        
        self.first_aid_hint = QLabel("Stay calm and lie down.")
        self.first_aid_hint.setFont(QFont("Arial", 18, QFont.StyleItalic))
        self.first_aid_hint.setStyleSheet("color: #cbd5e1; border: none;")
        self.first_aid_hint.setAlignment(Qt.AlignCenter)
        
        self.cancel_btn = QPushButton("CANCEL — FALSE ALARM")
        self.cancel_btn.setFixedSize(300, 60)
        self.cancel_btn.setStyleSheet("background-color: #475569; color: white; font-weight: bold; border-radius: 10px;")
        self.cancel_btn.clicked.connect(lambda: self.cancel_requested.emit())
        
        layout.addStretch()
        layout.addWidget(self.alert_title)
        layout.addWidget(self.patient_info)
        layout.addSpacing(40)
        layout.addWidget(self.status_msg)
        layout.addWidget(self.progress_bar, 0, Qt.AlignCenter)
        layout.addSpacing(40)
        layout.addWidget(self.timer_label)
        layout.addWidget(self.first_aid_hint)
        layout.addStretch()
        layout.addWidget(self.cancel_btn, 0, Qt.AlignCenter)
        layout.addSpacing(50)
        
        self.flash_timer = QTimer()
        self.flash_timer.timeout.connect(self.toggle_border)
        self.border_state = True

    def show_alert(self, patient_data):
        self.patient_info.setText(f"PATIENT: {patient_data['name']} ({patient_data['age']}) | COND: {patient_data['conditions']}")
        self.showFullScreen()
        self.flash_timer.start(500)
        
    def toggle_border(self):
        self.border_state = not self.border_state
        color = "#ef4444" if self.border_state else "#991b1b"
        self.setStyleSheet(f"background-color: rgba(153, 27, 27, 230); border: 10px solid {color};")

class DashboardV3(DashboardUI):
    interaction_detected = pyqtSignal()
    
    def __init__(self, available_ports):
        super().__init__(available_ports)
        self.installEventFilter(self)
        
    def init_ui(self):
        # We handle window properties directly to avoid double-initialization
        self.setWindowTitle("CorAssist Clinical Monitor - Early-Warning System")
        self.resize(1600, 950) 
        self.setStyleSheet("background-color: #0f172a; color: #f8fafc;")
        
        # 1. Add Emergency Overlay (Not part of layout, handles itself)
        self.emergency_overlay = EmergencyOverlay()
        self.emergency_overlay.cancel_requested.connect(self.on_cancel_emergency)
        
        # 2. Build the V3 layout from scratch
        self.rebuild_v3_layout()

    def eventFilter(self, obj, event):
        if event.type() in [event.MouseMove, event.MouseButtonPress, event.KeyPress]:
            self.interaction_detected.emit()
        return super().eventFilter(obj, event)

    def rebuild_v3_layout(self):
        main_layout = QVBoxLayout()
        self.setLayout(main_layout)
        
        # --- TOP BAR ---
        top_bar = QHBoxLayout()
        title = QLabel("CORASSIST CLINICAL PLATFORM V4.0")
        title.setFont(QFont("Arial", 16, QFont.Bold))
        title.setStyleSheet("color: #38bdf8;")
        
        self.session_time_label = QLabel("Session: 00:00:00")
        self.session_time_label.setStyleSheet("color: #94a3b8; font-weight: bold;")
        
        self.battery_label = QLabel("🔋 BATT: 100%")
        self.battery_label.setStyleSheet("color: #4ade80; font-weight: bold;")
        
        self.conn_label = QLabel("🌐 ONLINE")
        self.conn_label.setStyleSheet("color: #4ade80; font-weight: bold; padding-right: 10px;")
        
        top_bar.addWidget(title)
        top_bar.addStretch()
        top_bar.addWidget(self.conn_label)
        top_bar.addWidget(self.battery_label)
        top_bar.addSpacing(20)
        top_bar.addWidget(self.session_time_label)
        top_bar.addSpacing(20)
        
        self.port_combo = QComboBox()
        self.port_combo.addItems(self.available_ports)
        self.connect_btn = QPushButton("Connect")
        self.connect_btn.setStyleSheet("background-color: #0284c7; font-weight: bold; padding: 8px 15px;")
        self.connect_btn.clicked.connect(self.on_connect_clicked)
        
        self.sim_label = QLabel("SIMULATION MODE — No hardware detected")
        self.sim_label.setFont(QFont("Arial", 10, QFont.Bold))
        self.sim_label.setStyleSheet("color: #fbbf24; background-color: #451a03; padding: 5px 10px; border-radius: 4px;")
        self.sim_label.hide()

        top_bar.addWidget(self.sim_label)
        top_bar.addSpacing(20)
        top_bar.addWidget(self.port_combo)
        top_bar.addWidget(self.connect_btn)
        
        # --- MASTER GRID ---
        master_grid = QGridLayout()
        master_grid.setColumnStretch(0, 2)
        master_grid.setColumnStretch(1, 2)
        master_grid.setColumnStretch(2, 1)
        
        # -- COLUMN 0: LIVE FEEDS --
        col0 = QVBoxLayout()
        self.alert_banner = QLabel("SYSTEM STANDBY: 0%")
        self.alert_banner.setFont(QFont("Arial", 22, QFont.Bold))
        self.alert_banner.setAlignment(Qt.AlignCenter)
        self.alert_banner.setStyleSheet("background-color: #1e293b; padding: 10px; color: #38bdf8;")
        
        self.driving_engine_label = QLabel("Primary Engine: Mathematical Stability")
        self.driving_engine_label.setAlignment(Qt.AlignCenter)
        self.driving_engine_label.setStyleSheet("color: #64748b; font-size: 11px; margin-bottom: 5px;")
        
        self.cal_bar = QProgressBar() # Required by base class updates
        self.cal_bar.setValue(0)
        
        self.ecg_plot = pg.PlotWidget(title="LIVE ECG WAVEFORM")
        self.ecg_plot.setBackground('#0f172a')
        self.ecg_plot.showGrid(x=True, y=True, alpha=0.15)
        self.ecg_plot.setLabel('left', 'Voltage (mV)', color='#94a3b8')
        
        # Feature A: ODE Graph
        self.ode_plot = pg.PlotWidget(title="MATHEMATICAL DECAY MODEL VS ACTUAL HRV")
        self.ode_plot.setBackground('#0f172a')
        self.ode_plot.showGrid(x=True, y=True, alpha=0.15)
        self.ode_plot.setLabel('left', 'HRV (SDNN)', color='#94a3b8')
        self.ode_plot.setLabel('bottom', 'Time (relative min)', color='#94a3b8')
        self.ode_line = self.ode_plot.plot(pen=pg.mkPen('#c084fc', width=3)) 
        self.ode_dots = self.ode_plot.plot(pen=None, symbol='o', symbolSize=6, symbolBrush='#a855f7') 
        self.ode_text = pg.TextItem(text="H(t) = H0 * e^(-kt)", color='#d8b4fe', anchor=(0,0))
        self.ode_plot.addItem(self.ode_text)

        col0.addWidget(self.alert_banner)
        col0.addWidget(self.driving_engine_label)
        col0.addWidget(self.cal_bar)
        col0.addWidget(self.ecg_plot, stretch=2)
        col0.addWidget(self.ode_plot, stretch=1)
        
        # -- COLUMN 1: TRENDS & ANALYTICS --
        col1 = QVBoxLayout()
        
        # Feature L: Session History Graph
        self.history_plot = pg.PlotWidget(title="30-MINUTE SYSTEM TRENDS")
        self.history_plot.setBackground('#0f172a')
        self.history_plot.showGrid(x=True, y=True, alpha=0.2)
        self.history_plot.addLegend()
        
        # Format X-axis for Minutes (-30 to 0)
        hist_axis = self.history_plot.getAxis('bottom')
        hist_axis.setLabel('Time (minutes ago)', color='#94a3b8')
        ticks = [(i*300, str(i*5 - 30)) for i in range(7)]
        hist_axis.setTicks([ticks])
        
        self.hr_hist_line = self.history_plot.plot(name="Heart Rate", pen=pg.mkPen('#ef4444', width=2))
        self.stab_hist_line = self.history_plot.plot(name="Stability", pen=pg.mkPen('#38bdf8', width=2))
        self.risk_hist_line = self.history_plot.plot(name="Risk %", pen=pg.mkPen('#fbbf24', width=2))
        
        # Base class hrv_plot (we'll keep it hidden but initialized so update_hrv_trend works)
        self.hrv_plot = pg.PlotWidget()
        self.hrv_plot.hide()
        
        # Feature G & E Panels
        feedback_panel = QFrame()
        feedback_panel.setStyleSheet("background-color: #1e293b; border-radius: 5px;")
        fb_layout = QVBoxLayout(feedback_panel)
        self.pattern_label = QLabel("NORMAL SINUS RHYTHM")
        self.pattern_label.setFont(QFont("Arial", 20, QFont.Bold))
        self.pattern_label.setAlignment(Qt.AlignCenter)
        self.pattern_label.setStyleSheet("color: #4ade80;")
        
        self.status_msg = QLabel("Initializing analysis loop...")
        self.status_msg.setWordWrap(True)
        self.status_msg.setAlignment(Qt.AlignCenter)
        self.status_msg.setStyleSheet("color: #94a3b8; font-size: 14px; italic;")
        
        self.status_msg.setStyleSheet("color: #94a3b8; font-size: 14px; italic;")
        
        self.morphology_label = QLabel("ECG Morphology: Normal")
        self.morphology_label.setFont(QFont("Arial", 12, QFont.Bold))
        self.morphology_label.setStyleSheet("color: #38bdf8;")
        
        fb_layout.addWidget(QLabel("AI PATTERN CLASSIFICATION"))
        fb_layout.addWidget(self.pattern_label)
        fb_layout.addWidget(self.status_msg)
        fb_layout.addWidget(self.morphology_label)
        
        # Feature: AI Engine Status
        ai_frame = QFrame()
        ai_frame.setStyleSheet("background-color: #0f172a; border: 1px solid #6366f1; padding: 5px; border-radius: 5px;")
        ai_layout = QVBoxLayout(ai_frame)
        ai_title = QLabel("AI ENGINE STATUS")
        ai_title.setStyleSheet("color: #818cf8; font-weight: bold;")
        self.rf_status_label = QLabel("BASE: Calibrating...")
        self.rf_status_label.setStyleSheet("color: #4ade80; font-size: 14px; font-weight: bold; background-color: #022c22; padding: 2px;")
        self.ai_status_label = QLabel("Models: ---")
        self.ai_training_label = QLabel("Training: ---")
        self.ai_update_label = QLabel("Last Update: ---")
        self.ai_status_label.setStyleSheet("color: #cbd5e1; font-size: 11px;")
        self.ai_training_label.setStyleSheet("color: #cbd5e1; font-size: 11px;")
        self.ai_update_label.setStyleSheet("color: #cbd5e1; font-size: 11px;")
        
        # Adaptive Thresholds Label
        self.adaptive_label = QLabel("Personal Normal: Calibrating...")
        self.adaptive_label.setStyleSheet("color: #818cf8; font-size: 11px; margin-top: 5px;")
        self.adaptive_label.setWordWrap(True)
        
        # Federated Status Label
        self.federated_status_label = QLabel("Global Research: Opt-Out")
        self.federated_status_label.setStyleSheet("color: #94a3b8; font-size: 10px; font-style: italic; margin-top: 5px;")
        
        ai_layout.addWidget(ai_title)
        ai_layout.addWidget(self.rf_status_label)
        ai_layout.addWidget(self.ai_status_label)
        ai_layout.addWidget(self.ai_training_label)
        ai_layout.addWidget(self.ai_update_label)
        ai_layout.addWidget(self.adaptive_label)
        ai_layout.addWidget(self.federated_status_label)
        
        col1.addWidget(self.history_plot, stretch=2)
        col1.addWidget(feedback_panel, stretch=1)
        col1.addWidget(ai_frame, stretch=0)
        
        # -- COLUMN 2: SIDEBAR METRICS --
        col2 = QVBoxLayout()
        
        # Metrics Grid
        metrics_grid = QGridLayout()
        self.hr_val = self.create_metric_box(metrics_grid, "HEART RATE", "--", 0, 0)
        self.hrv_val = self.create_metric_box(metrics_grid, "HRV (SDNN)", "--", 0, 1)
        self.spo2_val = self.create_metric_box(metrics_grid, "SpO2 %", "--", 1, 0)
        self.stab_val = self.create_metric_box(metrics_grid, "MATH SCORE", "100", 1, 1)
        self.qtc_val = self.create_metric_box(metrics_grid, "QTc (ms)", "--", 2, 0)
        self.resp_val = self.create_metric_box(metrics_grid, "RESPIRATION", "--", 2, 1)
        
        self.ai_pred_val = self.create_metric_box(metrics_grid, "AI PRED (5m)", "--", 3, 0)
        self.ai_conf_val = self.create_metric_box(metrics_grid, "AI CONFIDENCE", "--", 3, 1)
        
        # Feature D: Signal Quality
        sq_frame = QFrame()
        sq_frame.setStyleSheet("background-color: #1e293b; padding: 2px; border-radius: 5px;")
        sq_layout = QVBoxLayout(sq_frame)
        self.snr_label = QLabel("SIGNAL QUALITY: CLEAN")
        self.snr_bar = QProgressBar()
        self.snr_bar.setFixedHeight(10)
        sq_layout.addWidget(self.snr_label)
        sq_layout.addWidget(self.snr_bar)
        
        # Risk Score (Inherited variable name self.risk_val)
        risk_frame = QFrame()
        risk_frame.setStyleSheet("background-color: #1e293b; border: 1px solid #334155; border-radius: 5px;")
        risk_layout = QVBoxLayout(risk_frame)
        risk_layout.addWidget(QLabel("RISK %"))
        self.risk_val = QLabel("0.0%")
        self.risk_val.setFont(QFont("Arial", 30, QFont.Bold))
        self.risk_val.setAlignment(Qt.AlignCenter)
        risk_layout.addWidget(self.risk_val)
        
        # Feature B: Risk Window
        self.risk_window_label = QLabel("Trend stable — no risk window projected.")
        self.risk_window_label.setStyleSheet("color: #38bdf8; font-weight: bold;")
        self.risk_window_label.setWordWrap(True)
        
        # Feature C: Artifact Indicator
        self.artifact_label = QLabel("CLEANING SIGNAL...")
        self.artifact_label.setStyleSheet("background-color: #991b1b; color: white; font-weight: bold; border-radius: 4px; padding: 2px;")
        self.artifact_label.setAlignment(Qt.AlignCenter)
        self.artifact_label.hide()
        
        # Feature J: Patient Info
        info_frame = QFrame()
        info_frame.setStyleSheet("background-color: #0f172a; border: 1px solid #334155; padding: 2px; border-radius: 5px;")
        info_layout = QVBoxLayout(info_frame)
        self.patient_name_label = QLabel("Jane Doe")
        self.patient_name_label.setFont(QFont("Arial", 12, QFont.Bold))
        self.patient_info_label = QLabel("45 y/o Female\nHypertension")
        self.patient_info_label.setStyleSheet("color: #94a3b8; font-size: 11px;")
        info_layout.addWidget(QLabel("PATIENT IDENTITY"))
        info_layout.addWidget(self.patient_name_label)
        info_layout.addWidget(self.patient_info_label)
        
        # Event list from V2
        self.event_list = QListWidget()
        self.event_list.setStyleSheet("background-color: #1e293b; color: #f8fafc;")
        self.event_list.setFixedHeight(60)
        
        xai_frame = QFrame()
        xai_frame.setStyleSheet("background-color: #1e293b; border-radius: 5px; padding: 10px; border: 1px solid #c084fc;")
        xai_layout = QVBoxLayout(xai_frame)
        xai_title = QLabel("AI LOGIC & FEATURE ATTRIBUTION")
        xai_title.setFont(QFont("Arial", 10, QFont.Bold))
        xai_title.setStyleSheet("color: #c084fc; margin-bottom: 5px;")
        xai_layout.addWidget(xai_title)
        
        self.xai_bars = {}
        features = ["Mathematical Stability", "Predictive Future", "Anomaly Baseline", "Waveform Morphology", "Adaptive Drift"]
        
        for feat in features:
            f_layout = QHBoxLayout()
            lbl = QLabel(feat)
            lbl.setStyleSheet("color: #94a3b8; font-size: 9px;")
            pbar = QProgressBar()
            pbar.setFixedHeight(6)
            pbar.setTextVisible(False)
            pbar.setStyleSheet("""
                QProgressBar { background-color: #0f172a; border-radius: 3px; border: none; }
                QProgressBar::chunk { background-color: #a855f7; border-radius: 3px; }
            """)
            self.xai_bars[feat] = pbar
            f_layout.addWidget(lbl, 3)
            f_layout.addWidget(pbar, 2)
            xai_layout.addLayout(f_layout)

        col2.addLayout(metrics_grid)
        col2.addWidget(sq_frame)
        col2.addWidget(risk_frame)
        col2.addWidget(xai_frame)
        col2.addWidget(self.risk_window_label)
        col2.addWidget(self.artifact_label)
        col2.addWidget(info_frame)
        col2.addWidget(QLabel("RECENT EVENTS"))
        col2.addWidget(self.event_list)
        col2.addStretch()
        
        self.exercise_btn = QPushButton("DISMISS / MUTE ALARM")
        self.exercise_btn.setStyleSheet("background-color: #64748b; padding: 5px; font-weight: bold;")
        self.exercise_btn.clicked.connect(lambda: self.exercise_mode_triggered.emit())
        col2.addWidget(self.exercise_btn)
        
        master_grid.addLayout(col0, 0, 0)
        master_grid.addLayout(col1, 0, 1)
        master_grid.addLayout(col2, 0, 2)
        
        main_layout.addLayout(top_bar)
        main_layout.addLayout(master_grid)
        
        # Re-initialize plots
        self.setup_plots()

    def update_v3_metrics(self, data):
        """Extended update for V3 features"""
        self.update_metrics(data)
        
        # Throttle GUI draw calls for heavy plots
        if not hasattr(self, 'draw_counter'):
            self.draw_counter = 0
        self.draw_counter += 1
        
        risk = data.get('risk_pct', 0)
        risk_color = "#4ade80" if risk < 30 else "#fbbf24" if risk < 60 else "#ef4444"
        
        self.alert_banner.setText(f"ENSEMBLE RISK: {int(risk)}%")
        self.alert_banner.setStyleSheet(f"background-color: #1e293b; padding: 10px; color: {risk_color}; border: 1px solid {risk_color};")
        
        force = data.get('ensemble_driving_force', 'Stability Engine')
        self.driving_engine_label.setText(f"DRIVING ENGINE: {force.upper()}")
        
        if data.get('is_calibrating', False):
            self.alert_banner.setText("BASELINE CALIBRATION IN PROGRESS")
            self.alert_banner.setStyleSheet("background-color: #1e293b; padding: 10px; color: #38bdf8;")
            self.driving_engine_label.setText("Learning Personalized Baseline...")
        
        # Feature A: ODE Graph Update
        if 'ode_curve' in data:
            t, h = data['ode_curve']
            self.ode_line.setData(t, h)
            self.ode_text.setText(data.get('ode_equation', ""))
            
            # Restore scatter plot logic - Ensure dots are updated consistently
            if 'ode_raw' in data:
                rt, rh = data['ode_raw']
                if len(rt) == len(rh):
                    self.ode_dots.setData(rt, rh)
        
        # Feature B: Risk Window
        self.risk_window_label.setText(data.get('risk_window_msg', "---"))
        
        # Feature C: Artifact Indicator
        if data.get('is_cleaning', False):
            self.artifact_label.show()
        else:
            self.artifact_label.hide()
            
        # Feature D: Signal Quality
        sq = data.get('signal_quality', {})
        self.snr_label.setText(f"SIGNAL QUALITY: {sq.get('quality', '---')}")
        self.snr_label.setStyleSheet(f"color: {sq.get('color', '#f8fafc')};")
        self.snr_bar.setValue(int(min(100, max(0, sq.get('snr', 0) * 2)))) # SNR 0-50 mapped to 0-100
        
        # Feature E & G
        self.pattern_label.setText(data.get('ai_pattern', '---'))
        self.status_msg.setText(data.get('patient_msg', '---'))
        
        # AI Metrics Updates
        if 'ai_pred_score' in data:
            self.ai_pred_val.setText(f"{data['ai_pred_score']}")
            self.ai_pred_val.setStyleSheet("color: #c084fc; font-weight: bold;" if data['ai_pred_score'] > 60 else "color: #ef4444; font-weight: bold;")
            self.ai_conf_val.setText(f"{data['ai_conf']}%")
            self.ai_status_label.setText(f"Models: {data.get('ai_status', '---')}")
            self.ai_training_label.setText(f"Data: {data.get('ai_training', '---')}")
            self.ai_update_label.setText(f"Last Update: {data.get('ai_last_update', '---')}")
        
        if 'cnn_morphology' in data:
            morph = data['cnn_morphology']
            self.morphology_label.setText(f"ECG Morphology: {morph}")
            if morph == "Normal":
                self.morphology_label.setStyleSheet("color: #38bdf8;")
            else:
                self.morphology_label.setStyleSheet("color: #f87171; font-weight: bold;")
            
        if 'rf_label' in data:
            label = data['rf_label']
            self.rf_status_label.setText(f"BASE: {label}")
            if label == "Normal":
                self.rf_status_label.setStyleSheet("color: #4ade80; font-size: 14px; font-weight: bold; background-color: #064e3b; padding: 2px;")
            elif label == "Early Warning":
                self.rf_status_label.setStyleSheet("color: #fbbf24; font-size: 14px; font-weight: bold; background-color: #451a03; padding: 2px;")
            elif label in ["High Risk", "Critical"]:
                self.rf_status_label.setStyleSheet("color: #f87171; font-size: 14px; font-weight: bold; background-color: #450a0a; padding: 2px;")
            else:
                self.rf_status_label.setStyleSheet("color: #94a3b8; font-size: 14px; font-weight: bold; background-color: #0f172a; padding: 2px;")
        
        if 'adaptive_thresholds' in data:
            ranges = data['adaptive_thresholds']
            if ranges:
                hr_r = ranges.get('hr', {}).get('range', (0, 0))
                sdnn_r = ranges.get('sdnn', {}).get('range', (0, 0))
                self.adaptive_label.setText(f"Personal Normal:\nHR: {hr_r[0]}-{hr_r[1]} bpm | HRV: {sdnn_r[0]}-{sdnn_r[1]} ms")
            else:
                self.adaptive_label.setText("Personal Normal: Calibrating...")

        if 'federated_status' in data:
            self.federated_status_label.setText(f"Global Research: {data['federated_status']}")
            if "Opt-In" in data['federated_status'] or "Sync" in data['federated_status']:
                self.federated_status_label.setStyleSheet("color: #818cf8; font-size: 10px; font-style: italic; border-top: 1px solid #1e293b; padding-top: 3px;")
            else:
                self.federated_status_label.setStyleSheet("color: #94a3b8; font-size: 10px; font-style: italic; border-top: 1px solid #1e293b; padding-top: 3px;")
        
        # Feature F: Timer
        self.session_time_label.setText(f"Session: {data.get('session_timer', '00:00:00')}")
        
        # V4 Features: Battery & Connectivity
        if 'battery_status' in data:
            batt = data['battery_status']
            self.battery_label.setText(f"🔋 BATT: {batt['percent']:.0f}%")
            self.battery_label.setStyleSheet("color: #ef4444;" if batt['is_critical'] else "color: #4ade80;")
            
        if data.get('is_offline', False):
            self.conn_label.setText("⚠ OFFLINE - FALLBACK ACTIVE")
            self.conn_label.setStyleSheet("color: #ef4444; font-weight: bold; padding-right: 10px;")
        else:
            self.conn_label.setText("🌐 ONLINE")
            self.conn_label.setStyleSheet("color: #4ade80; font-weight: bold; padding-right: 10px;")
        
        # Feature J: Identity Update (if changed in dict)
        if 'patient_identity' in data:
            p = data['patient_identity']
            self.patient_name_label.setText(p['name'])
            self.patient_info_label.setText(f"{p['age']} y/o {p['sex']}\n{p['conditions']}")

        if 'xai_attrib' in data:
            attrib = data['xai_attrib']
            for feat, val in attrib.items():
                if feat in self.xai_bars:
                    self.xai_bars[feat].setValue(val)
        
        # Feature L: History Graph
        if 'history' in data:
            t, hr, stab, risk, alert_t = data['history']
            self.hr_hist_line.setData(t, hr)
            self.stab_hist_line.setData(t, stab)
            self.risk_hist_line.setData(t, risk)
            # Alerts would be vertical lines, pyqtgraph can do this with InfiniteLine
            # For brevity, we'll just update metrics for now.

        # Feature H: Emergency Overlay
        if data.get('emergency_active', False):
            if not self.emergency_overlay.isVisible():
                self.emergency_overlay.show_alert(data.get('patient_identity', {}))
            self.emergency_overlay.status_msg.setText(data.get('emergency_status', ""))
            self.emergency_overlay.progress_bar.setValue(data.get('emergency_progress', 0))
            self.emergency_overlay.timer_label.setText(f"Estimated Response: {data.get('emergency_timer', '08:00')}")
            self.emergency_overlay.first_aid_hint.setText(data.get('emergency_first_aid', ""))
        else:
            self.emergency_overlay.hide()

    def on_cancel_emergency(self):
        # Ensure we exit full screen before hiding
        self.emergency_overlay.showNormal()
        self.emergency_overlay.hide()
        # Communicate back to main.py to reset alert logic
        self.exercise_mode_triggered.emit() 
