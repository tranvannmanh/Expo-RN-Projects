import { StyleSheet, View } from 'react-native';

import { EditorColors } from '@/constants/theme';

import { EDITOR_TOOLS } from '../constants/editor.constants';
import { EditorLayout } from '../constants/layout.constants';
import { useEditorStore } from '../store/editor.store';
import { IconButton } from './IconButton';

export function EditorToolbar() {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);

  return (
    <View style={styles.toolbar}>
      {EDITOR_TOOLS.map((t) => (
        <IconButton
          key={t.id}
          icon={t.icon}
          label={t.label}
          active={t.id === tool}
          onPress={() => setTool(t.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    height: EditorLayout.toolbarHeight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: EditorColors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: EditorColors.border,
  },
});
