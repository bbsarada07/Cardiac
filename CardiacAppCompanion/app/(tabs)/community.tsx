import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const CommunityScreen = () => {
  const { colors } = useTheme();

  const volunteers = [
    { name: "Dr. Aruna S.", distance: "200m", role: "Physician", active: true },
    { name: "Rahul M.", distance: "450m", role: "First Responder", active: true },
    { name: "Sita K.", distance: "600m", role: "Nurse", active: false },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Community SOS</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Nearby volunteers and emergency resources</Text>
      </Animated.View>

      {/* Network Status Card */}
      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient
          colors={[colors.primary + '20', 'transparent']}
          style={styles.cardGradient}
        >
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
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.volunteerInfo}>
              <Text style={[styles.volunteerName, { color: colors.text }]}>{v.name}</Text>
              <Text style={[styles.volunteerRole, { color: colors.subtext }]}>{v.role} • {v.distance}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: v.active ? '#22C55E20' : '#64748B20' }]}>
              <Text style={{ color: v.active ? '#22C55E' : '#64748B', fontSize: 10, fontWeight: 'bold' }}>
                {v.active ? "AVAILABLE" : "OFFLINE"}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>EMERGENCY INFRASTRUCTURE</Text>
        <View style={styles.resourceGrid}>
          <TouchableOpacity style={[styles.resourceCard, { backgroundColor: colors.cardAlt }]}>
            <MaterialIcons name="local-pharmacy" size={32} color="#EF4444" />
            <Text style={[styles.resourceLabel, { color: colors.text }]}>AED Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resourceCard, { backgroundColor: colors.cardAlt }]}>
            <FontAwesome5 name="hospital-alt" size={28} color="#3B82F6" />
            <Text style={[styles.resourceLabel, { color: colors.text }]}>ER Load</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.broadcastBtn}>
        <LinearGradient
          colors={['#EF4444', '#B91C1C']}
          style={styles.broadcastGradient}
        >
          <MaterialIcons name="emergency-share" size={24} color="#FFF" />
          <Text style={styles.broadcastText}>TEST COMMUNITY BROADCAST</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 32,
  },
  cardGradient: {
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 12,
    marginLeft: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  volunteerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  volunteerRole: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resourceGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  resourceCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  resourceLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  broadcastBtn: {
    marginTop: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  broadcastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
  },
  broadcastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default CommunityScreen;
