import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
}

export default function MetricCard({ label, value, unit, icon, color = '#3B82F6' }: MetricCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const prevValue = React.useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      scale.value = withSpring(1.08, { damping: 5, stiffness: 200 }, () => {
        scale.value = withTiming(1, { duration: 200 });
      });
      prevValue.current = value;
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <MaterialIcons name={icon} size={20} color={color} />
        <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
      </View>
      <Animated.View style={[styles.valueContainer, animatedStyle]}>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {unit ? <Text style={[styles.unit, { color: colors.subtext }]}>{unit}</Text> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: 'bold',
  },
  unit: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
});
