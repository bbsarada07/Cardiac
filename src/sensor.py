import serial
import serial.tools.list_ports
import time
from PyQt5.QtCore import QThread, pyqtSignal

def get_available_ports():
    """Returns a list of available serial COM ports."""
    ports = serial.tools.list_ports.comports()
    return [port.device for port in ports]

class SerialReaderThread(QThread):
    new_data = pyqtSignal(int, int) # Now emits (ECG, SpO2)
    error_occurred = pyqtSignal(str)

    def __init__(self, port, baud_rate=115200, parent=None):
        super().__init__(parent)
        self.port = port
        self.baud_rate = baud_rate
        self.is_running = False
        self.serial_connection = None

    def run(self):
        try:
            self.serial_connection = serial.Serial(self.port, self.baud_rate, timeout=1)
            self.is_running = True
            time.sleep(2) # Wait for Arduino to reset after serial connection
            
            while self.is_running:
                if self.serial_connection.in_waiting > 0:
                    try:
                        line = self.serial_connection.readline().decode('utf-8').strip()
                        if line:
                            parts = line.split(',')
                            if len(parts) == 2:
                                self.new_data.emit(int(parts[0]), int(parts[1]))
                            else:
                                self.new_data.emit(int(parts[0]), 98) # Legacy fallback
                    except ValueError:
                        pass # Ignore malformed lines (happens during startup)
                    except Exception as e:
                        self.error_occurred.emit(f"Read error: {str(e)}")
                        
        except Exception as e:
            self.error_occurred.emit(f"Connection error: {str(e)}")
            self.is_running = False

    def stop(self):
        self.is_running = False
        if self.serial_connection and self.serial_connection.is_open:
            self.serial_connection.close()
        self.wait()
