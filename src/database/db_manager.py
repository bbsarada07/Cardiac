import sqlite3
import datetime
import os

class DatabaseManager:
    """
    V4 Database Manager
    Handles multi-patient context and distinct tracking using SQLite.
    """
    def __init__(self, db_path="clinical_data.db"):
        self.db_path = db_path
        self._init_db()
        
        # Insert a default patient if none exist
        if not self.get_all_patients():
            self.add_patient("Jane Doe", 45, "F", "Hypertension", "None")

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        cur.execute('''
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER,
                sex TEXT,
                conditions TEXT,
                emergency_contact TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cur.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                FOREIGN KEY(patient_id) REFERENCES patients(id)
            )
        ''')
        
        cur.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER,
                session_id INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                risk_pct REAL,
                hr REAL,
                stability REAL,
                event_type TEXT,
                FOREIGN KEY(patient_id) REFERENCES patients(id),
                FOREIGN KEY(session_id) REFERENCES sessions(id)
            )
        ''')
        
        conn.commit()
        conn.close()

    def add_patient(self, name, age, sex, conditions, emergency_contact=""):
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO patients (name, age, sex, conditions, emergency_contact) 
            VALUES (?, ?, ?, ?, ?)
        ''', (name, age, sex, conditions, emergency_contact))
        patient_id = cur.lastrowid
        conn.commit()
        conn.close()
        return patient_id

    def get_all_patients(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM patients")
        rows = cur.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def log_event(self, patient_id, session_id, risk, hr, stability, event_type="CRITICAL"):
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO events (patient_id, session_id, risk_pct, hr, stability, event_type)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (patient_id, session_id, risk, hr, stability, event_type))
        conn.commit()
        conn.close()

    def get_recent_events(self, patient_id, limit=50):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM events WHERE patient_id=? ORDER BY timestamp DESC LIMIT ?", (patient_id, limit))
        rows = cur.fetchall()
        conn.close()
        return [dict(row) for row in rows]
