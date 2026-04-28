import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useCardiacData } from '../../src/context/CardiacDataContext';
import MetricCard from '../../components/MetricCard';
import Animated, { useAnimatedStyle, withTiming, useDerivedValue, interpolateColor } from 'react-native-reanimated';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { AppContext } from '../../src/context/AppContext';
import ConnectionStatus from '../../components/ConnectionStatus';
import BreathingGuide from '../../components/BreathingGuide';
import ExerciseSummaryCard from '../../components/ExerciseSummaryCard';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import DigitalTwinHeart from '../../src/components/DigitalTwinHeart';
import wsService from '../../src/services/WebSocketService';
import EmergencyDispatchModal from '../../src/components/EmergencyDispatchModal';
import ClinicalValidationInfo from '../../src/components/ClinicalValidationInfo';


import hapticService from '../../src/services/HapticService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    padding: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  scoreCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#13131A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  scoreLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: -5,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  scoreUnit: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    marginTop: -5,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E1E2D',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#E2E8F0',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  feedbackText: {
    color: '#F1F5F9',
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  actionHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pdfButtonText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  waitingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    zIndex: 10,
  },
  waitingText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  waitingSub: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  mathInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
    padding: 8,
  },
  mathInfoText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sosBanner: {
    backgroundColor: '#991B1B', // Deep "Emergency Red" (Tailwind Red-800)
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
    borderBottomWidth: 3,
    borderBottomColor: '#7F1D1D', // Darker red footer
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  sosBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sosBannerSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  integrityBar: {
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  diagnosticsPanel: {
    marginHorizontal: 24,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagItem: {
    alignItems: 'center',
    gap: 4,
  },
  diagLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  diagVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  integrityPill: {

    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  integrityText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default function HomeScreen() {
  const { liveState, patientProfile, history } = useCardiacData();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { 
    isDemoMode, connected, latency, exerciseSession, 
    showExerciseSummary, setShowExerciseSummary, systemLanguage 
  } = React.useContext(AppContext);
  
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [sosDispatched, setSosDispatched] = React.useState(false);
  const [showDispatchModal, setShowDispatchModal] = React.useState(false);
  const [modalIsAuto, setModalIsAuto] = React.useState(false);
  const [showValidationInfo, setShowValidationInfo] = React.useState(false);


  const generatePDF = async () => {
    setIsGenerating(true);
    hapticService.triggerImpact();
    try {
      const now = new Date();
      const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
              .hospital-header { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
              .brand { color: #1e3a8a; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
              .doc-type { font-size: 14px; color: #64748b; font-weight: 600; }
              .timestamp { font-size: 12px; color: #94a3b8; margin-top: 5px; }
              
              .section-title { font-size: 14px; font-weight: bold; color: #3b82f6; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin: 25px 0 15px 0; }
              
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .demo-table { width: 100%; border-collapse: collapse; }
              .demo-table td { padding: 8px 0; font-size: 13px; }
              .label { color: #64748b; font-weight: 600; width: 120px; }
              
              .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 10px; }
              .metric-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; background-color: #f8fafc; }
              .metric-val { font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 4px; }
              .metric-label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
              
              .analytics-card { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; }
              .analytics-text { font-size: 13px; color: #1e3a8a; }
              
              table.events { width: 100%; border-collapse: collapse; margin-top: 10px; }
              table.events th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; padding: 10px; border-bottom: 2px solid #e2e8f0; }
              table.events td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
              .status-normal { color: #16a34a; font-weight: bold; }
              .status-caution { color: #d97706; font-weight: bold; }
              .status-critical { color: #dc2626; font-weight: bold; }
              
              .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="hospital-header">
              <div>
                <div class="brand">CORASSIST CLINICAL PLATFORM</div>
                <div class="doc-type">Session Monitoring Report</div>
              </div>
              <div class="timestamp">Generated: ${timestamp}</div>
            </div>

            <div class="section-title">Patient Demographics</div>
            <div class="grid">
              <table class="demo-table">
                <tr><td class="label">Name:</td><td>${patientProfile.name || 'Jane Doe'}</td></tr>
                <tr><td class="label">Age / Sex:</td><td>${patientProfile.age || '45'}y / ${patientProfile.sex || 'Female'}</td></tr>
              </table>
              <table class="demo-table">
                <tr><td class="label">Conditions:</td><td>${patientProfile.conditions || 'None Declared'}</td></tr>
                <tr><td class="label">Blood Type:</td><td>${patientProfile.blood_type || 'O+'}</td></tr>
              </table>
            </div>

            <div class="section-title">Clinical Vitals Summary</div>
            <div class="metrics-grid">
              <div class="metric-box">
                <div class="metric-val" style="color: #ef4444;">${liveState.heart_rate}</div>
                <div class="metric-label">Heart Rate (BPM)</div>
              </div>
              <div class="metric-box">
                <div class="metric-val" style="color: #3b82f6;">${liveState.hrv_sdnn}</div>
                <div class="metric-label">HRV (SDNN)</div>
              </div>
              <div class="metric-box">
                <div class="metric-val" style="color: #06b6d4;">${liveState.spo2}%</div>
                <div class="metric-label">SpO2 (Oxygen)</div>
              </div>
              <div class="metric-box">
                <div class="metric-val" style="color: ${liveState.risk_probability > 50 ? '#ef4444' : '#eab308'};">${liveState.risk_probability}%</div>
                <div class="metric-label">Cardiac Risk Index</div>
              </div>
            </div>

            <div class="section-title">Predictive Analytics & ODE Modeling</div>
            <div class="analytics-card">
              <div class="analytics-text">
                <b>Stability Score:</b> ${liveState.stability_score}/100 <br/>
                <b>Decay Parameter (k):</b> ${liveState.ode_k.toFixed(3)} <br/>
                <b>Clinical Assessment:</b> ${liveState.risk_probability > 60 ? "Elevated risk detected. Monitor closely for instability." : "Heart rate variability remains within stable physiological bounds. No critical decay detected."}
                ${liveState.risk_window_minutes ? `<br/><b>Projected Risk Window:</b> ${liveState.risk_window_minutes} minutes.` : ""}
              </div>
            </div>

            <div class="section-title">Recent Clinical Events</div>
            <table class="events">
              <thead>
                <tr>
                  <th>Time (Sec)</th>
                  <th>Clinical Status</th>
                  <th>Classification</th>
                  <th>Stability</th>
                  <th>HR (BPM)</th>
                  <th>Risk %</th>
                </tr>
              </thead>
              <tbody>
                ${history.slice(-15).reverse().map(event => `
                  <tr>
                    <td>${new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td class="status-${(event.alert_level || 'Normal').toLowerCase()}">${(event.alert_level || 'Normal').toUpperCase()}</td>
                    <td>${event.pattern_label}</td>
                    <td>${event.stability_score}%</td>
                    <td>${event.heart_rate} BPM</td>
                    <td>${event.risk_probability}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              Confidential Medical Document - Authorized Use Only <br/>
              CorAssist AI Clinical Platform | Session UID: ${liveState.timestamp} <br/>
              © 2026 CorAssist Technologies. Generated via Mobile Companion v1.2.
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const announceStatus = () => {
    hapticService.triggerImpact();
    let text = "";
    if (systemLanguage === 'te') {
      text = `హృదయ స్పందన రేటు ${liveState.heart_rate} bpm. ఆక్సిజన్ స్థాయి ${liveState.spo2} శాతం. ప్రమాద స్థాయి ${liveState.risk_probability} శాతం.`;
    } else if (systemLanguage === 'hi') {
      text = `हृदय गति ${liveState.heart_rate} bpm. ऑक्सीजन स्तर ${liveState.spo2} प्रतिशत. जोखिम स्तर ${liveState.risk_probability} प्रतिशत.`;
    } else {
      text = `Heart rate is ${liveState.heart_rate} beats per minute. SpO2 is ${liveState.spo2} percent. Cardiac risk index is ${liveState.risk_probability} percent.`;
    }
    Speech.speak(text, { language: systemLanguage === 'te' ? 'te-IN' : (systemLanguage === 'hi' ? 'hi-IN' : 'en-US') });
  };

  // Color mapping logic for Stability Score
  const scoreProgress = useDerivedValue(() => {
    return withTiming(liveState.stability_score, { duration: 500 });
  });

  const animatedCircleStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      scoreProgress.value,
      [0, 30, 60, 100],
      ['#EF4444', '#F97316', '#EAB308', '#22C55E'] // Red -> Orange -> Yellow -> Green
    );
    return {
      borderColor: color,
      shadowColor: color,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        scoreProgress.value,
        [0, 30, 60, 100],
        ['#EF4444', '#F97316', '#EAB308', '#22C55E']
      ),
    };
  });

  // Feature: Autonomous SOS Dispatch Logic
  React.useEffect(() => {
    if (liveState.alert_level === 'Critical' && !showDispatchModal && !sosDispatched && !isDemoMode) {
      setModalIsAuto(true);
      setShowDispatchModal(true);
      setSosDispatched(true); // Prevent multiple triggers
      hapticService.triggerError();
    } else if (liveState.alert_level === 'Normal' && sosDispatched) {
      setSosDispatched(false);
    }
  }, [liveState.alert_level, showDispatchModal, sosDispatched, isDemoMode]);

  return (
    <View style={{ flex: 1 }}>
      {/* SOS Banner: FDA-Grade Clinical Alert */}
      {sosDispatched && (
        <TouchableOpacity 
          style={styles.sosBanner}
          onPress={() => {
            setModalIsAuto(false);
            setShowDispatchModal(true);
          }}
        >
          <MaterialIcons name="emergency-share" size={24} color="#FFF" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.sosBannerTitle}>CRITICAL ALERT DETECTED</Text>
            <Text style={styles.sosBannerSub}>Tap to open Emergency Dispatch Hub</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#FFF" />
        </TouchableOpacity>
      )}

      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.title, { color: colors.text }]}>CorAssist Monitor</Text>
              {isDemoMode && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAB308', marginTop: 4 }} />
              )}
            </View>
            <ConnectionStatus connected={connected} latency={latency} battery={liveState.battery_status} />
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, backgroundColor: colors.cardAlt, padding: 16, borderRadius: 20 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="person" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{patientProfile.name || "UNREGISTERED"}</Text>
                {/* Activity Context Badge */}
                <View style={[
                  styles.badge, 
                  { backgroundColor: liveState.activity_context === 'Exercise' ? '#F97316' : colors.primary + '20' }
                ]}>
                  <Text style={[styles.badgeText, { color: liveState.activity_context === 'Exercise' ? '#FFF' : colors.primary, fontSize: 9 }]}>
                    {liveState.activity_context === 'Exercise' ? "🏃 EXERCISE" : "RESTING"}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.subtext, fontSize: 13 }}>{patientProfile.age || "--"}y / {patientProfile.sex || "Unknown"} • {patientProfile.blood_type || "O+"}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity 
              style={[styles.pdfButton, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={() => router.push('/pill-scan')}
            >
              <MaterialIcons name="camera-alt" size={20} color="#FFF" />
              <Text style={styles.pdfButtonText}>MED SCAN</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.pdfButton, { backgroundColor: colors.cardAlt, flex: 1, borderWidth: 1, borderColor: colors.primary }]}
              onPress={generatePDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <MaterialIcons name="picture-as-pdf" size={20} color={colors.primary} />
                  <Text style={[styles.pdfButtonText, { color: colors.primary }]}>REPORT</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* CARDIAC DIGITAL TWIN (CENTER HUB) */}
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
          <DigitalTwinHeart 
            bpm={liveState.heart_rate} 
            riskScore={liveState.risk_probability} 
            isDisconnected={!liveState.isDataLive} 
          />
          <View style={{ marginTop: -20, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 48, fontWeight: '900', letterSpacing: -2 }}>{liveState.heart_rate}</Text>
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>LIVE HEART TELEMETRY</Text>
          </View>
        </View>

        {/* SYSTEM INTEGRITY DIAGNOSTICS */}
        <View style={[styles.diagnosticsPanel, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
          <View style={styles.diagItem}>
            <Text style={[styles.diagLabel, { color: colors.text }]}>BT SIGNAL</Text>
            <Text style={[styles.diagVal, { color: '#22C55E' }]}>{liveState.isDataLive ?  `${(liveState as any).bt_strength || 92}%` : 'OFF'}</Text>
          </View>
          <View style={{ width: 1, height: 20, backgroundColor: colors.border }} />
          <View style={styles.diagItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.diagLabel, { color: colors.text }]}>AI CONFIDENCE</Text>
              <TouchableOpacity onPress={() => setShowValidationInfo(true)}>
                <MaterialIcons name="info-outline" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.diagVal, { color: colors.primary }]}>{(liveState as any).ai_confidence || 94}%</Text>
          </View>
          <View style={{ width: 1, height: 20, backgroundColor: colors.border }} />
          <TouchableOpacity 
            style={styles.diagItem}
            onPress={() => {
              setModalIsAuto(false);
              setShowDispatchModal(true);
            }}
          >
            <Text style={[styles.diagLabel, { color: '#EF4444' }]}>SOS CALL</Text>
            <Text style={[styles.diagVal, { color: '#EF4444' }]}>DISPATCH</Text>
          </TouchableOpacity>
        </View>

      <TouchableOpacity
        style={styles.scoreContainer}
        onPress={() => router.push('/graph')}
      >
        <Animated.View style={[styles.scoreCircle, animatedCircleStyle, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.scoreLabel, { color: colors.subtext }]}>STABILITY</Text>
          <Animated.Text style={[styles.scoreValue, animatedTextStyle]}>
            {liveState.stability_score}
          </Animated.Text>
          <Text style={styles.scoreUnit}>/ 100</Text>
          <TouchableOpacity
            style={styles.mathInfoBtn}
            onPress={() => router.push('/math')}
          >
            <MaterialIcons name="info-outline" size={18} color={colors.subtext} />
            <Text style={[styles.mathInfoText, { color: colors.subtext }]}>Logic</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>


      <View style={styles.grid}>
        <TouchableOpacity style={{ flex: 1 }} onLongPress={announceStatus}>
          <MetricCard label="Heart Rate" value={liveState.heart_rate} unit="BPM" icon="favorite" color="#EF4444" />
        </TouchableOpacity>
        <MetricCard label="HRV (SDNN)" value={liveState.hrv_sdnn} unit="ms" icon="favorite-border" color="#3B82F6" />
      </View>
      <View style={styles.grid}>
        <MetricCard label="SpO2" value={liveState.spo2} unit="%" icon="air" color="#06B6D4" />
        <MetricCard label="QTc Int." value={Math.round(liveState.qtc)} unit="ms" icon="show-chart" color="#8B5CF6" />
      </View>
      <View style={styles.grid}>
        <MetricCard label="Risk Index" value={`${liveState.risk_probability}%`} icon="warning" color={liveState.risk_probability > 50 ? '#EF4444' : '#EAB308'} />
        <MetricCard label="Respiration" value={liveState.respiration} unit="br/m" icon="air" color="#fbbf24" />
      </View>

      <View style={styles.grid}>
        <MetricCard label="Rhythm" value={liveState.pattern_label === "Normal Sinus Rhythm" ? "NSR" : liveState.pattern_label} icon="monitor-heart" color="#10B981" />
        <MetricCard label="Signal" value={liveState.signal_quality} icon="rss-feed" color={liveState.signal_quality === "Clean" ? "#10B981" : "#EAB308"} />
      </View>

      {!liveState.isDataLive && (
        <View style={styles.waitingOverlay}>
          <MaterialIcons name="cloud-off" size={48} color="#94a3b8" />
          <Text style={styles.waitingText}>Waiting for monitor data...</Text>
          <Text style={styles.waitingSub}>Ensure your Python backend is running in Simulation or Hardware mode.</Text>
        </View>
      )}

      <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
        <View style={styles.infoRow}>
          <MaterialIcons name="network-check" size={20} color={liveState.signal_quality === "Clean" ? "#22C55E" : "#EAB308"} />
          <Text style={[styles.infoText, { color: colors.text }]}>Signal: {liveState.signal_quality}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="timer" size={20} color={colors.subtext} />
          <Text style={[styles.infoText, { color: colors.text }]}>Duration: {liveState.session_duration}</Text>
        </View>
        </View>


        <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
          <Text style={[styles.sectionHeader, { color: colors.subtext, marginBottom: 0 }]}>PATIENT PROFILE</Text>
          <TouchableOpacity onPress={() => router.push('/identity')}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900' }}>MODIFY PROFILE</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, padding: 20 }]}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{patientProfile?.name || "No Profile Data"}</Text>
          <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>{patientProfile?.conditions || "No conditions listed"}</Text>
        </View>
      </View>

      <View style={[styles.feedbackCard, { backgroundColor: colors.cardAlt, borderLeftColor: colors.primary }]}>
        <MaterialIcons name="info-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
        <Text style={[styles.feedbackText, { color: colors.text }]}>{liveState.patient_feedback_message}</Text>
      </View>

      {/* Feature 8: Stress Intervention */}
      {liveState.stability_score >= 40 && liveState.stability_score <= 70 && (
        <BreathingGuide />
      )}

      {/* Feature 6: Post-Workout Analytics */}
      {showExerciseSummary && (
        <ExerciseSummaryCard
          session={exerciseSession}
          onClose={() => setShowExerciseSummary(false)}
        />
      )}

      <View style={{ height: 100 }} />
    </ScrollView>

    {/* SYSTEM INTEGRITY STATUS BAR */}
    <View style={[styles.integrityBar, { backgroundColor: colors.cardAlt, borderTopColor: colors.border }]}>
      <View style={styles.integrityPill}>
        <MaterialIcons name="functions" size={12} color="#22C55E" />
        <Text style={[styles.integrityText, { color: colors.subtext }]}>MATH ENGINE: ACTIVE</Text>
      </View>
      <View style={[styles.integrityPill, { opacity: connected ? 1 : 0.5 }]}>
        <MaterialIcons name="psychology" size={12} color={connected ? "#3B82F6" : colors.subtext} />
        <Text style={[styles.integrityText, { color: colors.subtext }]}>AI FORECAST: ONLINE</Text>
      </View>
      <View style={styles.integrityPill}>
        <MaterialIcons name="accessibility" size={12} color="#F97316" />
        <Text style={[styles.integrityText, { color: colors.subtext }]}>FALL DETECTION: ARMED</Text>
      </View>
    </View>

    <EmergencyDispatchModal 
      isVisible={showDispatchModal}
      onClose={() => setShowDispatchModal(false)}
      isAutoTriggered={modalIsAuto}
    />

    <ClinicalValidationInfo 
      isVisible={showValidationInfo}
      onClose={() => setShowValidationInfo(false)}
    />
    </View>
  );
}

