import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, StyleSheet, Platform, Alert, KeyboardTypeOptions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppContext } from '../../src/context/AppContext';
import { useCardiacData } from '../../src/context/CardiacDataContext';
import { useTheme } from '../../src/context/ThemeContext';
import hapticService from '../../src/services/HapticService';
import * as Clipboard from 'expo-clipboard';


export default function SettingsScreen() {
  const { isDemoMode, setDemoMode, liveState, patientProfile, updatePatientProfile, saveProfileToDisk } = useCardiacData();
  const { theme, setTheme, colors } = useTheme();
  
  const { 
    userPin, lockEnabled, saveSecuritySettings, setIpAddress,
    systemLanguage, setSystemLanguage, liveData
  } = React.useContext(AppContext);


  const [pinInput, setPinInput] = useState(userPin);
  const [exerciseMode, setExerciseMode] = useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>System Settings</Text>

      {/* Patient Profile Module */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>PATIENT PROFILE</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <InputField label="Patient Name" value={patientProfile?.name || ""} onChangeText={t => updatePatientProfile({ name: t })} />
          <InputField label="Age" value={patientProfile?.age || ""} onChangeText={t => updatePatientProfile({ age: t })} />
          <InputField label="Sex" value={patientProfile?.sex || ""} onChangeText={t => updatePatientProfile({ sex: t })} />
          <InputField label="Blood Type" value={patientProfile?.blood_type || ""} onChangeText={t => updatePatientProfile({ blood_type: t })} />
          <InputField label="Known Conditions" value={patientProfile?.conditions || ""} onChangeText={t => updatePatientProfile({ conditions: t })} isLast />
        </View>
      </View>

      {/* Emergency Contacts Module */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>EMERGENCY PROTOCOL (SOS)</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <InputField label="Contact 1 Name" value={patientProfile?.contact1_name || ""} onChangeText={t => updatePatientProfile({ contact1_name: t })} />
          <InputField label="Contact 1 Phone" value={patientProfile?.contact1_phone || ""} onChangeText={t => updatePatientProfile({ contact1_phone: t })} keyboardType="phone-pad" />
          <InputField label="Contact 2 Name" value={patientProfile?.contact2_name || ""} onChangeText={t => updatePatientProfile({ contact2_name: t })} />
          <InputField label="Contact 2 Phone" value={patientProfile?.contact2_phone || ""} onChangeText={t => updatePatientProfile({ contact2_phone: t })} keyboardType="phone-pad" />
          <InputField label="Contact 3 Name" value={patientProfile?.contact3_name || ""} onChangeText={t => updatePatientProfile({ contact3_name: t })} />
          <InputField label="Contact 3 Phone" value={patientProfile?.contact3_phone || ""} onChangeText={t => updatePatientProfile({ contact3_phone: t })} keyboardType="phone-pad" />
          <InputField label="Alert Threshold (%)" value="75" isLast />
        </View>
      </View>

      {/* NEW: Caregiver Mirroring Module */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>CAREGIVER MIRRORING</Text>
        <View style={[styles.card, { backgroundColor: colors.card, padding: 16 }]}>
          <Text style={{ color: colors.text, fontSize: 14, marginBottom: 8, fontWeight: '500' }}>
            Allow a remote caregiver to monitor your vitals in real-time.
          </Text>
          <TouchableOpacity 
            style={{ 
              backgroundColor: colors.cardAlt, 
              padding: 12, 
              borderRadius: 8, 
              flexDirection: 'row', 
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.primary
            }}
            onPress={async () => {
              const session = liveData.caregiver_session || "care-9941";
              const link = `https://corassist-monitor.io/mirror/${session}`;
              await Clipboard.setStringAsync(link);
              hapticService.triggerImpact();
              Alert.alert("Link Generated", "Caregiver mirror link copied to your clipboard. Send it via WhatsApp or Email.");
            }}
          >
            <MaterialIcons name="share" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>SHARE LIVE MONITOR LINK</Text>
          </TouchableOpacity>
        </View>
      </View>


      <TouchableOpacity 
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={async () => {
          const success = await saveProfileToDisk();
          if (success) {
            // Update WebSocket IP immediately for graceful reconnect
            if (patientProfile?.monitorIp) {
              setIpAddress(patientProfile.monitorIp);
            }
            Alert.alert("Profile Saved", "Patient identity and monitor settings have been updated.");
          } else {
            Alert.alert("Save Failed", "Could not persist profile changes.");
          }
        }}
      >
        <MaterialIcons name="save" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.saveButtonText}>SAVE PROFILE</Text>
      </TouchableOpacity>

      {/* App Configuration */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>BEHAVIOUR & NETWORK</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ToggleField 
            label="Developer/Demo Mode" 
            sub="Simulates a 60s cardiac event for hackathon/testing"
            value={isDemoMode} 
            onValueChange={setDemoMode} 
            icon="bug-report"
          />
          <ToggleField 
            label="Dark Theme" 
            sub="Enforce low-light medical contrast UI"
            value={theme === 'dark'} 
            onValueChange={(val: boolean) => setTheme(val ? 'dark' : 'light')} 
            icon="dark-mode"
          />
          <InputField 
            label="Monitor IP Address"
            value={patientProfile?.monitorIp || ""}
            onChangeText={t => updatePatientProfile({ monitorIp: t })}
            placeholder="192.168.1.X"
            isLast
          />
          <View style={[styles.borderBottom, { borderBottomColor: colors.border, paddingVertical: 14, paddingHorizontal: 16 }]}>
            <Text style={[styles.toggleLabel, { color: colors.text, marginBottom: 12 }]}>Assistive Voice Language</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['en', 'te', 'hi'].map((lang) => (
                <TouchableOpacity 
                  key={lang}
                  onPress={() => {
                    setSystemLanguage(lang);
                    hapticService.triggerImpact();
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: systemLanguage === lang ? colors.primary : colors.cardAlt,
                    borderWidth: 1,
                    borderColor: systemLanguage === lang ? colors.primary : colors.border
                  }}
                >
                  <Text style={{ color: systemLanguage === lang ? '#FFF' : colors.text, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {lang === 'en' ? 'English' : (lang === 'te' ? 'తెలుగు' : 'हिंदी')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>


      {/* Security Module (Feature 12) */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>SECURITY & PRIVACY</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ToggleField 
            label="PIN Lock Screen" 
            sub="Lock app when in background"
            value={lockEnabled} 
            onValueChange={(val: boolean) => {
              saveSecuritySettings(pinInput, val);
              hapticService.triggerImpact();
            }} 
            icon="security"
          />
          {lockEnabled && (
            <InputField 
              label="Access PIN" 
              value={pinInput} 
              onChangeText={(t) => {
                if (t.length <= 4) {
                  setPinInput(t);
                  if (t.length === 4) saveSecuritySettings(t, lockEnabled);
                }
              }}
              keyboardType="numeric"
              isLast
            />
          )}
        </View>
      </View>

      {/* Connectivity Data */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>NETWORK STATUS</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: isDemoMode ? '#EAB308' : '#22C55E' }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {isDemoMode ? "Disconnected (Running Local Sim)" : "Connected to Firebase Realtime DB"}
            </Text>
          </View>
          <Text style={styles.databaseUrl}>database: https://cardiacmonitor-fee48-default-rtdb.firebaseio.com</Text>
        </View>
      </View>

      <View style={{height: 100}} />
    </ScrollView>
  );
}

// ----------------- Helper Components -----------------

function InputField({ label, value, onChangeText, keyboardType = 'default', placeholder, isLast = false }: { 
  label: string, 
  value: string, 
  onChangeText?: (text: string) => void, 
  keyboardType?: KeyboardTypeOptions,
  placeholder?: string,
  isLast?: boolean 
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.inputRow, !isLast && styles.borderBottom, !isLast && { borderBottomColor: colors.border }]}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <TextInput 
        style={[styles.textInput, { color: colors.subtext, opacity: onChangeText ? 1 : 0.6 }]} 
        value={value} 
        onChangeText={onChangeText}
        editable={!!onChangeText}
        placeholder={placeholder || "Not Set"}
        placeholderTextColor={colors.subtext}
        keyboardType={keyboardType}
        returnKeyType="done"
      />
    </View>
  );
}

function ToggleField({ label, sub, value, onValueChange, icon, isLast = false }: any) {
  const { colors } = useTheme();
  return (
    <View style={[styles.toggleRow, !isLast && styles.borderBottom, !isLast && { borderBottomColor: colors.border }]}>
      <View style={styles.toggleTextContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <MaterialIcons name={icon} size={20} color={colors.subtext} style={{marginRight: 8}} />
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
        </View>
        <Text style={[styles.toggleSub, { color: colors.subtext }]}>{sub}</Text>
      </View>
      <Switch 
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (value ? '#F8FAFC' : colors.subtext)}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    padding: 16,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1E1E2D',
    borderRadius: 12,
    overflow: 'hidden',
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inputLabel: {
    color: '#E2E8F0',
    fontSize: 16,
    flex: 1,
  },
  textInput: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleSub: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  databaseUrl: {
    color: '#6B7280',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontFamily: 'monospace',
  }
});
