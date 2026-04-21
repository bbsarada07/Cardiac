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
import wsService from '../../src/services/WebSocketService';
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
});

export default function HomeScreen() {
  const { liveState, patientProfile, history } = useCardiacData();
  const { isDemoMode, connected, latency, exerciseSession, showExerciseSummary, setShowExerciseSummary } = React.useContext(AppContext);
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [sosDispatched, setSosDispatched] = React.useState(false);

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
    if (liveState.alert_level === 'Critical' && !sosDispatched && !isDemoMode) {
      const handleSOS = async () => {
        try {
          // 1. Request Permissions
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            console.warn("Location permission denied. SOS dispatched without GPS.");
          }

          // 2. Fetch GPS
          let locationUrl = "GPS Data Unavailable";
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({});
            locationUrl = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
          }

          // 3. Format Contacts
          const contacts = [
            { name: patientProfile.contact1_name, phone: patientProfile.contact1_phone },
            { name: patientProfile.contact2_name, phone: patientProfile.contact2_phone },
            { name: patientProfile.contact3_name, phone: patientProfile.contact3_phone },
          ].filter(c => c.phone); // Only send valid contacts

          // 4. Dispatch via WebSocket
          wsService.sendCommand('trigger_sos', {
            location: locationUrl,
            contacts: contacts
          });

          setSosDispatched(true);
          hapticService.triggerError();
        } catch (err) {
          console.error("SOS Dispatch Error:", err);
        }
      };

      handleSOS();
    } else if (liveState.alert_level === 'Normal' && sosDispatched) {
      // Reset SOS flag when state returns to normal
      setSosDispatched(false);
    }
  }, [liveState.alert_level, sosDispatched, isDemoMode, patientProfile]);

  return (
    <View style={{ flex: 1 }}>
      {/* SOS Banner: FDA-Grade Clinical Alert */}
      {sosDispatched && (
        <View style={styles.sosBanner}>
          <MaterialIcons name="emergency-share" size={24} color="#FFF" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.sosBannerTitle}>AUTONOMOUS SOS DISPATCHED</Text>
            <Text style={styles.sosBannerSub}>Sending GPS location to Emergency Contacts...</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Patient Monitor</Text>
          <ConnectionStatus connected={connected} latency={latency} battery={liveState.battery_status} />
        </View>
        <View style={styles.actionHeader}>
          <TouchableOpacity
            style={[styles.pdfButton, { backgroundColor: colors.primary }]}
            onPress={generatePDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="picture-as-pdf" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.pdfButtonText}>SHARE REPORT</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.cardAlt }]}
            onPress={() => router.push('/doctor-share')}
          >
            <FontAwesome name="whatsapp" size={20} color="#22C55E" style={{ marginRight: 8 }} />
            <Text style={[styles.shareBtnText, { color: colors.text }]}>DR. SHARE</Text>
          </TouchableOpacity>
        </View>
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
        <MetricCard label="Heart Rate" value={liveState.heart_rate} unit="BPM" icon="favorite" color="#EF4444" />
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
    </View>
  );
}

