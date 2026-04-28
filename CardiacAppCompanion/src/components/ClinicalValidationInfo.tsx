import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import hapticService from '../services/HapticService';

interface ClinicalValidationInfoProps {
  isVisible: boolean;
  onClose: () => void;
}

const ClinicalValidationInfo: React.FC<ClinicalValidationInfoProps> = ({ isVisible, onClose }) => {
  const { colors, theme } = useTheme();

  if (!isVisible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={60} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        
        <Animated.View 
          entering={SlideInDown.springify().damping(15)} 
          style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="psychology" size={24} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>AI CLINICAL VALIDATION</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.intro, { color: colors.subtext }]}>
              The AI Confidence score represents the reliability of the current cardiac classification.
            </Text>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>VALIDATION LAYERS</Text>
              
              <View style={[styles.layerCard, { backgroundColor: colors.cardAlt }]}>
                <MaterialIcons name="waves" size={20} color={colors.primary} />
                <View style={styles.layerInfo}>
                  <Text style={[styles.layerName, { color: colors.text }]}>Signal Integrity Filter</Text>
                  <Text style={[styles.layerDesc, { color: colors.subtext }]}>
                    Detects motion artifacts and lead-off conditions to prevent false alarms.
                  </Text>
                </View>
              </View>

              <View style={[styles.layerCard, { backgroundColor: colors.cardAlt }]}>
                <MaterialIcons name="compare" size={20} color={colors.primary} />
                <View style={styles.layerInfo}>
                  <Text style={[styles.layerName, { color: colors.text }]}>Pattern Matching</Text>
                  <Text style={[styles.layerDesc, { color: colors.subtext }]}>
                    Cross-references real-time ECG morphology with 14,000+ clinical arrhythmia samples.
                  </Text>
                </View>
              </View>

              <View style={[styles.layerCard, { backgroundColor: colors.cardAlt }]}>
                <MaterialIcons name="functions" size={20} color={colors.primary} />
                <View style={styles.layerInfo}>
                  <Text style={[styles.layerName, { color: colors.text }]}>ODE Stability Check</Text>
                  <Text style={[styles.layerDesc, { color: colors.subtext }]}>
                    Uses Ordinary Differential Equations to model the "decay" of cardiac stability.
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.disclaimerBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <MaterialIcons name="warning-amber" size={20} color={colors.primary} />
              <Text style={[styles.disclaimerText, { color: colors.text }]}>
                <Text style={{ fontWeight: 'bold' }}>FDA NOTICE:</Text> This application is for monitoring purposes only. Do not make medical decisions based solely on AI classification. Consult a cardiologist for clinical diagnosis.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: colors.primary }]} 
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>UNDERSTOOD</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 24,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  layerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
  },
  layerInfo: {
    flex: 1,
  },
  layerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  layerDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 32,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  closeBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default ClinicalValidationInfo;
