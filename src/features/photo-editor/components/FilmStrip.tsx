import type { SkImage } from '@shopify/react-native-skia';
import { useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { EditorColors, Motion, Spacing } from '@/constants/theme';

import { FILM_PRESETS } from '../constants/film-presets.constants';
import { EditorLayout } from '../constants/layout.constants';
import { FilmThumb } from './FilmThumb';

type FilmStripProps = {
  image: SkImage;
  selectedId: string;
  onSelect: (filmId: string) => void;
};

const CARD_WIDTH = EditorLayout.filmCardWidth + EditorLayout.selectedBorder * 2;
const ITEM_SPAN = CARD_WIDTH + Spacing.two;
const ARROW_SIZE = EditorLayout.iconSize;

/** Horizontal preset carousel with ◀ ▶ buttons that step through the films. */
/** Scroll offset that centers item `index` in a list of the given width. */
function centerOffset(index: number, width: number) {
  return Math.max(0, ITEM_SPAN * index - (width - CARD_WIDTH) / 2);
}

export function FilmStrip({ image, selectedId, onSelect }: FilmStripProps) {
  const list = useRef<FlatList<(typeof FILM_PRESETS)[number]>>(null);
  const index = Math.max(0, FILM_PRESETS.findIndex((f) => f.id === selectedId));

  const width = useRef(0);

  useEffect(() => {
    if (!width.current) return;
    list.current?.scrollToOffset({ offset: centerOffset(index, width.current), animated: true });
  }, [index]);

  // Centering needs the measured width, so also scroll once on layout.
  const onLayout = (e: LayoutChangeEvent) => {
    width.current = e.nativeEvent.layout.width;
    list.current?.scrollToOffset({ offset: centerOffset(index, width.current), animated: false });
  };

  const step = (delta: number) => {
    const next = FILM_PRESETS[index + delta];
    if (next) onSelect(next.id);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => step(-1)}
        disabled={index === 0}
        hitSlop={Spacing.two}
        style={({ pressed }) => [styles.arrow, (pressed || index === 0) && styles.dimmed]}>
        <SymbolView name={{ android: 'arrow_left', ios: 'arrowtriangle.left.fill' }} size={ARROW_SIZE} tintColor={EditorColors.text} />
      </Pressable>
      <FlatList
        ref={list}
        horizontal
        data={FILM_PRESETS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialNumToRender={FILM_PRESETS.length}
        onLayout={onLayout}
        getItemLayout={(_, i) => ({ length: ITEM_SPAN, offset: ITEM_SPAN * i, index: i })}
        renderItem={({ item }) => (
          <FilmThumb film={item} image={image} selected={item.id === selectedId} onPress={onSelect} />
        )}
      />
      <Pressable
        onPress={() => step(1)}
        disabled={index === FILM_PRESETS.length - 1}
        hitSlop={Spacing.two}
        style={({ pressed }) => [
          styles.arrow,
          (pressed || index === FILM_PRESETS.length - 1) && styles.dimmed,
        ]}>
        <SymbolView name={{ android: 'arrow_right', ios: 'arrowtriangle.right.fill' }} size={ARROW_SIZE} tintColor={EditorColors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    width: EditorLayout.filmArrowWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: Motion.disabledOpacity,
  },
  list: {
    gap: Spacing.two,
  },
});
