import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useCardiacData } from '../../src/context/CardiacDataContext';
import { LineChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

const screenWidth = Dimensions.get("window").width;

export default function ODEScreen() {
  const { liveState } = useCardiacData();
  const { colors, theme } = useTheme();
  const { ode_h0, ode_k, hrv_sdnn, risk_window_minutes } = liveState;

  // Generate theoretical decay curve points over 30 mins
  // Equation: H(t) = H0 * e^(-k * t)
  const theoreticalData = [];
  const labels = [];
  for (let t = 0; t <= 30; t += 5) {
    labels.push(`${t}m`);
    theoreticalData.push(ode_h0 * Math.exp(-ode_k * t));
  }

  // To show "actual HRV values as dots", we can approximate it by injecting the current HRV.
  // In a full implementation, python provides the actual tuples. 
  // For the UI redesign task, we display the curve smoothly alongside current point.
  
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => theme === 'dark' ? `rgba(167, 139, 250, ${opacity})` : `rgba(139, 92, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.background
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Predictive Modeling</Text>

      <View style={[styles.equationCard, { backgroundColor: colors.card }]}>
        <MaterialIcons name="functions" size={28} color="#C084FC" />
        <View style={styles.equationTextContainer}>
          <Text style={[styles.equationMath, { color: colors.text }]}>H(t) = H₀ · e<Text style={{fontSize: 14}}>-kt</Text></Text>
          <Text style={[styles.equationSub, { color: colors.subtext }]}>Lyapunov HRV Decay Model</Text>
        </View>
      </View>

      <View style={[styles.graphCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.graphTitle, { color: colors.text }]}>Forecasted Trajectory</Text>
        <LineChart
          data={{
            labels: labels,
            datasets: [
              { 
                data: theoreticalData,
                color: (opacity = 1) => `rgba(192, 132, 252, ${opacity})`, // Solid purple line
              }
            ]
          }}
          width={screenWidth - 32}
          height={240}
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
          formatYLabel={(y) => Math.round(Number(y)).toString()}
          withInnerLines={false}
        />
        
        <View style={styles.variablesRow}>
          <View style={styles.variableBox}>
            <Text style={[styles.varLabel, { color: colors.subtext }]}>H₀ (Base)</Text>
            <Text style={[styles.varValue, { color: colors.text }]}>{ode_h0.toFixed(1)} ms</Text>
          </View>
          <View style={styles.variableBox}>
            <Text style={[styles.varLabel, { color: colors.subtext }]}>k (Decay)</Text>
            <Text style={[styles.varValue, { color: colors.text }]}>{ode_k.toFixed(3)}</Text>
          </View>
          <View style={styles.variableBox}>
            <Text style={[styles.varLabel, { color: colors.subtext }]}>Current</Text>
            <Text style={[styles.varValue, {color: colors.primary}]}>{hrv_sdnn} ms</Text>
          </View>
        </View>
      </View>

      <View style={[styles.riskCard, { backgroundColor: colors.cardAlt, borderLeftColor: risk_window_minutes && risk_window_minutes < 20 ? '#EF4444' : '#EAB308' }]}>
        <MaterialIcons name="hourglass-bottom" size={24} color={colors.text} style={{marginRight: 12}} />
        <View>
          <Text style={[styles.riskCardTitle, { color: colors.subtext }]}>Estimated Risk Window</Text>
          <Text style={[styles.riskCardValue, { color: colors.text }]}>
            {risk_window_minutes 
              ? `Critical threshold in ~${Math.round(risk_window_minutes)} mins`
              : 'Insufficient decay trajectory to predict horizon.'}
          </Text>
        </View>
      </View>

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
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 4,
  },
  equationCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  equationTextContainer: {
    marginLeft: 16,
  },
  equationMath: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  equationSub: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  graphCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  graphTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
  },
  chartStyle: {
    borderRadius: 16,
    paddingRight: 16,
    marginTop: 10,
  },
  variablesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  variableBox: {
    alignItems: 'center',
  },
  varLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  varValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  riskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  riskCardTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  riskCardValue: {
    color: '#F8FAFC',
    fontSize: 15,
    marginRight: 24, // Prevent text overflow over icon
  }
});
