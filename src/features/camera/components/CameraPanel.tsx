import type { SkImage } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import { IconButton } from '@/features/photo-editor';

import { CameraLayout } from '../constants/camera.constants';
import type { CameraPanel as Panel, CaptureMode, ExposureSettings } from '../types/camera.types';
import type { FnItem } from '../types/fn.types';
import { CameraFilmPicker } from './CameraFilmPicker';
import { CameraModeBar } from './CameraModeBar';
import { ExposureValuePicker } from './ExposureValuePicker';
import { FnGrid } from './FnGrid';

type CameraPanelProps = {
  panel: Panel;
  onPanel: (panel: Panel) => void;
  fnItems: FnItem[];
  sample: SkImage | null;
  mode: CaptureMode;
  canManual: boolean;
  canBias: boolean;
  onMode: (mode: CaptureMode) => void;
  exposure: ExposureSettings;
  options: Record<'iso' | 'shutter' | 'ev', number[]>;
  onExposure: (patch: Partial<ExposureSettings>) => void;
};

const TITLES: Partial<Record<Panel, string>> = {
  fn: 'Fn',
  mode: 'Chế độ chụp',
  filmPicker: 'Màu phim',
};

/**
 * Area under the viewfinder: presets by default; the Fn grid when Fn is
 * pressed; a picker when a Fn tile is opened (✕ goes back one level).
 */
export function CameraPanel(props: CameraPanelProps) {
  const { panel, onPanel } = props;
  const isRoot = panel === 'film';
  const close = () => onPanel(panel === 'fn' ? 'film' : 'fn');

  const renderBody = () => {
    switch (panel) {
      case 'film':
      case 'filmPicker':
        return <CameraFilmPicker sample={props.sample} />;
      case 'fn':
        return <FnGrid items={props.fnItems} />;
      case 'mode':
        return (
          <CameraModeBar
            mode={props.mode}
            canManual={props.canManual}
            canBias={props.canBias}
            onChange={props.onMode}
          />
        );
      default:
        return (
          <ExposureValuePicker
            param={panel}
            values={props.options[panel]}
            value={props.exposure[panel]}
            onChange={(value) => props.onExposure({ [panel]: value })}
          />
        );
    }
  };

  return (
    <View style={styles.panel}>
      {isRoot ? null : (
        <View style={styles.header}>
          <IconButton icon="close" onPress={close} />
          <ThemedText type="smallBold" style={styles.title}>
            {TITLES[panel] ?? ''}
          </ThemedText>
        </View>
      )}
      <View style={styles.body}>{renderBody()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: CameraLayout.panelHeight,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: EditorColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  title: {
    color: EditorColors.textMuted,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
});
