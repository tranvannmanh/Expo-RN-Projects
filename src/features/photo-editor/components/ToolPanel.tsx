import type { SkImage } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { EditorColors } from '@/constants/theme';

import { EditorLayout } from '../constants/layout.constants';
import type { useCropActions } from '../hooks/useCropActions';
import type { EditorSharedValues } from '../hooks/useEditorSharedValues';
import type { EditorTool } from '../types/editor.types';
import { AdjustPanel } from './AdjustPanel';
import { CropPanel } from './CropPanel';
import { CurveEditor } from './CurveEditor';
import { FilmPanel } from './FilmPanel';

type ToolPanelProps = {
  tool: EditorTool;
  thumb: SkImage;
  shared: EditorSharedValues;
  cropActions: ReturnType<typeof useCropActions>;
};

export function ToolPanel({ tool, thumb, shared, cropActions }: ToolPanelProps) {
  return (
    <View style={styles.panel}>
      {tool === 'film' ? <FilmPanel thumb={thumb} adjustments={shared.adjustments} /> : null}
      {tool === 'adjust' ? <AdjustPanel adjustments={shared.adjustments} /> : null}
      {tool === 'curve' ? <CurveEditor /> : null}
      {tool === 'crop' ? <CropPanel geometry={shared.geometry} actions={cropActions} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: EditorLayout.panelHeight,
    backgroundColor: EditorColors.background,
  },
});
