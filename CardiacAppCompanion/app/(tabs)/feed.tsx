import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useCardiacData } from '../../src/context/CardiacDataContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function FeedScreen() {
  const { history, liveState, patientProfile } = useCardiacData();
  const { colors, theme } = useTheme();
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Filter history to only show distinct "events" (when alert level or pattern changes, or every 5 mins)
  const events = useMemo(() => {
    interface FeedEvent {
      id: string;
      time: string;
      level: string;
      pattern: string;
      hr: number;
      risk: number;
    }

    const evts: FeedEvent[] = [];
    let lastLevel: string | null = null;
    let lastPattern: string | null = null;

    // We process the history in sequence to detect state transitions
    [...history, liveState].forEach((state) => {
      if (state.alert_level !== lastLevel || state.pattern_label !== lastPattern) {
        evts.push({
          id: state.timestamp.toString() + Math.random().toString(),
          time: new Date(state.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          level: state.alert_level,
          pattern: state.pattern_label,
          hr: state.heart_rate,
          risk: state.risk_probability
        });
        lastLevel = state.alert_level;
        lastPattern = state.pattern_label;
      }
    });
    
    // Reverse to show newest at the top
    return evts.reverse();
  }, [history, liveState]);

  const generatePDF = async () => {
    setIsGenerating(true);
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
    } catch (error) {
      console.error(error);
      Alert.alert("Report Error", "Failed to generate or share the clinical report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getEventStyle = (level: string) => {
    const isDark = theme === 'dark';
    if (level === "Critical") return { color: '#EF4444', icon: 'error' as const, bg: isDark ? '#3F1616' : '#FEE2E2' };
    if (level === "Caution") return { color: '#F97316', icon: 'warning' as const, bg: isDark ? '#3A2012' : '#FFEDD5' };
    return { color: '#22C55E', icon: 'check-circle' as const, bg: isDark ? '#142E1F' : '#DCFCE7' }; // Normal
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>System Log & Alerts</Text>
        <TouchableOpacity 
          style={[styles.reportBtn, { backgroundColor: colors.primary }]} 
          onPress={generatePDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialIcons name="description" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.reportBtnText}>SHARE REPORT</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <Text style={styles.emptyText}>No events recorded in current session.</Text>
      ) : (
        events.map((evt) => {
          const s = getEventStyle(evt.level);
          return (
            <View key={evt.id} style={[styles.eventCard, { backgroundColor: s.bg, borderColor: colors.border }]}>
              <View style={styles.eventIconBox}>
                <MaterialIcons name={s.icon} size={28} color={s.color} />
              </View>
              <View style={styles.eventData}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: s.color }]}>
                    {evt.level.toUpperCase()} NOTIFICATION
                  </Text>
                  <Text style={[styles.eventTime, { color: colors.subtext }]}>{evt.time}</Text>
                </View>
                <Text style={[styles.eventDesc, { color: colors.text }]}>
                  Detected {evt.pattern}. HR is at {evt.hr} BPM. Risk index assessed at {evt.risk}%.
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: 'bold',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  reportBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  eventIconBox: {
    marginRight: 16,
    marginTop: 2,
  },
  eventData: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  eventTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  eventDesc: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 22,
  }
});
