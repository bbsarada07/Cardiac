import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../src/context/AppContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';

export default function MathExplainer() {
  const { liveData } = useContext(AppContext);
  const { colors } = useTheme();
  const router = useRouter();

  const stability = Math.round(liveData.stability);
  const k = liveData.ode_k || 0.005;
  const h0 = Math.round(liveData.ode_h0) || 50;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Clinical Logic</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.mathCard, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.mathTitle, { color: colors.primary }]}>THE STABILITY MODEL</Text>
          <Text style={[styles.formula, { color: colors.text }]}>dS/dt = -k(S - H₀)</Text>
          <Text style={[styles.mathSub, { color: colors.subtext }]}>Ordinary Differential Equation (ODE)</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Parameters</Text>
          
          <View style={[styles.paramRow, { backgroundColor: colors.card }]}>
            <View>
              <Text style={[styles.paramLabel, { color: colors.subtext }]}>Decay Rate (k)</Text>
              <Text style={[styles.paramValue, { color: colors.text }]}>{k.toFixed(4)}</Text>
            </View>
            <Text style={styles.paramDesc}>Velocity of physiological degradation.</Text>
          </View>

          <View style={[styles.paramRow, { backgroundColor: colors.card }]}>
            <View>
              <Text style={[styles.paramLabel, { color: colors.subtext }]}>Baseline (H₀)</Text>
              <Text style={[styles.paramValue, { color: colors.text }]}>{h0}</Text>
            </View>
            <Text style={styles.paramDesc}>Your projected healthy equilibrium.</Text>
          </View>
        </View>

        <View style={styles.explainerBox}>
          <Text style={[styles.explainTitle, { color: colors.text }]}>How to read this?</Text>
          <Text style={[styles.explainBody, { color: colors.subtext }]}>
            The system tracks your "Stability" (S). If S drops below 40%, a critical alert is triggered.
            {"\n\n"}
            The <Text style={{fontWeight: 'bold', color: colors.text}}>Decay Rate (k)</Text> tells us how fast you are moving away from your baseline. A higher k means your heart is struggling to maintain homeostasis.
            {"\n\n"}
            This model allows us to predict a <Text style={{fontWeight: 'bold', color: colors.text}}>Time to Critical</Text> before it actually happens, giving caregivers a 15-20 minute head start.
          </Text>
        </View>

        <View style={[styles.liveIndicator, { borderColor: colors.border }]}>
          <View style={styles.dot} />
          <Text style={[styles.liveText, { color: colors.subtext }]}>
            Live S: {stability}% | Status: {stability < 40 ? 'Critical' : stability < 70 ? 'Caution' : 'Normal'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  mathCard: {
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 30,
  },
  mathTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  formula: {
    fontSize: 32,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  mathSub: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  section: {
    gap: 12,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paramRow: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  paramValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  paramDesc: {
    flex: 0.6,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
  explainerBox: {
    gap: 12,
    marginBottom: 40,
  },
  explainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  explainBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
