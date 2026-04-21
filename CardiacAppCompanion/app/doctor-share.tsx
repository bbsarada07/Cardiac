import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCardiacData } from '../src/context/CardiacDataContext';
import { AppContext } from '../src/context/AppContext';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import hapticService from '../src/services/HapticService';

export default function DoctorShare() {
  const { history } = useCardiacData();
  const { liveData } = useContext(AppContext);
  const { colors } = useTheme();
  const router = useRouter();

  const todayLogs = useMemo(() => {
    // Filter history for today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    return history.filter(l => {
      const entryDate = new Date(l.timestamp).toISOString().split('T')[0];
      return entryDate === todayStr;
    }).slice(-20);
  }, [history]);

  const copyToWhatsApp = async () => {
    hapticService.triggerImpact();
    
    let message = `*CORASSIST SESSION LOG*\n`;
    message += `*Date:* ${new Date().toLocaleDateString()}\n`;
    message += `*Status:* ${liveData.ai_pattern}\n`;
    message += `--------------------------\n`;
    message += `*TIMESTAMP | HR | EVENT*\n`;
    
    todayLogs.forEach(entry => {
      const time = new Date(entry.timestamp).toISOString().split('T')[1].split('.')[0];
      const emoji = entry.alert_level === 'Critical' ? '🚨' : '✅';
      message += `${time} | ${entry.heart_rate}bpm | ${emoji} ${entry.alert_level}\n`;
    });

    message += `--------------------------\n`;
    message += `_Sent via CorAssist Clinical Platform_`;

    await Clipboard.setStringAsync(message);
    hapticService.triggerSuccess();
    Alert.alert("Copied to Clipboard", "The session log is ready to be pasted into WhatsApp.");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Doctor Share</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: colors.cardAlt }]}>
          <MaterialCommunityIcons name="whatsapp" size={24} color="#22C55E" />
          <Text style={[styles.infoTitle, { color: colors.text }]}>WhatsApp Export</Text>
          <Text style={[styles.infoSub, { color: colors.subtext }]}>
            Format today's session into a clean table for your healthcare provider.
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.colHeader, { color: colors.subtext, flex: 1.5 }]}>TIME</Text>
            <Text style={[styles.colHeader, { color: colors.subtext, flex: 1 }]}>BPM</Text>
            <Text style={[styles.colHeader, { color: colors.subtext, flex: 2 }]}>EVENT</Text>
          </View>
          
          {todayLogs.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No events recorded today.</Text>
          ) : (
            todayLogs.map((log, idx) => (
              <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cell, { color: colors.text, flex: 1.5 }]}>{new Date(log.timestamp).toISOString().split('T')[1].split('.')[0]}</Text>
                <Text style={[styles.cell, { color: colors.text, flex: 1 }]}>{log.heart_rate}</Text>
                <Text style={[styles.cell, { color: log.alert_level === 'Critical' ? '#EF4444' : colors.subtext, flex: 2, fontWeight: log.alert_level === 'Critical' ? 'bold' : 'normal' }]}>
                  {log.alert_level}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity 
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
          onPress={copyToWhatsApp}
        >
          <MaterialIcons name="content-copy" size={20} color="#FFF" />
          <Text style={styles.shareBtnText}>COPY FOR WHATSAPP</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    padding: 20,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  table: {
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  cell: {
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  shareBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
