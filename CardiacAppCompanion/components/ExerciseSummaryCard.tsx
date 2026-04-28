import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';

interface ExerciseSummaryProps {
  session: any;
  onClose: () => void;
}

export default function ExerciseSummaryCard({ session, onClose }: ExerciseSummaryProps) {
  const { colors } = useTheme();

  if (!session || !session.after) return null;

  const getFitnessVerdict = () => {
    const recovery = session.recovery.hrRecovery;
    if (recovery > 20) return { label: 'Optimal Recovery', color: '#22C55E', icon: 'check-circle' };
    if (recovery > 10) return { label: 'Moderate Conditioning', color: '#EAB308', icon: 'info' };
    return { label: 'Sub-Optimal Recovery', color: '#EF4444', icon: 'warning' };
  };

  const verdict = getFitnessVerdict();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardAlt, borderTopColor: colors.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>WORKOUT SUMMARY</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <View style={styles.verdictRow}>
        <MaterialIcons name={verdict.icon as any} size={20} color={verdict.color} />
        <Text style={[styles.verdictText, { color: verdict.color }]}>{verdict.label}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Resting HR</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(session.before.hr)}</Text>
        </View>
        <View style={styles.statArrow}>
          <MaterialIcons name="arrow-forward" size={16} color={colors.border} />
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Post-Workout</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(session.after.hr)}</Text>
        </View>
      </View>

      <View style={styles.recoveryBox}>
        <Text style={[styles.recoveryLabel, { color: colors.subtext }]}>HEART RATE RECOVERY</Text>
        <Text style={[styles.recoveryValue, { color: colors.text }]}>
          {session.recovery.hrRecovery > 0 ? '-' : ''}{Math.abs(session.recovery.hrRecovery)} BPM
        </Text>
        <Text style={[styles.recoverySub, { color: colors.subtext }]}>
          HRV Delta: {session.recovery.hrvDelta > 0 ? '+' : ''}{session.recovery.hrvDelta.toFixed(1)}ms
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 24,
    marginTop: 20,
    borderTopWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  verdictText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statArrow: {
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  recoveryBox: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  recoveryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recoveryValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  recoverySub: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
