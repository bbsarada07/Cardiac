import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../src/context/AppContext';
import { useCardiacData } from '../src/context/CardiacDataContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import Animated, { 
  FadeIn, FadeOut, SlideInRight, SlideOutLeft, 
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import hapticService from '../src/services/HapticService';

const { width, height } = Dimensions.get('window');

const HEALTH_CONDITIONS = [
  "Hypertension", "Arrhythmia", "Diabetes", "Stroke History", "Heart Valve Issues", "Other"
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { completeOnboarding } = useContext(AppContext);
  const { patientProfile, updatePatientProfile, saveProfileToDisk } = useCardiacData();
  const { colors } = useTheme();

  // Animation Values
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    announceStep(0);
  }, []);

  const announceStep = (index: number) => {
    const text = [
      "Welcome to CorAssist. First, who are we looking after today? Please enter your name.",
      "Tell us a bit about your health. Select any conditions that apply to you.",
      "Who should we alert in an emergency? Please enter a primary contact name and phone number."
    ][index];
    Speech.speak(text, { rate: 0.9 });
  };

  const handleNext = async () => {
    hapticService.triggerImpact();
    if (step < 2) {
      setStep(prev => prev + 1);
      announceStep(step + 1);
    } else {
      await saveProfileToDisk();
      completeOnboarding();
    }
  };

  const toggleCondition = (cond: string) => {
    hapticService.triggerImpact();
    const current = patientProfile.conditions || "";
    const list = current.split(',').map(s => s.trim()).filter(s => s !== "");
    let updated;
    if (list.includes(cond)) {
      updated = list.filter(item => item !== cond).join(', ');
    } else {
      updated = [...list, cond].join(', ');
    }
    updatePatientProfile({ conditions: updated });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    shadowOpacity: (pulse.value - 1) * 5 + 0.3,
  }));

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.card}>
            <MaterialIcons name="face" size={60} color={colors.primary} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Who are we looking after today?</Text>
            <Text style={[styles.cardSub, { color: colors.subtext }]}>We'll use this to personalize your medical alerts.</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.primary + '40', backgroundColor: colors.cardAlt }]}
              placeholder="Full Name"
              placeholderTextColor={colors.subtext + '80'}
              value={patientProfile.name}
              onChangeText={(t) => updatePatientProfile({ name: t })}
            />
          </Animated.View>
        );
      case 1:
        return (
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.card}>
            <MaterialIcons name="health-and-safety" size={60} color={colors.primary} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tell us a bit about your health.</Text>
            <View style={styles.pillContainer}>
              {HEALTH_CONDITIONS.map(cond => {
                const isSelected = (patientProfile.conditions || "").includes(cond);
                return (
                  <TouchableOpacity 
                    key={cond} 
                    onPress={() => toggleCondition(cond)}
                    style={[
                      styles.pill, 
                      { 
                        backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                        borderColor: isSelected ? colors.primary : colors.border
                      }
                    ]}
                  >
                    <Text style={[styles.pillText, { color: isSelected ? '#FFF' : colors.text }]}>{cond}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.card}>
            <MaterialIcons name="emergency" size={60} color={colors.primary} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Who should we alert in an emergency?</Text>
            <Text style={[styles.cardSub, { color: colors.subtext }]}>This person will receive an autonomous SOS call if needed.</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.primary + '40', backgroundColor: colors.cardAlt }]}
              placeholder="Guardian Name"
              placeholderTextColor={colors.subtext + '80'}
              value={patientProfile.contact1_name}
              onChangeText={(t) => updatePatientProfile({ contact1_name: t })}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.primary + '40', backgroundColor: colors.cardAlt }]}
              placeholder="Phone Number"
              placeholderTextColor={colors.subtext + '80'}
              keyboardType="phone-pad"
              value={patientProfile.contact1_phone}
              onChangeText={(t) => updatePatientProfile({ contact1_phone: t })}
            />
          </Animated.View>
        );
    }
  };

  return (
    <LinearGradient
      colors={['#0F1E2E', '#064E3B']} // Deep Navy to Medical Teal
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to CorAssist</Text>
          <Text style={styles.guardianText}>Let's set up your guardian.</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.progressRow}>
            {[0, 1, 2].map(i => (
              <View 
                key={i} 
                style={[
                  styles.progressDot, 
                  { backgroundColor: i <= step ? colors.primary : '#FFF3' }
                ]} 
              />
            ))}
          </View>
          {renderStep()}
        </View>

        <View style={styles.footer}>
          <Animated.View style={step === 2 ? animatedButtonStyle : {}}>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: colors.primary }]} 
              onPress={handleNext}
            >
              <Text style={styles.btnText}>
                {step === 2 ? "ACTIVATE MY PROTECTION" : "CONTINUE"}
              </Text>
              <MaterialIcons name={step === 2 ? "shield" : "arrow-forward"} size={24} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={[styles.safetyNote, { color: '#FFF8' }]}>
            <MaterialIcons name="lock" size={10} /> Your data is encrypted and stays private to you and your loved ones.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    padding: 30,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  guardianText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '900',
    lineHeight: 34,
  },
  content: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  progressDot: {
    height: 6,
    flex: 1,
    borderRadius: 3,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardIcon: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 30,
  },
  cardSub: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  input: {
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    gap: 20,
  },
  btn: {
    height: 72,
    borderRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  safetyNote: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});
