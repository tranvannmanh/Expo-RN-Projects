import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Spacing } from '@/constants/theme';
import { EditorLayout, IconButton } from '@/features/photo-editor';

import { CAPTURE_MODES, PERF_TOOLS_ENABLED } from '../constants/camera.constants';
import { useCameraStore } from '../store/camera.store';

type CameraHeaderProps = {
  onClose: () => void;
  onModePress: () => void;
};

const MODE_FONT_SIZE = 30;

/** Close on the left; the shooting mode as a large letter on the right, like Sony. */
export function CameraHeader({ onClose, onModePress }: CameraHeaderProps) {
  const mode = useCameraStore((s) => s.mode);
  const togglePerfHud = useCameraStore((s) => s.togglePerfHud);
  const label = CAPTURE_MODES.find((m) => m.id === mode)?.label ?? '';

  return (
    <View style={styles.header}>
      <IconButton icon="close" onPress={onClose} />
      <Pressable
        hitSlop={Spacing.two}
        onPress={onModePress}
        onLongPress={PERF_TOOLS_ENABLED ? togglePerfHud : undefined}
        style={({ pressed }) => [styles.mode, pressed && styles.pressed]}>
        <ThemedText style={styles.modeText}>{label}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: EditorLayout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  mode: {
    paddingHorizontal: Spacing.two,
  },
  modeText: {
    color: EditorColors.text,
    fontSize: MODE_FONT_SIZE,
    lineHeight: MODE_FONT_SIZE + Spacing.one,
    fontWeight: '600',
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
