import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';

import { ASPECT_OPTIONS } from '../constants/camera.constants';
import { useCameraStore } from '../store/camera.store';

/** Frame shape options; each tile previews its proportion as a small outline. */
export function AspectPicker() {
  const aspectId = useCameraStore((s) => s.aspectId);
  const setAspect = useCameraStore((s) => s.setAspect);

  return (
    <View style={styles.row}>
      {ASPECT_OPTIONS.map((option) => {
        const selected = option.id === aspectId;
        return (
          <Pressable
            key={option.id}
            onPress={() => setAspect(option.id)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <View style={styles.shapeBox}>
              <View
                style={[
                  styles.shape,
                  SHAPE_STYLES[option.id],
                  selected && styles.shapeSelected,
                ]}
              />
            </View>
            <ThemedText type="smallBold" style={selected ? styles.labelSelected : styles.label}>
              {option.label}
            </ThemedText>
            {option.hint ? (
              <ThemedText numberOfLines={1} style={styles.hint}>
                {option.hint}
              </ThemedText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const SHAPE_LONG = 28;
const HINT_FONT_SIZE = 11;

/** Portrait outlines (short edge across, long edge down) like the viewfinder. */
const SHAPE_STYLES = StyleSheet.create(
  Object.fromEntries(
    ASPECT_OPTIONS.map((o) => [o.id, { width: SHAPE_LONG / o.ratio, height: SHAPE_LONG }]),
  ),
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.two,
  },
  item: {
    alignItems: 'center',
    gap: Spacing.one,
    minWidth: SHAPE_LONG * 2,
  },
  shapeBox: {
    height: SHAPE_LONG,
    justifyContent: 'center',
  },
  shape: {
    borderWidth: StyleSheet.hairlineWidth * 3,
    borderColor: EditorColors.textMuted,
    borderRadius: Radius.small / 2,
  },
  shapeSelected: {
    borderColor: EditorColors.accent,
    backgroundColor: EditorColors.surfaceHigh,
  },
  label: {
    color: EditorColors.text,
  },
  labelSelected: {
    color: EditorColors.accent,
  },
  hint: {
    color: EditorColors.textMuted,
    fontSize: HINT_FONT_SIZE,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
