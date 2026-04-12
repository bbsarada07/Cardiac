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
      // Calculate averages from history
      const avgHR = history.length > 0 ? Math.round(history.reduce((acc, s) => acc + s.heart_rate, 0) / history.length) : liveState.heart_rate;
      const avgSpO2 = history.length > 0 ? (history.reduce((acc, s) => acc + s.spo2, 0) / history.length).toFixed(1) : liveState.spo2.toFixed(1);
      
      const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { color: #1e3a8a; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { font-size: 13px; }
            .info-label { color: #64748b; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            .status-normal { color: #16a34a; font-weight: bold; }
            .status-caution { color: #d97706; font-weight: bold; }
            .status-critical { color: #dc2626; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">BIO-FEA CARDIAC CLINICAL PLATFORM</div>
            <div class="subtitle">Official Session Summary Report</div>
          </div>

          <div class="section">
            <div class="section-title">PATIENT IDENTITY</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Name:</span> ${patientProfile.name || 'Jane Doe'}</div>
              <div class="info-item"><span class="info-label">Age/Sex:</span> ${patientProfile.age || '45'}y / ${patientProfile.sex || 'Female'}</div>
              <div class="info-item"><span class="info-label">Known Conditions:</span> ${patientProfile.conditions || 'None Declared'}</div>
              <div class="info-item"><span class="info-label">Report Date:</span> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">DIAGNOSTIC SUMMARY</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Session Avg Heart Rate:</span> ${avgHR} BPM</div>
              <div class="info-item"><span class="info-label">Session Avg SpO2:</span> ${avgSpO2}%</div>
              <div class="info-item"><span class="info-label">Current Risk Index:</span> ${liveState.risk_probability}%</div>
              <div class="info-item"><span class="info-label">Last System Status:</span> <span class="status-${liveState.alert_level.toLowerCase()}">${liveState.alert_level.toUpperCase()}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">RECENT CLINICAL EVENTS</div>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Alert Level</th>
                  <th>Rhythm Pattern</th>
                  <th>HR (BPM)</th>
                  <th>Risk %</th>
                </tr>
              </thead>
              <tbody>
                ${events.slice(0, 15).map(e => `
                  <tr>
                    <td>${e.time}</td>
                    <td class="status-${e.level.toLowerCase()}">${e.level.toUpperCase()}</td>
                    <td>${e.pattern}</td>
                    <td>${e.hr}</td>
                    <td>${e.risk}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            Confidential Medical Report - Generated via Cardiac Companion App<br/>
            This report is for informational purposes only. Consult a medical professional for diagnosis.
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
