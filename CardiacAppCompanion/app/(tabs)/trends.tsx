import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useCardiacData } from '../../src/context/CardiacDataContext';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../src/context/ThemeContext';

const screenWidth = Dimensions.get("window").width;

export default function TrendsScreen() {
  const { history } = useCardiacData();
  const { colors, theme } = useTheme();

  const labels = history.map((_, i) => (i % 5 === 0 && i !== 0 ? `-${30 - i}m` : ""));
  
  const scoreData = history.length > 0 ? history.map(h => h.stability_score) : [0];
  const hrData = history.length > 0 ? history.map(h => h.heart_rate) : [0];
  const hrvData = history.length > 0 ? history.map(h => h.hrv_sdnn) : [0];

  const chartConfig = (color: (opacity: number) => string) => ({
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: color,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    strokeWidth: 3, 
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.background
    }
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Vitals Overview</Text>
      
      {/* Stability Score Graph */}
      <View style={[styles.graphCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.graphTitle, { color: colors.text }]}>Stability Score</Text>
        <LineChart
          data={{
            labels: labels,
            datasets: [{ data: scoreData }]
          }}
          width={screenWidth - 32}
          height={180}
          chartConfig={chartConfig((opacity = 1) => `rgba(34, 197, 94, ${opacity})`)} // Green
          bezier
          style={styles.chartStyle}
          formatYLabel={(y) => Math.round(Number(y)).toString()}
        />
      </View>

      {/* Heart Rate Graph */}
      <View style={[styles.graphCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.graphTitle, { color: colors.text }]}>Heart Rate (BPM)</Text>
        <LineChart
          data={{
            labels: labels,
            datasets: [{ data: hrData }]
          }}
          width={screenWidth - 32}
          height={180}
          chartConfig={chartConfig((opacity = 1) => `rgba(239, 68, 68, ${opacity})`)} // Red
          bezier
          style={styles.chartStyle}
          formatYLabel={(y) => Math.round(Number(y)).toString()}
        />
      </View>

      {/* HRV Graph */}
      <View style={[styles.graphCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.graphTitle, { color: colors.text }]}>HRV SDNN (ms)</Text>
        <LineChart
          data={{
            labels: labels,
            datasets: [{ data: hrvData }]
          }}
          width={screenWidth - 32}
          height={180}
          chartConfig={chartConfig((opacity = 1) => `rgba(59, 130, 246, ${opacity})`)} // Blue
          bezier
          style={styles.chartStyle}
          formatYLabel={(y) => Math.round(Number(y)).toString()}
        />
      </View>
      
      <View style={{height: 80}} />
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
    marginRight: 0,
  }
});
