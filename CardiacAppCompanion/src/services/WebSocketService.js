class WebSocketService {
  constructor() {
    this.listeners = {};
    this.ws = null;
    this.reconnectTimer = null;
    this.ipAddress = '192.168.1.100'; // Default, will be overridden by settings
    this.port = 8765;
    this.isDemoMode = false;
    this.demoTimer = null;
    this.isConnected = false;
    this.lastPingTime = null;
    this.latency = null;
    this.pingInterval = null;
  }

  setIpAddress(ip) {
    const trimmed = ip ? ip.trim() : '';
    this.ipAddress = trimmed || '192.168.1.100';
    if (this.ws && !this.isDemoMode) {
      this.ws.close();
    }
  }

  setDemoMode(enabled) {
    this.isDemoMode = enabled;
    if (enabled) {
      this.disconnect();
      this.startDemoMode();
    } else {
      this.stopDemoMode();
      this.connect();
    }
  }

  startDemoMode() {
    this.isConnected = true;
    this.emit('connection_status', true);
    
    let t = 0;
    let h0 = 50.0;
    
    this.demoTimer = setInterval(() => {
      t++;
      const hr = Math.round(70 + 10 * Math.sin(t * 0.1));
      const sdnn = Math.max(10, 50 - t * 0.1);
      const stability = Math.max(0, 100 - t * 0.5);
      const risk_pct = Math.min(100, t * 1.5);
      
      const payload = {
        hr: hr,
        sdnn: sdnn,
        rmssd: sdnn * 0.8,
        spo2: 98,
        qtc: 410,
        stability: stability,
        risk_pct: risk_pct,
        ai_pattern: stability > 50 ? 'Normal Sinus Rhythm' : 'Suppressed HRV',
        signal_quality: 'Good',
        is_cleaning: false,
        session_timer: '00:15:23',
        ode_h0: h0,
        ode_k: 0.005,
        risk_window_msg: 'Risk threshold in 25 mins',
        emergency_active: risk_pct > 85,
        history: { timestamps: [], stability: [], risk: [], hr: [] },
        patient_msg: 'Resting comfortably.'
      };
      
      this.emit('data', payload);
    }, 1000);
  }

  stopDemoMode() {
    if (this.demoTimer) clearInterval(this.demoTimer);
    this.demoTimer = null;
    this.isConnected = false;
    this.emit('connection_status', false);
  }

  connect() {
    if (this.isDemoMode) return;
    
    if (this.ws) {
      this.ws.close();
    }

    try {
      let host = this.ipAddress;
      if (Platform.OS === 'web' && (this.ipAddress === '192.168.1.100' || this.ipAddress === '127.0.0.1')) {
        host = window.location.hostname;
      }
      const targetUrl = `ws://${host}:${this.port}`;
      this.ws = new WebSocket(targetUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_status', true);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.startHeartbeat();
      };

      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'STATE_UPDATE') {
            this.emit('data', data.payload);
          } else if (data.type === 'PONG') {
            if (this.lastPingTime) {
              this.latency = Date.now() - this.lastPingTime;
              this.emit('latency_update', this.latency);
              this.lastPingTime = null;
            }
          }
        } catch (err) {
          console.error("Parse error:", err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection_status', false);
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (e) => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.stopHeartbeat();
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.sendCommand('ping');
      }
    }, 5000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.latency = null;
    this.emit('latency_update', null);
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  sendCommand(command, payload = {}) {
    if (this.isDemoMode) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command, payload }));
    }
  }

  // Simple EventEmitter implementation
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  }
}

export default new WebSocketService();
