import * as Haptics from 'expo-haptics';

export async function hapticCorrect() {
	await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function hapticWrong() {
	await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function hapticTimeout() {
	await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
