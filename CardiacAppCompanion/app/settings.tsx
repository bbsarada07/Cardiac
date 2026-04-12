import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { AppContext } from '../src/context/AppContext';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';

export default function SettingsScreen() {
  const { ipAddress, setIpAddress, isDemoMode, setIsDemoMode } = useContext(AppContext);
  const router = useRouter();

  const [localIp, setLocalIp] = useState(ipAddress);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  
  const saveIp = () => {
    setIpAddress(localIp);
    alert('Server IP Updated');
  };

  const shareLiveStatus = async () => {
    const code = Math.floor(100000 + Math.random() * 900000);
    // Simulating Caregiver Mode connection config
    try {
      await Sharing.shareAsync(`https://cardiac-monitor.app/caregiver?session=${code}`, {
        dialogTitle: 'Share Live Status Code'
      });
    } catch (e) {
      alert(`Your session code is: ${code}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connection</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Demo Mode</Text>
          <Switch value={isDemoMode} onValueChange={setIsDemoMode} />
        </View>

        {!isDemoMode && (
          <View style={styles.inputRow}>
            <Text style={styles.label}>Desktop IP Address:</Text>
            <View style={{flexDirection: 'row', marginTop: 8}}>
              <TextInput 
                style={styles.input} 
                value={localIp} 
                onChangeText={setLocalIp}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.btnSm} onPress={saveIp}>
                <Text style={styles.btnSmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Caregiver Mode (Feature 7)</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={shareLiveStatus}>
          <Text style={styles.primaryBtnText}>Share Live Status Link</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accessibility (Feature 12)</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Large Text Mode (+40%)</Text>
          <Switch value={largeText} onValueChange={setLargeText} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>High Contrast Alerts</Text>
          <Switch value={highContrast} onValueChange={setHighContrast} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 24, marginTop: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:6 },
  cardTitle: { color: '#3B82F6', fontSize: 16, fontWeight: '700', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { color: '#334155', fontSize: 16, fontWeight: '500' },
  inputRow: { marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#F1F5F9', color: '#1E293B', padding: 14, borderRadius: 12, marginRight: 12, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  btnSm: { backgroundColor: '#3B82F6', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 12 },
  btnSmText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  primaryBtn: { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 4, shadowColor: '#8B5CF6', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8 },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});
