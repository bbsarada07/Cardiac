import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';

interface ConnectionStatusProps {
  latency: number | null;
  connected: boolean;
  battery: { percent: number; is_critical: boolean } | undefined;
}

export default function ConnectionStatus({ latency, connected, battery }: ConnectionStatusProps) {
  const { colors } = useTheme();

  const getStatus = () => {
    if (!connected) return { label: 'OFFLINE', color: '#EF4444', bars: 0 };
    if (latency === null) return { label: 'SYNCING', color: '#94A3B8', bars: 1 };
    if (latency < 500) return { label: 'STABLE', color: '#22C55E', bars: 4 };
    if (latency < 2000) return { label: 'DELAYED', color: '#EAB308', bars: 2 };
    return { label: 'CRITICAL', color: '#EF4444', bars: 1 };
  };

  const status = getStatus();

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 4 + i * 3,
                backgroundColor: i <= status.bars ? status.color : '#334155',
                shadowColor: i <= status.bars ? status.color : 'transparent',
                shadowOpacity: i <= status.bars ? 0.8 : 0,
                shadowRadius: 4,
                elevation: i <= status.bars ? 4 : 0,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: status.color }]}>{status.label}</Text>
      {connected && latency !== null && (
        <Text style={styles.latencyText}>{latency}ms</Text>
      )}
      {connected && battery && (
        <View style={styles.batteryContainer}>
          <MaterialIcons 
            name={battery.percent > 20 ? "battery-full" : "battery-alert"} 
            size={14} 
            color={battery.is_critical ? '#EF4444' : colors.subtext} 
          />
          <Text style={[styles.latencyText, { color: battery.is_critical ? '#EF4444' : colors.subtext }]}>
            {Math.round(battery.percent)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 18,
    width: 20,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  latencyText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
  },
});
