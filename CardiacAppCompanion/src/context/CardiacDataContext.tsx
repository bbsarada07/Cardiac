import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from './AppContext';

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
      // Demo Mode Logic
      demoInterval = setInterval(() => {
        demoSeconds += 1;

        let newScore = 80;
        let newRisk = 5;
        let newLevel: "Normal" | "Caution" | "Critical" = "Normal";
        let newHR = 72;

        if (demoSeconds < 120) {
          // Normal phase
          newScore = 80 - (demoSeconds / 120) * 20; // 80 -> 60
          newHR = 72 + Math.random() * 5;
        } else if (demoSeconds < 240) {
          // Caution phase
          newLevel = "Caution";
          newScore = 55 - ((demoSeconds - 120) / 120) * 30; // 55 -> 25
          newRisk = 30 + ((demoSeconds - 120) / 120) * 40;
          newHR = 90 + Math.random() * 15;
        } else if (demoSeconds < 270) {
          // Critical phase
          newLevel = "Critical";
          newScore = 18 - Math.random() * 5; // ~13-18
          newRisk = 87 + Math.random() * 5;
          newHR = 130 + Math.random() * 30;
        } else if (demoSeconds < 300) {
          // Recover phase
          newLevel = "Normal";
          newScore = 20 + ((demoSeconds - 270) / 30) * 60; // climb back to 80
          newRisk = 87 - ((demoSeconds - 270) / 30) * 80;
          newHR = 100 - ((demoSeconds - 270) / 30) * 20;
        } else {
          // Loop reset
          demoSeconds = 0;
        }

        const newState: CardiacLiveState = {
          ...DEFAULT_STATE,
          stability_score: Math.max(0, Math.min(100, Math.round(newScore))),
          heart_rate: Math.round(newHR),
          hrv_sdnn: Math.max(40, Math.round(newScore * 0.6)), // Higher HRV in demo normal
          spo2: newLevel === "Normal" ? 98 + Math.random() : 92 + Math.random() * 3,
          qtc: 410 + Math.random() * 10,
          respiration: 14 + Math.round(Math.random() * 4),
          risk_probability: Math.round(newRisk),
          alert_level: newLevel,
          pattern_label: newLevel === "Critical" ? "Ventricular Tachycardia" : newLevel === "Caution" ? "Irregular Rhythm" : "Normal Sinus Rhythm",
          timestamp: Date.now(),
          isDataLive: true,
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

    return () => {
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
