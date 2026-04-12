import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { AppContext } from '../src/context/AppContext';
import { useRouter } from 'expo-router';
import Animated, { withRepeat, withTiming, useSharedValue, useAnimatedStyle, withSequence } from 'react-native-reanimated';
import hapticService from '../src/services/HapticService';
import audioService from '../src/services/AudioService';

const FIRST_AID_STEPS = [
  "Stay calm. Ask the patient to sit or lie down.",
  "Check airway and breathing.",
  "If unconscious, begin CPR immediately.",
  "Look for an AED (Defibrillator)."
];

export default function AlertScreen() {
  const { liveData, dismissAlert } = useContext(AppContext);
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);

  const opacity = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => {
    hapticService.triggerWarning();
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1, true
    );
  }, []);

  // Feature H: Smoothly animate the progress bar when new data arrives
  useEffect(() => {
    if (liveData.emergency_progress !== undefined) {
      progress.value = withTiming(liveData.emergency_progress, { duration: 1000 });
    }
  }, [liveData.emergency_progress]);

  useEffect(() => {
    const it = setInterval(() => {
      setStepIndex(s => (s + 1) % FIRST_AID_STEPS.length);
    }, 30000);
    return () => clearInterval(it);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    borderColor: '#EF4444',
    borderWidth: 8
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`
  }));

  const handleCall = () => {
    hapticService.triggerImpact();
    Linking.openURL('tel:911');
  };

  const handleDismiss = () => {
    hapticService.triggerImpact();
    audioService.stopAll();
    audioService.playNormal();
    dismissAlert();
    router.back();
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.criticalText}>CRITICAL</Text>
      <Text style={styles.subText}>Risk Detected</Text>

      {/* Feature H: Live Emergency Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
        <Text style={styles.progressLabel}>
          {liveData.emergency_status || "Initiating Protocol..."} ({Math.round(liveData.emergency_progress || 0)}%)
        </Text>
      </View>

      <View style={styles.statsBox}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Risk</Text>
          <Text style={styles.statValueBad}>{Math.round(liveData.risk_pct)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>HR</Text>
          <Text style={styles.statValue}>{Math.round(liveData.hr)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Stability</Text>
          <Text style={styles.statValueBad}>{Math.round(liveData.stability)}</Text>
        </View>
      </View>

      <View style={styles.odeBox}>
        <Text style={styles.odeText}>{liveData.risk_window_msg}</Text>
      </View>

      <View style={styles.firstAidBox}>
        <Text style={styles.firstAidTitle}>FIRST AID REMINDER</Text>
        <Text style={styles.firstAidText}>{FIRST_AID_STEPS[stepIndex]}</Text>
      </View>

      <View style={styles.actionsBox}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Text style={styles.callBtnText}>CALL EMERGENCY</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
          <Text style={styles.dismissBtnText}>Dismiss - False Alarm</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#FFFFFF',
    padding: 24, justifyContent: 'center', alignItems: 'center'
  },
  criticalText: { fontSize: 42, fontWeight: '900', color: '#EF4444', letterSpacing: 1.5 },
  subText: { fontSize: 24, color: '#1E293B', marginBottom: 40, fontWeight: '600' },
  progressContainer: { 
    width: '100%', 
    height: 16, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 8, 
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  progressBar: { 
    height: '100%', 
    backgroundColor: '#EF4444',
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center'
  },
  statsBox: { 
    flexDirection: 'row', 
    gap: 24, 
    marginBottom: 40, 
    backgroundColor: '#FEF2F2', 
    padding: 24, 
    borderRadius: 24, 
    elevation: 2, 
    shadowColor: '#EF4444', 
    shadowOffset:{width:0,height:4}, 
    shadowOpacity:0.1, 
    shadowRadius:8 
  },
  statItem: { alignItems: 'center' },
  statLabel: { color: '#64748B', fontSize: 16, marginBottom: 8, fontWeight: '600' },
  statValue: { color: '#0F172A', fontSize: 36, fontWeight: '800' },
  statValueBad: { color: '#EF4444', fontSize: 36, fontWeight: '800' },
  odeBox: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginBottom: 32, width: '100%', borderWidth: 1, borderColor: '#FECACA' },
  odeText: { color: '#DC2626', fontSize: 16, textAlign: 'center', fontWeight: '700' },
  firstAidBox: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 20, width: '100%', marginBottom: 40, borderWidth: 1, borderColor: '#F1F5F9' },
  firstAidTitle: { color: '#3B82F6', fontSize: 14, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  firstAidText: { color: '#1E293B', fontSize: 18, lineHeight: 28, fontWeight: '500' },
  actionsBox: { width: '100%', gap: 16 },
  callBtn: { backgroundColor: '#EF4444', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 6, shadowColor: '#EF4444', shadowOffset:{width:0,height:6}, shadowOpacity:0.4, shadowRadius:12 },
  callBtnText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  dismissBtn: { backgroundColor: '#F1F5F9', padding: 18, borderRadius: 20, alignItems: 'center' },
  dismissBtnText: { color: '#64748B', fontSize: 16, fontWeight: '700' }
});
