import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';

type CameraPermissionViewProps = {
  canRequest: boolean;
  onRequest: () => void;
};

/** Shown until camera access is granted; falls back to system settings once denied. */
export function CameraPermissionView({ canRequest, onRequest }: CameraPermissionViewProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>
        Cần quyền truy cập camera để chụp ảnh với màu phim.
      </ThemedText>
      <Pressable
        onPress={canRequest ? onRequest : () => Linking.openSettings()}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          {canRequest ? 'Cho phép camera' : 'Mở cài đặt'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  text: {
    color: EditorColors.text,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: EditorColors.accent,
  },
  buttonText: {
    color: EditorColors.accentText,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
