import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ThemeType } from '../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [selected, setSelected] = React.useState<ThemeType | null>(null);
  const { theme, setTheme, confirmTheme, colors } = useTheme();

  const handleSelect = (t: ThemeType) => {
    setSelected(t);
    setTheme(t);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 3000 }]}>
      <SafeAreaView style={styles.container}>
        <Animated.View 
          entering={FadeIn.delay(200)} 
          style={styles.content}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <MaterialIcons name="security" size={64} color={colors.primary} />
          </View>
          
          <Animated.Text 
            entering={FadeInDown.delay(400)}
            style={[styles.title, { color: colors.text }]}
          >
            Welcome to CorAssist{"\n"}Clinical Platform
          </Animated.Text>
          
          <Animated.Text 
            entering={FadeInDown.delay(600)}
            style={[styles.subtitle, { color: colors.subtext }]}
          >
            Please select your interface preference to begin monitoring.
          </Animated.Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(800)}
          style={styles.selectorContainer}
        >
          <View style={styles.buttonRow}>
            {/* Dark Mode Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => handleSelect('dark')}
              style={[
                styles.themeButton, 
                { 
                  backgroundColor: theme === 'dark' ? colors.primary : colors.card,
                  borderColor: theme === 'dark' ? colors.primary : colors.border,
                  borderWidth: 2
                }
              ]}
            >
              <MaterialIcons 
                name="nights-stay" 
                size={34} 
                color={theme === 'dark' ? '#FFF' : colors.subtext} 
              />
              <Text style={[
                styles.buttonLabel, 
                { color: theme === 'dark' ? '#FFF' : colors.text }
              ]}>
                Dark Mode
              </Text>
              <Text style={[
                styles.buttonSublabel, 
                { color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : colors.subtext }
              ]}>
                Clinical
              </Text>
            </TouchableOpacity>

            {/* Light Mode Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => handleSelect('light')}
              style={[
                styles.themeButton, 
                { 
                  backgroundColor: theme === 'light' ? colors.primary : colors.card,
                  borderColor: theme === 'light' ? colors.primary : colors.border,
                  borderWidth: 2
                }
              ]}
            >
              <MaterialIcons 
                name="wb-sunny" 
                size={34} 
                color={theme === 'light' ? '#FFF' : colors.subtext} 
              />
              <Text style={[
                styles.buttonLabel, 
                { color: theme === 'light' ? '#FFF' : colors.text }
              ]}>
                Light Mode
              </Text>
              <Text style={[
                styles.buttonSublabel, 
                { color: theme === 'light' ? 'rgba(255,255,255,0.7)' : colors.subtext }
              ]}>
                Daylight
              </Text>
            </TouchableOpacity>
          </View>

          {selected && (
            <Animated.View entering={FadeInDown} style={styles.confirmContainer}>
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={confirmTheme}
              >
                <Text style={styles.confirmText}>INITIALIZE PLATFORM</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View 
          entering={FadeIn.delay(1000)}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: colors.subtext }]}>
            You can change this anytime in Settings
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  selectorContainer: {
    marginBottom: 60,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  themeButton: {
    flex: 1,
    height: 160,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 4,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  buttonSublabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  confirmContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  confirmButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
