import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import { EditorLayout, IconButton, getFilmPreset } from '@/features/photo-editor';

import { FLASH_ICONS } from '../constants/camera.constants';
import { useCameraStore } from '../store/camera.store';

type CameraHeaderProps = {
  hasFlash: boolean;
  onClose: () => void;
};

export function CameraHeader({ hasFlash, onClose }: CameraHeaderProps) {
  const flashMode = useCameraStore((s) => s.flashMode);
  const cycleFlash = useCameraStore((s) => s.cycleFlash);
  const filmName = useCameraStore((s) => getFilmPreset(s.filmId).name);

  return (
    <View style={styles.header}>
      <IconButton icon="close" onPress={onClose} />
      <ThemedText type="smallBold" style={styles.title}>
        {filmName}
      </ThemedText>
      <IconButton
        icon={FLASH_ICONS[flashMode]}
        disabled={!hasFlash}
        active={hasFlash && flashMode !== 'off'}
        onPress={cycleFlash}
      />
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
  title: {
    color: EditorColors.text,
  },
});
