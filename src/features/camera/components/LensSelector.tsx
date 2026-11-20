import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';

import { CameraLayout } from '../constants/camera.constants';
import type { LensOption } from '../types/camera.types';

type LensSelectorProps = {
  lenses: LensOption[];
  selectedId: string | null;
  onSelect: (lensId: string) => void;
};

/** 0.5x / 1x / 3x … switch, shown only when the phone has more than one lens. */
export function LensSelector({ lenses, selectedId, onSelect }: LensSelectorProps) {
  if (lenses.length < 2) return null;
  return (
    <View style={styles.row}>
      {lenses.map((lens) => {
        const selected = lens.id === selectedId;
        return (
          <Pressable
            key={lens.id}
            onPress={() => onSelect(lens.id)}
            style={({ pressed }) => [styles.lens, selected && styles.selected, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={selected ? styles.textSelected : styles.text}>
              {lens.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const SIZE = CameraLayout.lensButtonSize;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: Spacing.two,
    padding: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: EditorColors.overlay,
  },
  lens: {
    minWidth: SIZE,
    height: SIZE,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: EditorColors.accent,
  },
  text: {
    color: EditorColors.text,
  },
  textSelected: {
    color: EditorColors.accentText,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
