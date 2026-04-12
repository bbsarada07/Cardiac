import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useCardiacData } from '../src/context/CardiacDataContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function GraphScreen() {
  const { history } = useCardiacData();
  const { colors, theme } = useTheme();
  const router = useRouter();

  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    // Take last 30 points
    const points = history.slice(-30);
    
    return {
      labels: points.map((_, i) => i % 10 === 0 ? `-${30-i}s` : ""),
      datasets: [
        {
          data: points.map(h => h.stability_score),
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Green (Stability)
          strokeWidth: 3
        },
        {
          data: points.map(h => h.risk_probability),
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Red (Risk)
          strokeWidth: 2
        }
      ],
      legend: ["Stability", "Risk Index"]
    };
  }, [history]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Clinical Trends</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.cardTitle, { color: colors.subtext }]}>LONGITUDINAL TELEMETRY (30S)</Text>
          
          {chartData ? (
            <LineChart
              data={chartData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: colors.cardAlt,
                backgroundGradientFrom: colors.cardAlt,
                backgroundGradientTo: colors.cardAlt,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary }
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={{ color: colors.subtext }}>Insufficient historical data...</Text>
            </View>
          )}
        </View>

        <View style={styles.legendBox}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>{"Stability (Target: >70%)"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>{"Risk Index (Threshold: 60%)"}</Text>
          </View>
        </View>

        <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="analytics" size={24} color={colors.primary} />
          <Text style={[styles.insightTitle, { color: colors.text }]}>Predictive Insight</Text>
          <Text style={[styles.insightBody, { color: colors.subtext }]}>
            Stability is calculated using real-time SDNN/RMSSD variance. 
            A converging Risk and Stability line indicates a high-probability cardiac event in the next window.
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
  card: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyBox: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendBox: {
    paddingHorizontal: 10,
    marginBottom: 30,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightCard: {
    padding: 24,
    borderRadius: 20,
    gap: 12,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  insightBody: {
    fontSize: 14,
    lineHeight: 22,
  },
});
