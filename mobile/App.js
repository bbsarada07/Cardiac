import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

/**
 * Feature 10: Mobile Bluetooth Dashboard (React Native Template)
 * This is a frontend template designed to connect to the HC-05 Bluetooth module
 * or a Raspberry Pi running the Python ML engine.
 * 
 * To fully implement:
 * 1. npm install react-native-ble-plx
 * 2. Connect to the HC-05 Service UUID
 * 3. Parse the incoming string frame: "RISK,HR,SPO2"
 */

export default function App() {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [riskPct, setRiskPct] = useState(0.0);
  const [hr, setHr] = useState('--');
  const [spo2, setSpo2] = useState('--');
  
  // Dummy effect to simulate incoming bluetooth data for presentation
  useEffect(() => {
    if (deviceConnected) {
      const interval = setInterval(() => {
        setRiskPct((Math.random() * 5).toFixed(1));
        setHr(Math.floor(Math.random() * (75 - 65 + 1) + 65));
        setSpo2(98);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [deviceConnected]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>CorAssist Monitor</Text>
      
      <TouchableOpacity 
        style={[styles.btn, deviceConnected ? styles.btnOff : styles.btnOn]}
        onClick={() => setDeviceConnected(!deviceConnected)}
      >
        <Text style={styles.btnText}>{deviceConnected ? "Disconnect BLE" : "Connect HC-05"}</Text>
      </TouchableOpacity>

      <View style={styles.riskCard}>
        <Text style={styles.riskTitle}>Cardiac Arrest Risk</Text>
        <Text style={[styles.riskValue, { color: riskPct > 60 ? '#ef4444' : '#22c55e'}]}>
          {riskPct}%
        </Text>
        <Text style={styles.statusBanner}>
          {riskPct > 60 ? "CRITICAL EMERGENCY" : "SYSTEM STABLE"}
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>HEART RATE</Text>
          <Text style={styles.metricValue}>{hr}</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>SpO₂</Text>
          <Text style={[styles.metricValue, { color: spo2 < 95 ? '#ef4444' : '#f8fafc' }]}>{spo2}%</Text>
        </View>
      </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#38bdf8', textAlign: 'center', marginVertical: 20 },
  btn: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  btnOn: { backgroundColor: '#0284c7' },
  btnOff: { backgroundColor: '#475569' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  riskCard: { backgroundColor: '#1e293b', padding: 30, borderRadius: 15, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  riskTitle: { color: '#94a3b8', fontSize: 16 },
  riskValue: { fontSize: 72, fontWeight: 'bold', marginVertical: 10 },
  statusBanner: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  metricCard: { backgroundColor: '#1e293b', flex: 0.48, padding: 20, borderRadius: 15, alignItems: 'center' },
  metricTitle: { color: '#94a3b8', fontSize: 12, marginBottom: 5 },
  metricValue: { color: '#f8fafc', fontSize: 36, fontWeight: 'bold' }
});
