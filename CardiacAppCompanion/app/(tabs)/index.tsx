import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import hapticService from '../../src/services/HapticService';

export default function HomeScreen() {
  const { liveState, patientProfile } = useCardiacData();
  const { isDemoMode, connected, latency, exerciseSession, showExerciseSummary, setShowExerciseSummary } = React.useContext(AppContext);
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    hapticService.triggerImpact();
    try {
      const html = `<h1>Cardiac Report</h1><p>Stability: ${liveState.stability_score}</p>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
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

  return (
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
  );
}

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
});
