import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class HapticService {
  /**
   * General soft impact for button presses
   */
  async triggerImpact() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Ignore errors on non-supporting devices
    }
  }

  /**
   * Medium impact for primary actions like 'Save'
   */
  async triggerSuccess() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Heavy pattern for critical alarms
   */
  async triggerWarning() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Immediate error feedback
   */
  async triggerError() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      // Ignore
    }
  }
}

export default new HapticService();
