import threading
import time
import socket
from collections import deque

class ConnectivityManager:
    """
    V4 Feature: Offline Mode and Fallback Queue.
    Monitors internet connection and queues outgoing emergency alerts 
    to be sent immediately once connection is restored.
    """
    def __init__(self, ping_host="8.8.8.8", ping_port=53, timeout=3):
        self.ping_host = ping_host
        self.ping_port = ping_port
        self.timeout = timeout
        self.is_online = True
        self.alert_queue = deque()
        self.sms_handler = None
        
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()

    def set_sms_handler(self, handler_callback):
        """Pass a reference to the SMS sending function."""
        self.sms_handler = handler_callback

    def _monitor_loop(self):
        while True:
            try:
                socket.setdefaulttimeout(self.timeout)
                socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((self.ping_host, self.ping_port))
                
                if not self.is_online:
                    self.is_online = True
                    self._flush_queue()
                    
            except socket.error:
                self.is_online = False
                
            time.sleep(5)

    def dispatch_alert(self, risk_pct, hr, spo2):
        """Attempts to send alert, or queues it if offline."""
        if self.is_online and self.sms_handler:
            try:
                self.sms_handler(risk_pct, hr, spo2)
                return True
            except Exception:
                self.is_online = False
        
        # Fallback to local queue
        self.alert_queue.append((time.time(), risk_pct, hr, spo2))
        return False # Returns False indicating fallback to max volume local alarm is required

    def verify_device_handshake(self, hardware_id, client_key):
        """
        Zero-Trust Identity: Verifies the Hardware ID using a secure cryptographic key.
        Prevents unauthorized devices from streaming data to the backend.
        """
        import hashlib
        # In a real scenario, this would check against a secure vault / hardware security module
        EXPECTED_SALT = "COR-TRUST-2026"
        computed_hash = hashlib.sha256(f"{hardware_id}{EXPECTED_SALT}".encode()).hexdigest()
        
        # Simulating a valid handshake check
        is_valid = (client_key == computed_hash)
        if is_valid:
            print(f"[SECURITY] Device Handshake Verified: {hardware_id}")
        else:
            print(f"[SECURITY ALERT] Device Handshake FAILED for ID: {hardware_id}")
        
        return is_valid

    def _flush_queue(self):
        """Sends all queued alerts when connection returns."""
        while self.alert_queue and self.sms_handler:
            timestamp, risk_pct, hr, spo2 = self.alert_queue[0]
            try:
                self.sms_handler(risk_pct, hr, spo2)
                self.alert_queue.popleft() # Remove only if successful
            except Exception:
                self.is_online = False
                break
