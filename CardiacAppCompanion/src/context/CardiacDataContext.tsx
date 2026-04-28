import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { AppContext } from './AppContext';
import wsService from '../services/WebSocketService';

export interface CardiacLiveState {
  stability_score: number;
  heart_rate: number;
  hrv_sdnn: number;
  hrv_rmssd: number;
  spo2: number;
  qtc: number;
  risk_probability: number;
  pattern_label: string;
  signal_quality: "Clean" | "Moderate" | "Poor" | string;
  artifact_active: boolean;
  session_duration: string;
  ode_h0: number;
  ode_k: number;
  risk_window_minutes: number | null;
  alert_level: "Normal" | "Caution" | "Critical";
  patient_feedback_message: string;
  exercise_mode: boolean;
  timestamp: number;
  isDataLive: boolean;
  respiration: number;
  battery_status?: { percent: number; is_critical: boolean };
  activity_context: "Resting" | "Exercise" | "Unknown";
  motion_intensity: number;
  caregiver_session?: string;
}


export interface PatientProfile {
  name: string;
  age: string;
  sex: string;
  conditions: string;
  blood_type: string;
  contact1_name: string;
  contact1_phone: string;
  contact2_name: string;
  contact2_phone: string;
  contact3_name: string;
  contact3_phone: string;
  monitorIp: string;
}

const DEFAULT_STATE: CardiacLiveState = {
  stability_score: 0,
  heart_rate: 0,
  hrv_sdnn: 0,
  hrv_rmssd: 0,
  spo2: 0,
  qtc: 0,
  respiration: 0,
  risk_probability: 0,
  pattern_label: "Waiting for signal...",
  signal_quality: "Poor",
  artifact_active: false,
  session_duration: "00:00",
  ode_h0: 50,
  ode_k: 0.05,
  risk_window_minutes: null,
  alert_level: "Normal",
  patient_feedback_message: "No monitor data received.",
  exercise_mode: false,
  timestamp: 0,
  isDataLive: false,
  battery_status: { percent: 100, is_critical: false },
  activity_context: "Resting",
  motion_intensity: 0.0
};

const DEFAULT_PROFILE: PatientProfile = {
  name: "",
  age: "",
  sex: "",
  conditions: "",
  blood_type: "",
  contact1_name: "",
  contact1_phone: "",
  contact2_name: "",
  contact2_phone: "",
  contact3_name: "",
  contact3_phone: "",
  monitorIp: "192.168.1.100"
};

interface CardiacDataContextType {
  liveState: CardiacLiveState;
  history: CardiacLiveState[];
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  patientProfile: PatientProfile;
  updatePatientProfile: (updated: Partial<PatientProfile>) => void;
  saveProfileToDisk: () => Promise<boolean>;
}

const CardiacContext = createContext<CardiacDataContextType>({
  liveState: DEFAULT_STATE,
  history: [],
  isDemoMode: false,
  setDemoMode: () => { },
  patientProfile: DEFAULT_PROFILE,
  updatePatientProfile: () => { },
  saveProfileToDisk: async () => false,
});

export const CardiacProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveState, setLiveState] = useState<CardiacLiveState>(DEFAULT_STATE);
  const [history, setHistory] = useState<CardiacLiveState[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(DEFAULT_PROFILE);

  // Consume global isDemoMode from AppContext
  const { isDemoMode, setIsDemoMode } = useContext(AppContext);
  const setDemoMode = (val: boolean) => setIsDemoMode(val);

  // Track the last time we received data locally to avoid clock drift issues
  const lastReceiptTimeRef = useRef<number>(0);

  const handleUpdateProfile = (updated: Partial<PatientProfile>) => {
    setPatientProfile(prev => ({ ...prev, ...updated }));
  };

  const saveProfileToDisk = async () => {
    try {
      await AsyncStorage.setItem('@patient_profile', JSON.stringify(patientProfile));
      // Sync with Firebase as well for desktop monitor parity
      await update(ref(database, '/patient_profile'), patientProfile);
      return true;
    } catch (e) {
      console.error("Failed to save profile", e);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('@patient_profile');
        if (saved) setPatientProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let demoInterval: any;
    let demoSeconds = 0;
    let watchdogInterval: any;

    if (isDemoMode) {
      // Specialized Hackathon Simulation Engine
      demoInterval = setInterval(() => {
        demoSeconds += 1;

        let newScore = 85;
        let newRisk = 8;
        let newLevel: "Normal" | "Caution" | "Critical" = "Normal";
        let newHR = 72;
        let pattern = "Normal Sinus Rhythm";

        // Presentation Logic: 
        // 0-15s: Stable Baseline
        // 15-30s: Sudden Deterioration (The "Event")
        // 30-45s: Critical Instability (The "Demo Peak")
        // 45-60s: Post-Intervention Stabilization
        
        if (demoSeconds < 15) {
          // Healthy Baseline
          newScore = 85 + Math.random() * 5;
          newHR = 70 + Math.random() * 4;
          newRisk = 8 + Math.random() * 2;
        } else if (demoSeconds < 30) {
          // The "Trigger Event": Rapid Decay
          const progress = (demoSeconds - 15) / 15;
          newScore = 85 - (progress * 55); // 85 -> 30
          newHR = 74 + (progress * 40);    // 74 -> 114
          newRisk = 10 + (progress * 60);  // 10 -> 70
          newLevel = "Caution";
          pattern = "Sinus Tachycardia";
        } else if (demoSeconds < 45) {
          // Critical Presentation
          newLevel = "Critical";
          newScore = 15 + Math.random() * 10; 
          newHR = 135 + Math.random() * 20;
          newRisk = 92 + Math.random() * 5; // Spike > 90%
          pattern = "Ventricular Tachycardia";
        } else if (demoSeconds < 60) {
          // Stabilization / Recovery
          const progress = (demoSeconds - 45) / 15;
          newScore = 25 + (progress * 50); // 25 -> 75
          newHR = 110 - (progress * 30);   // 110 -> 80
          newRisk = 80 - (progress * 70);  // 80 -> 10
          newLevel = "Normal";
          pattern = "Normal Sinus Rhythm";
        } else {
          demoSeconds = 0; // Loop the demo
        }

        const newState: CardiacLiveState = {
          ...DEFAULT_STATE,
          stability_score: Math.round(newScore),
          heart_rate: Math.round(newHR),
          hrv_sdnn: Math.max(20, Math.round(newScore * 0.7)),
          spo2: newLevel === "Critical" ? 91 + Math.random() * 2 : 98 + Math.random(),
          qtc: 410 + (newLevel === "Critical" ? 40 : 10),
          respiration: newLevel === "Critical" ? 24 : 16,
          risk_probability: Math.round(newRisk),
          alert_level: newLevel,
          pattern_label: pattern,
          timestamp: Date.now(),
          isDataLive: true,
          activity_context: "Resting",
        };

        setLiveState(newState);
        setHistory((prev) => {
          const newHist = [...prev, newState];
          return newHist.length > 30 ? newHist.slice(newHist.length - 30) : newHist;
        });
      }, 1000);
    } else {
      // Firebase Live Logic
      const stateRef = ref(database, '/cardiac_state');
      onValue(stateRef, (snapshot) => {
        const raw = snapshot.val();
        if (raw) {
          // Success: Mark receipt time locally
          lastReceiptTimeRef.current = Date.now();

          // Map python output to consistent frontend interface
          const mappedState: CardiacLiveState = {
            stability_score: raw.stability || DEFAULT_STATE.stability_score,
            heart_rate: raw.hr || DEFAULT_STATE.heart_rate,
            hrv_sdnn: raw.sdnn || DEFAULT_STATE.hrv_sdnn,
            hrv_rmssd: raw.rmssd || 0,
            spo2: raw.spo2 || 0,
            qtc: raw.qtc || 0,
            respiration: raw.resp || 0,
            risk_probability: raw.risk_pct || 0,
            pattern_label: raw.ai_pattern || "Normal",
            signal_quality: raw.signal_quality?.quality || raw.signal_quality || "Moderate",
            artifact_active: raw.is_cleaning || false,
            session_duration: raw.session_timer || "00:00",
            ode_h0: raw.ode_h0 || 50,
            ode_k: raw.ode_k || 0.05,
            risk_window_minutes: raw.risk_window_minutes || null,
            alert_level: raw.emergency_active ? "Critical" : (raw.risk_pct > 60 ? "Caution" : "Normal"),
            patient_feedback_message: raw.patient_msg || "Receiving live telemetry...",
            exercise_mode: false,
            timestamp: raw.last_updated ? raw.last_updated * 1000 : Date.now(),
            // We set isDataLive=true here because we JUST received it. 
            // The watchdog below will turn it off if updates stop.
            isDataLive: true,
            battery_status: raw.battery ? {
              percent: raw.battery.percent || 0,
              is_critical: raw.battery.is_critical || false
            } : undefined,
            activity_context: raw.activity_context || "Resting",
            motion_intensity: raw.motion_intensity || 0.0,
            caregiver_session: raw.caregiver_session
          };
          setLiveState(mappedState);
          setHistory((prev) => {
            const newHist = [...prev, mappedState];
            return newHist.length > 30 ? newHist.slice(newHist.length - 30) : newHist;
          });
        }
      });

      const profileRef = ref(database, '/patient_profile');
      onValue(profileRef, (snapshot) => {
        const raw = snapshot.val();
        if (raw) setPatientProfile(raw);
      });

      // Watchdog: Periodically check if data has stopped arriving
      watchdogInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastReceiptTimeRef.current;
        if (elapsed > 12000 && !isDemoMode) { // 12 seconds timeout
          setLiveState(prev => ({ ...prev, isDataLive: false }));
        }
      }, 5000); // Check every 5 seconds
    }

    // Upgrade: Inertial Fall Detection (50Hz Sensor Fusion)
    let motionTimer: any;
    let fallBuffer: number[] = [];
    let isFallDetectionArmed = true;
    let accelSubscription: any;

    if (Platform.OS !== 'web') {
      accelSubscription = Accelerometer.addListener(data => {
        const { x, y, z } = data;
        const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
        const intensity = Math.max(0, magnitude - 1.0);

        // 1. Fall Detection Logic
        fallBuffer.push(magnitude);
        if (fallBuffer.length > 50) fallBuffer.shift(); // 1 second rolling window

        if (isFallDetectionArmed && magnitude > 3.2) { // 3.2G Impact Spike
          isFallDetectionArmed = false; // Disarm to prevent double-trigger

          // Start stillness watchdog
          setTimeout(() => {
            // Check for stillness after impact
            const isStill = fallBuffer.every(val => Math.abs(val - 1.0) < 0.15);
            if (isStill) {
              // Trigger Priority-1 SOS
              wsService.sendCommand('trigger_sos', {
                emergency_type: "INERTIAL FALL DETECTED (Confirmed Stillness)",
                priority: 1
              });
            }
            isFallDetectionArmed = true; // Rearm
          }, 3000); // Wait 3s to confirm person hasn't moved
        }

        // 2. Throttled WebSocket Broadcast (once per second)

        if (!motionTimer) {
          motionTimer = setTimeout(() => {
            wsService.sendCommand('motion_update', { intensity: parseFloat(intensity.toFixed(3)) });
            motionTimer = null;
          }, 1000);
        }
      });

      Accelerometer.setUpdateInterval(20); // 50Hz Sampling for Fall Detection
    }

    return () => {
      if (accelSubscription) accelSubscription.remove();
      if (motionTimer) clearTimeout(motionTimer);
      if (demoInterval) clearInterval(demoInterval);
      if (watchdogInterval) clearInterval(watchdogInterval);
      if (!isDemoMode) {
        const stateRef = ref(database, '/cardiac_state');
        off(stateRef);
        const profileRef = ref(database, '/patient_profile');
        off(profileRef);
      }
    };
  }, [isDemoMode]);

  return (
    <CardiacContext.Provider value={{ liveState, history, isDemoMode, setDemoMode, patientProfile, updatePatientProfile: handleUpdateProfile, saveProfileToDisk }}>
      {children}
    </CardiacContext.Provider>
  );
};

export const useCardiacData = () => useContext(CardiacContext);
