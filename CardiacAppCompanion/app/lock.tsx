import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../src/context/AppContext';
import EmergencyCard from '../src/components/EmergencyCard';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../src/context/ThemeContext';
import hapticService from '../src/services/HapticService';

export default function LockScreen() {
  const { liveData, userPin, setIsAppLocked } = useContext(AppContext);
  const { colors } = useTheme();
  const [enteredPin, setEnteredPin] = useState('');
  const [showMedicalId, setShowMedicalId] = useState(false);


  const getStatusColor = () => {
    if (liveData.stability < 40) return '#EF4444'; // Critical
    if (liveData.stability < 70) return '#EAB308'; // Caution
    return '#22C55E'; // Normal
  };

  const handlePress = (num: string) => {
    hapticService.triggerImpact();
    const newPin = enteredPin + num;
    if (newPin.length <= 4) {
      setEnteredPin(newPin);
    }
    
    if (newPin === userPin) {
      hapticService.triggerSuccess();
      setIsAppLocked(false);
    } else if (newPin.length === 4) {
      hapticService.triggerError();
      setTimeout(() => setEnteredPin(''), 500);
    }
  };

  const handleBackspace = () => {
    hapticService.triggerImpact();
    setEnteredPin(prev => prev.slice(0, -1));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statusHeader}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={[styles.statusText, { color: colors.text }]}>SYSTEM ACTIVE</Text>
      </View>

      <View style={styles.pinContainer}>
        <Text style={[styles.instruction, { color: colors.subtext }]}>ENTER PIN TO VIEW TELEMETRY</Text>
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                { backgroundColor: enteredPin.length >= i ? colors.primary : colors.border }
              ]} 
            />
          ))}
        </View>
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity 
            key={num} 
            style={[styles.key, { backgroundColor: colors.cardAlt }]} 
            onPress={() => handlePress(num.toString())}
          >
            <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.keyPlaceholder} />
        <TouchableOpacity 
          style={[styles.key, { backgroundColor: colors.cardAlt }]} 
          onPress={() => handlePress('0')}
        >
          <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.keyAction} 
          onPress={handleBackspace}
        >
          <MaterialIcons name="backspace" size={24} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.medicalBtn, { backgroundColor: '#EF4444' }]} 
          onPress={() => {
            hapticService.triggerImpact();
            setShowMedicalId(true);
          }}
        >
          <MaterialIcons name="emergency" size={20} color="#FFF" />
          <Text style={styles.medicalText}>MEDICAL ID</Text>
        </TouchableOpacity>
      </View>

      {showMedicalId && (
        <EmergencyCard onDismiss={() => setShowMedicalId(false)} />
      )}
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-around',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  pinContainer: {
    alignItems: 'center',
  },
  instruction: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
  },
  keyPlaceholder: {
    width: 80,
  },
  keyAction: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  medicalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  medicalText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
