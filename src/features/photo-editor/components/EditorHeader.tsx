import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { EditorColors, Spacing } from '@/constants/theme';

import { EditorLayout } from '../constants/layout.constants';
import { useEditorSettingsStore } from '../store/editor-settings.store';
import { useEditorStore } from '../store/editor.store';
import { IconButton } from './IconButton';

type EditorHeaderProps = {
  compare: SharedValue<boolean>;
  onClose: () => void;
  onExport: () => void;
};

export function EditorHeader({ compare, onClose, onExport }: EditorHeaderProps) {
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const pasteRecipe = useEditorStore((s) => s.pasteRecipe);
  const lastRecipe = useEditorSettingsStore((s) => s.lastRecipe);

  return (
    <View style={styles.header}>
      <IconButton icon="close" onPress={onClose} />
      <View style={styles.center}>
        <IconButton icon="undo" disabled={!canUndo} onPress={undo} />
        <IconButton icon="redo" disabled={!canRedo} onPress={redo} />
        <IconButton
          icon="compare"
          onPressIn={() => compare.set(true)}
          onPressOut={() => compare.set(false)}
        />
        <IconButton
          icon="content_paste"
          disabled={!lastRecipe}
          onPress={() => lastRecipe && pasteRecipe(lastRecipe)}
        />
      </View>
      <IconButton icon="check" active onPress={onExport} />
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
    backgroundColor: EditorColors.background,
  },
  center: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
