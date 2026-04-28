import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import hapticService from '../services/HapticService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface EmergencyCardProps {
  onDismiss: () => void;
}

interface PatientProfile {
  name: string;
  age: string;
  bloodGroup: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
  emergencyContacts: { name: string; phone: string; relationship: string }[];
}

const EmergencyCard: React.FC<EmergencyCardProps> = ({ onDismiss }) => {
  const { colors, theme } = useTheme();
  const [profile, setProfile] = useState<PatientProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem('@patient_profile');
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        } else {
          // Fallback / Mock data for first-time use
          setProfile({
            name: "John Doe",
            age: "65",
            bloodGroup: "O+",
            medicalConditions: "Hypertension, Post-MI Recovery",
            medications: "Aspirin 75mg, Atorvastatin 40mg",
            allergies: "None known",
            emergencyContacts: [
              { name: "Jane Doe", phone: "+91 9876543210", relationship: "Spouse" },
              { name: "Cardiac Clinic", phone: "+91 1234567890", relationship: "Hospital" }
            ]
          });
        }
      } catch (e) {
        console.error("Error loading profile", e);
      }
    };
    loadProfile();
  }, []);

  const handleCall = (phone: string) => {
    hapticService.triggerImpact();
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <Modal transparent animationType="none" visible onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        
        <Animated.View 
          entering={SlideInDown.springify().damping(15)} 
          style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="medical-services" size={24} color="#FFF" />
              <Text style={styles.headerTitle}>MEDICAL ID</Text>
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Identity Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.cardAlt }]}>
              <View style={styles.idRow}>
                <View>
                  <Text style={[styles.label, { color: colors.subtext }]}>NAME</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{profile?.name}</Text>
                </View>
                <View style={styles.idRight}>
                  <Text style={[styles.label, { color: colors.subtext }]}>AGE</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{profile?.age}</Text>
                </View>
                <View style={styles.idRight}>
                  <Text style={[styles.label, { color: colors.subtext }]}>BLOOD</Text>
                  <Text style={[styles.value, { color: '#EF4444', fontWeight: '900' }]}>{profile?.bloodGroup}</Text>
                </View>
              </View>
            </View>

            {/* Medical Info */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>CLINICAL DATA</Text>
              
              <View style={styles.dataRow}>
                <MaterialIcons name="info-outline" size={20} color={colors.subtext} />
                <View style={styles.dataText}>
                  <Text style={[styles.label, { color: colors.subtext }]}>CONDITIONS</Text>
                  <Text style={[styles.dataValue, { color: colors.text }]}>{profile?.medicalConditions}</Text>
                </View>
              </View>

              <View style={styles.dataRow}>
                <MaterialIcons name="medication" size={20} color={colors.subtext} />
                <View style={styles.dataText}>
                  <Text style={[styles.label, { color: colors.subtext }]}>MEDICATIONS</Text>
                  <Text style={[styles.dataValue, { color: colors.text }]}>{profile?.medications}</Text>
                </View>
              </View>

              <View style={styles.dataRow}>
                <MaterialIcons name="warning-amber" size={20} color={colors.subtext} />
                <View style={styles.dataText}>
                  <Text style={[styles.label, { color: colors.subtext }]}>ALLERGIES</Text>
                  <Text style={[styles.dataValue, { color: colors.text }]}>{profile?.allergies}</Text>
                </View>
              </View>
            </View>

            {/* Emergency Contacts */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>EMERGENCY DISPATCH</Text>
              {profile?.emergencyContacts.map((contact, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.contactCard, { backgroundColor: colors.cardAlt }]}
                  onPress={() => handleCall(contact.phone)}
                >
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                    <Text style={[styles.contactRelation, { color: colors.subtext }]}>{contact.relationship}</Text>
                  </View>
                  <View style={styles.callCircle}>
                    <MaterialIcons name="call" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.globalEmergencyBtn}
              onPress={() => handleCall('911')}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                style={styles.globalEmergencyGradient}
              >
                <MaterialIcons name="emergency-share" size={24} color="#FFF" />
                <Text style={styles.globalEmergencyText}>BROADCAST SOS TO 911</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  idRight: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  dataText: {
    flex: 1,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
  },
  contactRelation: {
    fontSize: 12,
    marginTop: 2,
  },
  callCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  globalEmergencyBtn: {
    marginTop: 12,
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  globalEmergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
  },
  globalEmergencyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default EmergencyCard;
