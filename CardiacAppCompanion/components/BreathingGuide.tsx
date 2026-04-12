import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.5;

export default function BreathingGuide() {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const [instruction, setInstruction] = useState('Breathe In');

  useEffect(() => {
    // 4-4-4 Cycle: 
    // 4s Inhale (expand)
    // 4s Hold
    // 4s Exhale (shrink)
    
    const startCycle = () => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 4000, easing: Easing.bezier(0.42, 0, 0.58, 1) }, () => {
            runOnJS(setInstruction)('Hold');
          }),
          withTiming(1.6, { duration: 4000 }, () => {
            runOnJS(setInstruction)('Breathe Out');
          }),
          withTiming(1, { duration: 4000, easing: Easing.bezier(0.42, 0, 0.58, 1) }, () => {
            runOnJS(setInstruction)('Breathe In');
          })
        ),
        -1, // Loop forever
        false
      );
      
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 4000 }),
          withTiming(1, { duration: 4000 }),
          withTiming(0.6, { duration: 4000 })
        ),
        -1,
        false
      );
    };

    startCycle();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: colors.text }]}>STRESS INTERVENTION</Text>
      <View style={styles.guideWrapper}>
        <Animated.View style={[styles.circle, animatedStyle]} />
        <View style={styles.textOverlay}>
          <Text style={styles.instruction}>{instruction}</Text>
        </View>
      </View>
      <Text style={[styles.subText, { color: colors.subtext }]}>Follow the circle to stabilize HRV</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 40,
    width: '100%',
  },
  header: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 40,
  },
  guideWrapper: {
    width: CIRCLE_SIZE * 2,
    height: CIRCLE_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  textOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  subText: {
    fontSize: 12,
    marginTop: 40,
    fontStyle: 'italic',
  },
});
