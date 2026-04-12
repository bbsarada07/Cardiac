import React from 'react';
import { TouchableOpacity, StyleSheet, Alert, Vibration } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SOSButton() {
  const router = useRouter();

  const handlePress = () => {
    Vibration.vibrate(500);
    Alert.alert(
      "EMERGENCY SOS",
      "Are you sure you want to trigger an emergency alert?",
      [
        { text: "Cancel", style: "cancel" },
        { 
            text: "Trigger SOS", 
            style: "destructive",
            onPress: () => {
                // Navigate to the alert screen or trigger an API call
                router.push('/alert');
            }
        }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.8}>
      <MaterialIcons name="emergency" size={28} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444', // Red-500
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999, // Ensure it's on top
  },
});
