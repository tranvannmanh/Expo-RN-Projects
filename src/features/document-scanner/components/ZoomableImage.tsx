import { Image } from 'expo-image';
import { type Ref, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { ZOOM } from '../constants';
import { usePinchZoom } from '../hooks/usePinchZoom';

export type ZoomableImageHandle = {
  zoomBy: (factor: number) => void;
  reset: () => void;
};

type ZoomableImageProps = {
  uri: string;
  accessibilityLabel: string;
  onScaleChange: (scale: number) => void;
  ref?: Ref<ZoomableImageHandle>;
};

export function ZoomableImage({ uri, accessibilityLabel, onScaleChange, ref }: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleScaleChange = (scale: number) => {
    setIsZoomed(scale > ZOOM.min);
    onScaleChange(scale);
  };

  const { gesture, animatedStyle, onLayout, setContentAspect, zoomBy, reset } = usePinchZoom({
    panEnabled: isZoomed,
    onScaleChange: handleScaleChange,
  });

  useImperativeHandle(ref, () => ({ zoomBy, reset }), [zoomBy, reset]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container} onLayout={onLayout} collapsable={false}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <Image
            source={{ uri }}
            style={styles.container}
            contentFit="contain"
            onLoad={({ source }) => setContentAspect(source.width / source.height)}
            accessibilityLabel={accessibilityLabel}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
