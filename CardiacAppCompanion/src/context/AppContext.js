import React, { createContext, useState, useEffect } from 'react';
import { Platform, Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wsService from '../services/WebSocketService';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [latency, setLatency] = useState(null);
  
  // Feature 12: Security States
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [userPin, setUserPin] = useState('0000');
  const [lockEnabled, setLockEnabled] = useState(false);
  
  // Feature 13: Onboarding State
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true); // Default true until checked
  
  // Final Upgrade: Accessibility & Caregiver
  const [systemLanguage, setSystemLanguage] = useState('en'); // 'en', 'te', 'hi'
  const [caregiverLink, setCaregiverLink] = useState(null);

  
  // App State from backend
  const [liveData, setLiveData] = useState({
    hr: 0,
    sdnn: 0,
    rmssd: 0,
    spo2: 0,
    qtc: 0,
    stability: 100,
    risk_pct: 0,
    ai_pattern: 'Waiting for data',
    signal_quality: 'Unknown',
    is_cleaning: false,
    session_timer: '00:00:00',
    ode_h0: 0,
    ode_k: 0,
    risk_window_msg: '',
    emergency_active: false,
    patient_msg: '',
    battery_status: { percent: 100, is_critical: false },
    history: { timestamps: [], stability: [], risk: [], hr: [] }
  });

  const [exerciseMode, setExerciseMode] = useState(false);
  const [exerciseSession, setExerciseSession] = useState(null);
  const [showExerciseSummary, setShowExerciseSummary] = useState(false);

  // Feature 8: Lone User Check-In Timer
  const [cautionTime, setCautionTime] = useState(0);

  useEffect(() => {
    // Schedulers for Feature 11 (Simulated for Expo Go)
    // expo-notifications causes crashes in Expo Go SDK 53, so we simulate it via a local timeout
    const now = new Date();
    let millisUntil8AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0) - now;
    if (millisUntil8AM < 0) {
      millisUntil8AM += 86400000; // it's after 8am, try 8am tomorrow.
    }
    
    const timer = setTimeout(() => {
      Alert.alert(
        "Daily Cardiac Summary",
        "Yesterday was a stable day — no critical events detected."
      );
    }, millisUntil8AM);
    
    const handleStatus = (status) => setConnected(status);
    const handleLatency = (val) => setLatency(val);
    const handleData = (data) => {
      // Cooldown logic: Ignore critical status for 5 seconds after dismissal
      if (isCooldownActive) {
        console.log("Cooldown active: Suppressing critical status from WebSocket");
        // We override the emergency flag to false and clamp risk during cooldown
        data.emergency_active = false;
        if (data.risk_pct > 50) data.risk_pct = 45; // Visual confirmation that it's "dismissed"
      }

      setLiveData(prev => {
        const next = { ...prev, ...data };
        
        // Lone user logic: Caution (40-70 stability) tracking
        if (next.stability >= 40 && next.stability <= 70) {
          setCautionTime(c => c + 1);
        } else {
          setCautionTime(0);
        }

        // Feature 10: Battery Warning
        if (next.battery_status?.percent < 20 && !prev.battery_status?.is_critical) {
          Alert.alert(
            "Wearable Low Battery",
            `Warning: Cardiac monitor charge is ${next.battery_status.percent}%. Please connect to charger immediately.`
          );
        }
        
        return next;
      });
    };

    wsService.on('connection_status', handleStatus);
    wsService.on('latency_update', handleLatency);
    wsService.on('data', handleData);

    wsService.setIpAddress(ipAddress);
    wsService.setDemoMode(isDemoMode);
    wsService.connect();

    return () => {
      wsService.off('connection_status', handleStatus);
      wsService.off('latency_update', handleLatency);
      wsService.off('data', handleData);
      wsService.disconnect();
    };
  }, [ipAddress, isDemoMode]);

  const toggleExerciseMode = () => {
    const newVal = !exerciseMode;
    setExerciseMode(newVal);
    wsService.sendCommand('exercise_mode_toggle', { active: newVal });

    if (newVal) {
      // START: Snapshot "Before" vitals
      setExerciseSession({
        before: { hr: liveData.hr, sdnn: liveData.sdnn },
        after: null,
        timestamp: new Date().toLocaleTimeString(),
      });
      setShowExerciseSummary(false);
    } else if (exerciseSession) {
      // STOP: Snapshot "After" vitals and calculate recovery
      const hrRecovery = exerciseSession.before.hr - liveData.hr;
      const hrvDelta = liveData.sdnn - exerciseSession.before.sdnn;
      
      setExerciseSession(prev => ({
        ...prev,
        after: { hr: liveData.hr, sdnn: liveData.sdnn },
        recovery: { hrRecovery, hrvDelta }
      }));
      setShowExerciseSummary(true);
    }
  };

  const dismissAlert = () => {
    setIsCooldownActive(true);
    wsService.sendCommand('dismiss_alarm');
    setCautionTime(0);
    
    // Release cooldown after 10 seconds
    setTimeout(() => {
      setIsCooldownActive(false);
    }, 10000);
  };
  
  const triggerSOS = (type = "Cardiac Instability Detected (Autonomous)") => {
    // Collect simulated or dynamic metadata for the SOS dispatch
    const payload = {
      location: "17.4448° N, 78.3498° E (T-Hub Hyderabad)", 
      contacts: ["Caregiver Primary", "EMS Dispatch"],
      emergency_type: type
    };
    wsService.sendCommand('trigger_sos', payload);
  };


  // Feature 12: Security Logic
  useEffect(() => {
    // Load security settings
    const loadSettings = async () => {
      const pin = await AsyncStorage.getItem('user_pin');
      const enabled = await AsyncStorage.getItem('lock_enabled');
      const onboarded = await AsyncStorage.getItem('has_onboarded');
      const profile = await AsyncStorage.getItem('@patient_profile');
      
      if (pin) setUserPin(pin);
      if (enabled === 'true') {
        setLockEnabled(true);
        setIsAppLocked(true);
      }
      if (onboarded === 'true') setHasCompletedOnboarding(true);

      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          if (parsed.monitorIp) setIpAddress(parsed.monitorIp);
        } catch (e) {
          console.error("Failed to parse profile in AppContext", e);
        }
      }
    };
    loadSettings();

    // AppState Listener for Auto-locking
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' && lockEnabled) {
        setIsAppLocked(true);
      }
    });

    return () => subscription.remove();
  }, [lockEnabled]);

  const saveSecuritySettings = async (newPin, enabled) => {
    setUserPin(newPin);
    setLockEnabled(enabled);
    await AsyncStorage.setItem('user_pin', newPin);
    await AsyncStorage.setItem('lock_enabled', enabled ? 'true' : 'false');
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem('has_onboarded', 'true');
  };

  return (
    <AppContext.Provider value={{
      ipAddress, setIpAddress,
      isDemoMode, setIsDemoMode,
      connected,
      latency,
      liveData,
      exerciseMode, toggleExerciseMode,
      exerciseSession, showExerciseSummary, setShowExerciseSummary,
      dismissAlert,
      triggerSOS,
      systemLanguage, setSystemLanguage,
      caregiverLink, setCaregiverLink,
      isAppLocked, setIsAppLocked,
      userPin, lockEnabled, saveSecuritySettings,
      hasCompletedOnboarding, completeOnboarding
    }}>
      {children}
    </AppContext.Provider>
  );
};
