import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class VoiceService {
  private lastAlertTime: number = 0;
  private readonly COOLDOWN = 60000; // 1 minute cooldown for the same message

  async speakAlert(text: string, force: boolean = false) {
    if (Platform.OS === 'web') return;

    const now = Date.now();
    if (!force && now - this.lastAlertTime < this.COOLDOWN) {
      return; // Prevent repeating the same alert too frequently
    }

    try {
      this.lastAlertTime = now;
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9, // Slightly slower for clinical clarity
      });
    } catch (error) {
      console.warn("VoiceService: Error playing speech", error);
    }
  }

  async stop() {
    if (Platform.OS === 'web') return;
    try {
      await Speech.stop();
    } catch (error) {
      // Ignore
    }
  }
}

export default new VoiceService();
