import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';

import {
  EXPORT_QUALITY_OPTIONS,
  EXPORT_SIZE_LABELS,
} from '../constants/editor.constants';
import { EditorLayout } from '../constants/layout.constants';
import { useExportPhoto } from '../hooks/useExportPhoto';
import type { ExportInput, ExportResult } from '../lib/export-photo';
import { useEditorSettingsStore } from '../store/editor-settings.store';
import { useEditorStore } from '../store/editor.store';
import type { ExportSize } from '../types/editor.types';
import { ChipButton } from './ChipButton';

type ExportSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Receives the kept JPEG after saving (e.g. to add it to the album). */
  onSaved?: (result: ExportResult, input: ExportInput) => Promise<unknown>;
};

const SIZES = Object.keys(EXPORT_SIZE_LABELS) as ExportSize[];

export function ExportSheet({ visible, onClose, onSaved }: ExportSheetProps) {
  const photo = useEditorStore((s) => s.photo);
  const recipe = useEditorStore((s) => s.recipe);
  const settings = useEditorSettingsStore((s) => s.exportSettings);
  const setSettings = useEditorSettingsStore((s) => s.setExportSettings);
  const exporter = useExportPhoto(onSaved);

  const onSave = () => {
    if (photo) exporter.mutate({ photo, recipe, settings });
  };

  const close = () => {
    if (exporter.isPending) return;
    exporter.reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      {/* Bottom inset keeps the save button above the system navigation bar. */}
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <ThemedText type="smallBold" style={styles.title}>
          Lưu ảnh
        </ThemedText>

        <ThemedText type="small" style={styles.caption}>
          Kích thước
        </ThemedText>
        <View style={styles.row}>
          {SIZES.map((size) => (
            <ChipButton
              key={size}
              label={EXPORT_SIZE_LABELS[size]}
              selected={settings.size === size}
              onPress={() => setSettings({ size })}
            />
          ))}
        </View>

        <ThemedText type="small" style={styles.caption}>
          Chất lượng JPEG
        </ThemedText>
        <View style={styles.row}>
          {EXPORT_QUALITY_OPTIONS.map((quality) => (
            <ChipButton
              key={quality}
              label={`${quality}`}
              selected={settings.quality === quality}
              onPress={() => setSettings({ quality })}
            />
          ))}
        </View>

        {exporter.isSuccess ? (
          <ThemedText type="small" style={styles.success}>
            Đã lưu vào thư viện ảnh
          </ThemedText>
        ) : null}
        {exporter.error ? (
          <ThemedText type="small" style={styles.error}>
            {exporter.error.message}
          </ThemedText>
        ) : null}

        <Pressable
          disabled={exporter.isPending}
          onPress={onSave}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          {exporter.isPending ? (
            <ActivityIndicator color={EditorColors.accentText} />
          ) : (
            <ThemedText type="smallBold" style={styles.buttonText}>
              Lưu vào thư viện
            </ThemedText>
          )}
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: EditorColors.overlay,
  },
  sheet: {
    backgroundColor: EditorColors.surface,
    padding: Spacing.four,
    gap: Spacing.three,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
  },
  title: {
    color: EditorColors.text,
  },
  caption: {
    color: EditorColors.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  success: {
    color: EditorColors.accent,
  },
  error: {
    color: EditorColors.danger,
  },
  button: {
    height: EditorLayout.primaryButtonHeight,
    borderRadius: Radius.medium,
    backgroundColor: EditorColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
  buttonText: {
    color: EditorColors.accentText,
  },
});
