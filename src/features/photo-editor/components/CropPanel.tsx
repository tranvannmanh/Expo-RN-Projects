import { ScrollView, StyleSheet, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

import { ASPECT_RATIOS, STRAIGHTEN_LIMIT } from '../constants/editor.constants';
import type { useCropActions } from '../hooks/useCropActions';
import type { Geometry } from '../types/editor.types';
import { ChipButton } from './ChipButton';
import { IconButton } from './IconButton';
import { ValueSlider } from './ValueSlider';

type CropPanelProps = {
  geometry: SharedValue<Geometry>;
  actions: ReturnType<typeof useCropActions>;
};

export function CropPanel({ geometry, actions }: CropPanelProps) {
  const straighten = useDerivedValue(() => geometry.get().straighten);

  const onStraighten = (value: number) => {
    'worklet';
    geometry.set({ ...geometry.get(), straighten: value });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        style={styles.aspectScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.aspects}>
        {ASPECT_RATIOS.map((option) => (
          <ChipButton
            key={option.id}
            label={option.label}
            selected={option.id === actions.aspectId}
            onPress={() => actions.selectAspect(option)}
          />
        ))}
      </ScrollView>
      <View style={styles.slider}>
        <ValueSlider
          label="Xoay chỉnh thẳng (°)"
          min={-STRAIGHTEN_LIMIT}
          max={STRAIGHTEN_LIMIT}
          step={0.1}
          decimals={1}
          defaultValue={0}
          value={straighten}
          onChange={onStraighten}
          onCommit={actions.commitLive}
        />
      </View>
      <View style={styles.buttons}>
        <IconButton icon="rotate_90_degrees_cw" label="Xoay 90°" onPress={actions.rotate} />
        <IconButton icon="flip" label="Lật ngang" onPress={actions.flipHorizontal} />
        <IconButton icon="swap_vert" label="Lật dọc" onPress={actions.flipVertical} />
        <IconButton icon="restart_alt" label="Đặt lại" onPress={actions.reset} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  aspectScroll: {
    flexGrow: 0,
  },
  aspects: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  slider: {
    paddingHorizontal: Spacing.four,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
