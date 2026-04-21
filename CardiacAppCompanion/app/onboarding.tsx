import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../src/context/AppContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: "Clinical Awareness",
    desc: "Welcome to the CorAssist Clinical Platform. This system transforms raw ECG signals into real-time cardiac safety metrics.",
    icon: "monitor-heart",
    color: "#3B82F6"
  },
  {
    title: "Sensor Placement",
    desc: "Ensure AD8232 electrodes are placed precisely on the chest for clean R-peak detection. Noise will trigger a 'Calibrating' state.",
    icon: "person-add",
    color: "#10B981"
  },
  {
    title: "Stability Model",
    desc: "Using Ordinary Differential Equations (ODE), we predict risk up to 15 minutes before an event occurrs based on HRV decay.",
    icon: "show-chart",
    color: "#EAB308"
  },
  {
    title: "Safety Alerts",
    desc: "Red status indicates a Critical Alert. The app will trigger sirens, haptics, and verbal warnings automatically.",
    icon: "notifications-active",
    color: "#EF4444"
  }
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const { completeOnboarding } = useContext(AppContext);
  const { colors } = useTheme();

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      setIndex(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const slide = SLIDES[index];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View 
          key={index} 
          entering={SlideInRight} 
          exiting={SlideOutLeft}
          style={styles.slide}
        >
          <View style={[styles.iconCircle, { backgroundColor: slide.color + '20' }]}>
            <MaterialIcons name={slide.icon as any} size={80} color={slide.color} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
          <Text style={[styles.desc, { color: colors.subtext }]}>{slide.desc}</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                { backgroundColor: i === index ? colors.primary : colors.border }
              ]} 
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {index === SLIDES.length - 1 ? "GET STARTED" : "CONTINUE"}
          </Text>
        </TouchableOpacity>

        {index < SLIDES.length - 1 && (
          <TouchableOpacity onPress={completeOnboarding}>
            <Text style={[styles.skipText, { color: colors.subtext }]}>Skip Introduction</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  slide: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  desc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
    gap: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
