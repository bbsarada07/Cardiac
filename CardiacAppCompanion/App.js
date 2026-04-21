import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  // Placeholder metric state values; replace with backend-fed values later.
  const [stabilityScore, setStabilityScore] = useState(82);
  const [heartRate, setHeartRate] = useState(74);
  const [hrv, setHrv] = useState(52);
  const [riskPercent, setRiskPercent] = useState(14);
  const [currentStatus, setCurrentStatus] = useState('Normal');

  useEffect(() => {
    // TODO: Connect to backend stream/socket/polling endpoint for live values.
    // Example:
    // const unsubscribe = subscribeToPatientMetrics((payload) => {
    //   setStabilityScore(payload.stabilityScore);
    //   setHeartRate(payload.hr);
    //   setHrv(payload.hrv);
    //   setRiskPercent(payload.riskPercent);
    //   setCurrentStatus(payload.status);
    // });
    // return () => unsubscribe();
  }, []);

  const statusColor = useMemo(() => {
    switch (currentStatus) {
      case 'Critical':
        return '#EF4444';
      case 'Caution':
        return '#F59E0B';
      case 'Normal':
      default:
        return '#22C55E';
    }
  }, [currentStatus]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>CorAssist Dashboard</Text>
        <Text style={styles.subtitle}>Live Patient Monitoring (Placeholder)</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text style={[styles.statusValue, { color: statusColor }]}>{currentStatus}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Stability Score</Text>
          <Text style={styles.metricValue}>{stabilityScore}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>HR</Text>
          <Text style={styles.metricValue}>{heartRate} bpm</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>HRV</Text>
          <Text style={styles.metricValue}>{hrv} ms</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Risk %</Text>
          <Text style={styles.metricValue}>{riskPercent}%</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1220',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#94A3B8',
    marginTop: 4,
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  statusLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 120,
    justifyContent: 'center',
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 10,
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '800',
  },
});
