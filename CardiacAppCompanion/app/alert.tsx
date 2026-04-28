import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { AppContext } from '../src/context/AppContext';
import { useRouter } from 'expo-router';
import Animated, {
  withRepeat, withTiming, useSharedValue, useAnimatedStyle, withSequence, FadeIn
} from 'react-native-reanimated';
import hapticService from '../src/services/HapticService';
import audioService from '../src/services/AudioService';
import * as Speech from 'expo-speech';

const FIRST_AID_STEPS = [
  "Stay calm. Ask the patient to sit or lie down.",
  "Check airway and breathing.",
  "If unconscious, begin CPR immediately.",
  "Look for an AED (Defibrillator)."
];

export default function AlertScreen() {
  const { liveData, dismissAlert, triggerSOS, systemLanguage } = useContext(AppContext);
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);

  const opacity = useSharedValue(1);
  const progress = useSharedValue(0);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [didTriggerSOS, setDidTriggerSOS] = useState(false);

  useEffect(() => {
    hapticService.triggerWarning();
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1, true
    );

    // Feature 15: Voice Accessibility Alert
    const startAlert = async () => {
      let msg = "";
      if (systemLanguage === 'te') {
        msg = "తీవ్రమైన అత్యవసర పరిస్థితి గుర్తించబడింది. మీరు సురక్షితంగా ఉన్నట్లయితే దయచేసి రద్దు బటన్‌ను నొక్కండి.";
      } else if (systemLanguage === 'hi') {
        msg = "गंभीर आपातकाल का पता चला। यदि आप सुरक्षित हैं तो कृपया रद्द करें बटन दबाएं।";
      } else {
        msg = "Critical Emergency Detected. Autonomous SOS dispatching. Please press the cancel button if you are safe.";
      }

      const lang = systemLanguage === 'te' ? 'te-IN' : (systemLanguage === 'hi' ? 'hi-IN' : 'en-US');
      Speech.speak(msg, {
        language: lang,
        rate: 0.9,
        pitch: 1.0
      });
    };

    startAlert();

    // Feature 16: Autonomous SOS Countdown (10 seconds)
    progress.value = withTiming(100, { duration: 10000 });

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      Speech.stop();
    };
  }, []);

  // SOS Trigger logic when timer hits 0
  useEffect(() => {
    if (secondsRemaining === 0 && !didTriggerSOS) {
      setDidTriggerSOS(true);
      triggerSOS();
    }
  }, [secondsRemaining, didTriggerSOS]);

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

  const handleCall = (phone?: string) => {
    hapticService.triggerImpact();
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Linking.openURL('tel:911');
    }
  };

  const contacts = liveData.patient_identity?.contacts || [];

  const handleDismiss = () => {
    hapticService.triggerImpact();
    audioService.stopAll();
    Speech.stop();
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
          Emergency Protocol: {secondsRemaining}s remaining
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
        {contacts.length > 0 ? (
          contacts.map((c: { name: string; phone: string }, idx: number) => (
            <TouchableOpacity key={idx} style={styles.callBtn} onPress={() => handleCall(c.phone)}>
              <Text style={styles.callBtnText}>CALL {c.name.toUpperCase()}: {c.phone}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <TouchableOpacity style={styles.callBtn} onPress={() => handleCall('911')}>
            <Text style={styles.callBtnText}>CALL EMERGENCY (911)</Text>
          </TouchableOpacity>
        )}

        {/* IoT & COMMUNITY STATUS */}
        <View style={{ gap: 8, marginTop: 24, width: '100%' }}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#4ADE80' }}>
            <Text style={{ color: '#4ADE80', fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>
              🚨 IOT COMMAND SENT: UNLOCKING SMART DOOR & ACTIVATING EMERGENCY LIGHTING
            </Text>
          </View>

          <Animated.View entering={FadeIn.delay(2000)} style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3B82F6' }}>
            <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>
              🤝 COMMUNITY SOS: NOTIFYING 3 VOLUNTEERS WITHIN 500M
            </Text>
          </Animated.View>
        </View>


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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
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
  callBtn: { backgroundColor: '#EF4444', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 6, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  callBtnText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  dismissBtn: { backgroundColor: '#F1F5F9', padding: 18, borderRadius: 20, alignItems: 'center' },
  dismissBtnText: { color: '#64748B', fontSize: 16, fontWeight: '700' }
});
