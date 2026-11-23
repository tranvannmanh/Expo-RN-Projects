import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';
import { EditorLayout, type AndroidIcon } from '@/features/photo-editor';

import { KELVIN_STOPS, WHITE_BALANCE_OPTIONS } from '../constants/camera.constants';
import { nearest } from '../lib/exposure';
import { formatShift } from '../lib/white-balance';
import { useCameraStore } from '../store/camera.store';
import { StopDial } from './StopDial';

type WhiteBalancePickerProps = {
  /** Fixed colour temperature is available on this lens. */
  canKelvin: boolean;
  /** Opens the A–B / G–M fine-shift panel. */
  onAdjust: () => void;
};

type TileProps = {
  icon: AndroidIcon;
  label: string;
  selected: boolean;
  onPress: () => void;
};

function Tile({ icon, label, selected, onPress }: TileProps) {
  const color = selected ? EditorColors.accentText : EditorColors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.tile, selected && styles.tileSelected, pressed && styles.pressed]}>
      <SymbolView name={{ android: icon, ios: 'circle' }} size={EditorLayout.iconSize} tintColor={color} />
      <ThemedText type="small" numberOfLines={1} style={selected ? styles.labelSelected : styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Xperia-style white balance: sensor presets as tiles, a Kelvin dial for the
 * colour-temperature preset, and a tile opening the A–B / G–M fine shift.
 */
export function WhiteBalancePicker({ canKelvin, onAdjust }: WhiteBalancePickerProps) {
  const wb = useCameraStore((s) => s.whiteBalance);
  const setWhiteBalance = useCameraStore((s) => s.setWhiteBalance);
  const options = WHITE_BALANCE_OPTIONS.filter((o) => o.id !== 'kelvin' || canKelvin);
  const shifted = wb.ab !== 0 || wb.gm !== 0;
  const kelvinIndex = KELVIN_STOPS.indexOf(nearest(KELVIN_STOPS, wb.kelvin));

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((o) => (
          <Tile
            key={o.id}
            icon={o.icon}
            label={o.id === 'kelvin' ? `${wb.kelvin}K` : o.label}
            selected={o.id === wb.preset}
            onPress={() => setWhiteBalance({ preset: o.id })}
          />
        ))}
        <Tile
          icon="tune"
          label={
            shifted ? `${formatShift(wb.ab, 'A', 'B')} · ${formatShift(wb.gm, 'G', 'M')}` : 'Tinh chỉnh'
          }
          selected={shifted}
          onPress={onAdjust}
        />
      </ScrollView>
      {wb.preset === 'kelvin' && canKelvin ? (
        <StopDial
          label="NHIỆT ĐỘ MÀU"
          values={KELVIN_STOPS}
          index={kelvinIndex}
          format={(v) => `${v}K`}
          onChange={(kelvin) => setWhiteBalance({ kelvin })}
        />
      ) : null}
    </View>
  );
}

const TILE_WIDTH = 88;

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  tile: {
    width: TILE_WIDTH,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.medium,
    backgroundColor: EditorColors.surfaceHigh,
  },
  tileSelected: {
    backgroundColor: EditorColors.accent,
  },
  label: {
    color: EditorColors.text,
  },
  labelSelected: {
    color: EditorColors.accentText,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
