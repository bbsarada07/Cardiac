import React, { useEffect, useContext } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { CardiacProvider, useCardiacData } from '../src/context/CardiacDataContext';
import SOSButton from '../components/SOSButton';
import { ThemeProvider as AppThemeProvider, useTheme } from '../src/context/ThemeContext';
import { useColorScheme, StyleSheet, View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, AppContext } from '../src/context/AppContext';
import audioService from '../src/services/AudioService';
import hapticService from '../src/services/HapticService';
import voiceService from '../src/services/VoiceService';
import LockScreen from './lock';
import OnboardingScreen from './onboarding';
import WelcomeScreen from '../src/components/WelcomeScreen';

function RootLayoutNav() {
  const { theme, colors, hasSelectedTheme } = useTheme();
  const { liveState } = useCardiacData();
  const { isDemoMode, dismissAlert, isAppLocked, hasCompletedOnboarding, liveData } = useContext(AppContext);
  const router = useRouter();
  
  const alertVisible = React.useRef(false);

  useEffect(() => {
    audioService.loadSounds();
    
    // Safety: Suppress the 'Unable to activate keep awake' error which can occur 
    // in New Architecture environments during bootstrap.
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.warn = (...args) => {
      if (args[0]?.toString().includes('Unable to activate keep awake')) return;
      originalWarn(...args);
    };

    console.error = (...args) => {
      if (args[0]?.toString().includes('Unable to activate keep awake')) return;
      originalError(...args);
    };
  }, []);

  React.useEffect(() => {
    // We now trigger based on WebSocket Live Data for zero-lag responsiveness
    if (liveData.emergency_active && !alertVisible.current) {
      alertVisible.current = true;
      router.push('/alert');
      audioService.playCritical();
      voiceService.speakAlert("Warning. Critical cardiac risk detected. Please follow emergency protocol.");
    } else if (!liveData.emergency_active && alertVisible.current) {
      // Auto-hide if backend clears it and we are still on the alert screen
      alertVisible.current = false;
    }

    if (liveState.alert_level === "Caution" && !liveData.emergency_active) {
      audioService.playCaution();
    } else if (liveState.alert_level === "Normal" && !liveData.emergency_active) {
      audioService.stopAll();
      voiceService.stop();
    }
  }, [liveData.emergency_active, liveState.alert_level]);

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      {isDemoMode && (
        <View style={styles.demoBadge}>
          <View style={styles.demoDot} />
          <Text style={styles.demoBadgeText}>SIMULATION ACTIVE</Text>
        </View>
      )}
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background }, headerStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="alert" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="graph" options={{ presentation: 'modal', title: 'Clinical Trends', headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
        <Stack.Screen name="identity" options={{ presentation: 'modal', title: 'Patient Profile', headerShown: false }} />
        <Stack.Screen name="math" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <SOSButton />
      {isAppLocked && <LockScreen />}
      {!hasSelectedTheme && <WelcomeScreen />}
      {hasSelectedTheme && !hasCompletedOnboarding && <OnboardingScreen />}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  demoBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // Highly transparent red
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2000,
    backdropFilter: 'blur(10px)', // Web/Advanced OS support
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  demoBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AppProvider>
          <CardiacProvider>
            <RootLayoutNav />
          </CardiacProvider>
        </AppProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
