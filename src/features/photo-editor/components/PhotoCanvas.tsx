import { Canvas, Group, type SkImage, type SkSize } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { EditorColors } from '@/constants/theme';

import type { EditorSharedValues } from '../hooks/useEditorSharedValues';
import { usePreviewRender } from '../hooks/usePreviewRender';
import { useViewportGestures } from '../hooks/useViewportGestures';
import type { FilmPreset } from '../types/editor.types';
import { CropOverlay } from './CropOverlay';
import { PhotoRenderNode } from './PhotoRenderNode';

type PhotoCanvasProps = {
  image: SkImage;
  lut: SkImage;
  film: FilmPreset;
  hasUserCurve: boolean;
  cropMode: boolean;
  aspect: number | null;
  shared: EditorSharedValues;
  onCropCommit: () => void;
};

export function PhotoCanvas({
  image,
  lut,
  film,
  hasUserCurve,
  cropMode,
  aspect,
  shared,
  onCropCommit,
}: PhotoCanvasProps) {
  const canvasSize = useSharedValue<SkSize>({ width: 0, height: 0 });
  const { gesture, viewport } = useViewportGestures(shared.compare, !cropMode);
  const render = usePreviewRender({
    image,
    film,
    hasUserCurve,
    cropMode,
    canvasSize,
    shared,
    viewport,
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Canvas style={styles.canvas} onSize={canvasSize}>
          <Group transform={render.transform}>
            <PhotoRenderNode
              image={image}
              lut={lut}
              uniforms={render.uniforms}
              matrix={render.matrix}
              width={render.width}
              height={render.height}
            />
          </Group>
        </Canvas>
      </GestureDetector>
      {cropMode ? (
        <CropOverlay
          frameRect={render.frameRect}
          geometry={shared.geometry}
          aspect={aspect}
          onCommit={onCropCommit}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EditorColors.background,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
});
