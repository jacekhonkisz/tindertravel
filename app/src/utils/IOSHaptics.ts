import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export class IOSHaptics {
  // iOS-specific haptic patterns
  static async cardSwipeStart() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  static async cardSwipeThreshold() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  static async cardSwipeComplete() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  static async likeAction() {
    if (Platform.OS !== 'ios') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  static async superlikeAction() {
    if (Platform.OS !== 'ios') return;
    // Double tap pattern for super like
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 100);
  }

  static async dismissAction() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  static async buttonPress() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  static async navigationTransition() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  static async errorFeedback() {
    if (Platform.OS !== 'ios') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  static async warningFeedback() {
    if (Platform.OS !== 'ios') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  static async selectionChanged() {
    if (Platform.OS !== 'ios') return;
    await Haptics.selectionAsync();
  }

  // Complex haptic sequences for iOS
  static async cardStackShuffle() {
    if (Platform.OS !== 'ios') return;
    
    // Simulate card stack shuffling
    for (let i = 0; i < 3; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  static async pullToRefresh() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  static async longPressStart() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  static async contextMenuOpen() {
    if (Platform.OS !== 'ios') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

export default IOSHaptics; 