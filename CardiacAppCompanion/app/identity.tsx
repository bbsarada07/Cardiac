import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCardiacData } from '../src/context/CardiacDataContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import hapticService from '../src/services/HapticService';

export default function IdentityScreen() {
  const { patientProfile, updatePatientProfile, saveProfileToDisk } = useCardiacData();
  const { colors } = useTheme();
  const router = useRouter();

  const [form, setForm] = useState(patientProfile);

  const handleSave = async () => {
    hapticService.triggerImpact();
    updatePatientProfile(form);
    const success = await saveProfileToDisk();
    if (success) {
      hapticService.triggerSuccess();
      Alert.alert("Profile Updated", "Medical records have been successfully synchronized.");
      router.back();
    } else {
      hapticService.triggerError();
      Alert.alert("Sync Failed", "Could not reach clinical server.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Patient Record</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>BIOMETRICS</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <FormInput 
                label="Full Name" 
                value={form.name} 
                onChangeText={(t: string) => setForm({...form, name: t})} 
                icon="person" 
              />
              <View style={styles.row}>
                <FormInput 
                  label="Age" 
                  value={form.age} 
                  onChangeText={(t: string) => setForm({...form, age: t})} 
                  icon="event" 
                  style={{ flex: 1 }}
                  keyboardType="numeric"
                />
                <FormInput 
                  label="Sex" 
                  value={form.sex} 
                  onChangeText={(t: string) => setForm({...form, sex: t})} 
                  icon="wc" 
                  style={{ flex: 1 }}
                  isLast
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>CLINICAL DATA</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <FormInput 
                label="Blood Type" 
                value={form.blood_type} 
                onChangeText={(t: string) => setForm({...form, blood_type: t})} 
                icon="opacity" 
              />
              <FormInput 
                label="Medical Conditions" 
                value={form.conditions} 
                onChangeText={(t: string) => setForm({...form, conditions: t})} 
                icon="assignment" 
                multiline
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>EMERGENCY PROTOCOL</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <FormInput 
                label="Next of Kin" 
                value={form.contact1_name} 
                onChangeText={(t: string) => setForm({...form, contact1_name: t})} 
                icon="family-restroom" 
              />
              <FormInput 
                label="Contact Number" 
                value={form.contact1_phone} 
                onChangeText={(t: string) => setForm({...form, contact1_phone: t})} 
                icon="phone" 
                keyboardType="phone-pad"
                isLast
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>SYNCHRONIZE RECORD</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: any; // MaterialIcons name
  style?: object;
  keyboardType?: any;
  isLast?: boolean;
  multiline?: boolean;
}

function FormInput({ label, value, onChangeText, icon, style, keyboardType, isLast, multiline }: FormInputProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.inputWrapper, style, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={styles.labelRow}>
        <MaterialIcons name={icon} size={16} color={colors.subtext} />
        <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
      </View>
      <TextInput
        style={[styles.input, { color: colors.text }, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.border}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  inputWrapper: {
    padding: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  saveBtn: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
