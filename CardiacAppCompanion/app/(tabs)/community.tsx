import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Modal, 
  Alert, 
  Pressable,
  Linking
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInUp, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  interpolate
} from 'react-native-reanimated';
import hapticService from '../../src/services/HapticService';

import { FlexStyle } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Signal {
  id: string;
  type: 'aed' | 'doctor' | 'volunteer';
  name: string;
  distance: string;
  uiPos: FlexStyle;
  mapQuery: string;
}

// --- Mock Data: Community Signals ---
const COMMUNITY_SIGNALS: Signal[] = [
  { id: '1', type: 'aed', name: 'T-Hub AED', distance: '50m', uiPos: { top: '30%', right: '25%' }, mapQuery: 'T-Hub+Hyderabad' },
  { id: '2', type: 'doctor', name: 'Dr. Aruna S.', distance: '200m', uiPos: { top: '60%', left: '20%' }, mapQuery: 'Medicover+Hospitals+HITEC+City' },
  { id: '3', type: 'volunteer', name: 'Rahul M.', distance: '450m', uiPos: { top: '20%', left: '40%' }, mapQuery: 'Inorbit+Mall+Cyberabad' }
];

const CommunityScreen = () => {
  const { colors } = useTheme();
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isErModalVisible, setIsErModalVisible] = useState(false);
  
  const broadcastScale = useSharedValue(1);
  const sonarValue = useSharedValue(0);
  const pinPulse = useSharedValue(0);

  const volunteers = [
    { name: "Dr. Aruna S.", distance: "200m", role: "Physician", active: true },
    { name: "Rahul M.", distance: "450m", role: "First Responder", active: true },
    { name: "Sita K.", distance: "600m", role: "Nurse", active: false },
  ];

  // --- Animation Hooks ---
  useEffect(() => {
    sonarValue.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false);
    pinPulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }), -1, true);
  }, []);

  // --- Handlers ---
  const handleBroadcastPressIn = () => {
    broadcastScale.value = withSpring(0.95);
    hapticService.triggerImpact();
  };

  const handleBroadcastPressOut = () => {
    broadcastScale.value = withSpring(1);
  };

  const triggerBroadcast = () => {
    hapticService.triggerError();
    Alert.alert("Broadcast Sent", "Notifying 12 nearby volunteers and pinging local AED stations.", [{ text: "Understood" }]);
  };

  const openDirections = (mapQuery: string) => {
    hapticService.triggerSuccess();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open navigation app.");
    });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: broadcastScale.value }] }));
  const sonarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(sonarValue.value, [0, 1], [1, 2.5]) }],
    opacity: interpolate(sonarValue.value, [0, 0.8, 1], [0.6, 0.2, 0])
  }));
  const pinGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pinPulse.value, [0, 1], [1, 1.4]) }],
    opacity: interpolate(pinPulse.value, [0, 1], [0.5, 0.1])
  }));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Community SOS</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Nearby volunteers and emergency resources</Text>
      </Animated.View>

      {/* Network Status Card */}
      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient colors={[colors.primary + '20', 'transparent']} style={styles.cardGradient}>
          <View style={styles.statusRow}>
            <View style={[styles.pulse, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>Network Active: T-Hub Hyderabad</Text>
          </View>
          <Text style={[styles.statusSubtext, { color: colors.subtext }]}>12 Volunteers Online • 3 AEDs nearby</Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>ACTIVE VOLUNTEERS</Text>
        {volunteers.map((v, i) => (
          <Animated.View 
            key={i} 
            entering={FadeInRight.delay(400 + (i * 100))}
            style={[styles.volunteerCard, { backgroundColor: colors.cardAlt }]}
          >
            <View style={styles.avatar}><MaterialIcons name="person" size={24} color={colors.primary} /></View>
            <View style={styles.volunteerInfo}>
              <Text style={[styles.volunteerName, { color: colors.text }]}>{v.name}</Text>
              <Text style={[styles.volunteerRole, { color: colors.subtext }]}>{v.role} • {v.distance}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: v.active ? '#22C55E20' : '#64748B20' }]}>
              <Text style={{ color: v.active ? '#22C55E' : '#64748B', fontSize: 10, fontWeight: 'bold' }}>{v.active ? "AVAILABLE" : "OFFLINE"}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>EMERGENCY INFRASTRUCTURE</Text>
        <View style={styles.resourceGrid}>
          <TouchableOpacity style={[styles.resourceCard, { backgroundColor: colors.cardAlt }]} onPress={() => setIsMapModalVisible(true)}>
            <MaterialIcons name="local-pharmacy" size={32} color="#EF4444" />
            <Text style={[styles.resourceLabel, { color: colors.text }]}>AED Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resourceCard, { backgroundColor: colors.cardAlt }]} onPress={() => setIsErModalVisible(true)}>
            <FontAwesome5 name="hospital-alt" size={28} color="#3B82F6" />
            <Text style={[styles.resourceLabel, { color: colors.text }]}>ER Load</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Pressable onPressIn={handleBroadcastPressIn} onPressOut={handleBroadcastPressOut} onPress={triggerBroadcast}>
        <Animated.View style={[styles.broadcastBtn, animatedButtonStyle]}>
          <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.broadcastGradient}>
            <MaterialIcons name="emergency-share" size={24} color="#FFF" />
            <Text style={styles.broadcastText}>TEST COMMUNITY BROADCAST</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>

      {/* --- AED RADAR MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={isMapModalVisible} onRequestClose={() => setIsMapModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sector Signals</Text>
              <TouchableOpacity onPress={() => setIsMapModalVisible(false)}><Ionicons name="close-circle" size={32} color={colors.subtext} /></TouchableOpacity>
            </View>
            
            <View style={styles.radarContainer}>
              <View style={styles.radarRing1} /><View style={styles.radarRing2} /><View style={styles.radarRing3} />
              <View style={styles.crosshairH} /><View style={styles.crosshairV} />
              
              <View style={styles.userDot}>
                <Animated.View style={[styles.sonarPulse, sonarStyle]} />
                <View style={styles.dotCore} />
              </View>

              {/* Dynamic Signals Mapping */}
              {COMMUNITY_SIGNALS.map((sig) => (
                <TouchableOpacity 
                  key={sig.id} 
                  style={[styles.signalHotspot, sig.uiPos]}
                  onPress={() => openDirections(sig.mapQuery)}
                >
                  <Animated.View 
                    style={[
                      styles.signalGlow, 
                      pinGlowStyle, 
                      { backgroundColor: sig.type === 'aed' ? '#EF4444' : sig.type === 'doctor' ? '#3B82F6' : '#22C55E' }
                    ]} 
                  />
                  <MaterialIcons 
                    name={sig.type === 'aed' ? "local-pharmacy" : "person-pin-circle"} 
                    size={32} 
                    color={sig.type === 'aed' ? '#EF4444' : sig.type === 'doctor' ? '#3B82F6' : '#22C55E'} 
                  />
                  <View style={[styles.signalTag, { backgroundColor: sig.type === 'aed' ? '#EF4444' : sig.type === 'doctor' ? '#3B82F6' : '#22C55E' }]}>
                    <Text style={styles.signalTagText}>{sig.name} ({sig.distance})</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setIsMapModalVisible(false)}>
              <Text style={styles.closeBtnText}>RETURN TO HUB</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- ER LOAD MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={isErModalVisible} onRequestClose={() => setIsErModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Emergency Triage</Text>
              <TouchableOpacity onPress={() => setIsErModalVisible(false)}><Ionicons name="close-circle" size={32} color={colors.subtext} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.erList}>
              <View style={styles.erItem}>
                <View style={styles.erItemHeader}><Text style={[styles.hospitalName, { color: colors.text }]}>Medicover HITEC City</Text><Text style={{ color: '#EF4444', fontWeight: 'bold' }}>85%</Text></View>
                <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '85%', backgroundColor: '#EF4444' }]} /></View>
              </View>
              <View style={styles.erItem}>
                <View style={styles.erItemHeader}><Text style={[styles.hospitalName, { color: colors.text }]}>AIG Hospitals</Text><Text style={{ color: '#22C55E', fontWeight: 'bold' }}>60%</Text></View>
                <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '60%', backgroundColor: '#22C55E' }]} /></View>
                <Text style={styles.recommendationText}>Recommended: Shortest wait time</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setIsErModalVisible(false)}>
              <Text style={styles.closeBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 14, marginTop: 4 },
  statusCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 32 },
  cardGradient: { padding: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 16, fontWeight: '700' },
  statusSubtext: { fontSize: 12, marginLeft: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 16 },
  volunteerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  volunteerInfo: { flex: 1 },
  volunteerName: { fontSize: 16, fontWeight: '700' },
  volunteerRole: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resourceGrid: { flexDirection: 'row', gap: 16 },
  resourceCard: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center', gap: 12 },
  resourceLabel: { fontSize: 13, fontWeight: '700' },
  broadcastBtn: { marginTop: 8, shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  broadcastGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 18, borderRadius: 16 },
  broadcastText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: height * 0.7 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  radarContainer: { width: '100%', height: 350, backgroundColor: '#0B0E14', borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  radarRing1: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)' },
  radarRing2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(59,130,246,0.1)' },
  radarRing3: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: 'rgba(59,130,246,0.05)' },
  crosshairH: { position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(59,130,246,0.05)' },
  crosshairV: { position: 'absolute', height: '100%', width: 1, backgroundColor: 'rgba(59,130,246,0.05)' },
  userDot: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', shadowColor: '#3B82F6', shadowRadius: 10, shadowOpacity: 1, elevation: 5 },
  sonarPulse: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#3B82F6' },
  signalHotspot: { position: 'absolute', alignItems: 'center' },
  signalGlow: { position: 'absolute', width: 60, height: 60, borderRadius: 30, top: -5 },
  signalTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  signalTagText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  closeBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  closeBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
  erList: { flex: 1 },
  erItem: { marginBottom: 24 },
  erItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  hospitalName: { fontSize: 16, fontWeight: '700' },
  progressBarBg: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  recommendationText: { fontSize: 11, color: '#22C55E', marginTop: 6, fontWeight: '600' }
});

export default CommunityScreen;
