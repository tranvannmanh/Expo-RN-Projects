import type { SkImage } from '@shopify/react-native-skia';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { DEFAULT_ADJUSTMENTS } from '../constants/adjustments.constants';
import { LENS_EFFECTS, LIGHT_FILTERS, NO_EFFECTS } from '../constants/effects.constants';
import { getFilmPreset } from '../constants/film-presets.constants';
import { useCurveLut } from '../hooks/useCurveLut';
import { buildUniforms } from '../lib/uniforms';
import type { EffectSelection, LensEffectId, LightFilterId } from '../types/editor.types';
import { PREVIEW_CARD_SIZE, PreviewCard } from './PreviewCard';
import { SegmentedControl } from './SegmentedControl';

type EffectPickerProps = {
  value: EffectSelection;
  onChange: (patch: Partial<EffectSelection>) => void;
  /** Sample photo each card is rendered from. */
  image: SkImage;
};

type Tab = 'lens' | 'filter';
type Card =
  | { tab: 'lens'; id: LensEffectId; label: string }
  | { tab: 'filter'; id: LightFilterId; label: string };

const TABS = [
  { id: 'lens' as const, label: 'Ống kính' },
  { id: 'filter' as const, label: 'Bộ lọc ánh sáng' },
];

const CARDS: Record<Tab, Card[]> = {
  lens: LENS_EFFECTS.map((e) => ({ tab: 'lens' as const, id: e.id, label: e.label })),
  filter: LIGHT_FILTERS.map((e) => ({ tab: 'filter' as const, id: e.id, label: e.label })),
};

/** The plain film keeps the cards about the effect alone. */
const PLAIN_FILM = getFilmPreset('none');

/**
 * Lens simulation and light filter, one tab each. Every card shows the sample
 * photo through that effect, so the choice is visual, like the film presets.
 */
export function EffectPicker({ value, onChange, image }: EffectPickerProps) {
  const [tab, setTab] = useState<Tab>('lens');
  const { lut } = useCurveLut(PLAIN_FILM);
  const selectedId = tab === 'lens' ? value.lens : value.filter;

  const select = (card: Card) =>
    onChange(card.tab === 'lens' ? { lens: card.id } : { filter: card.id });
  /** The selection with only this card's effect, so each card shows one effect alone. */
  const effectsOf = (card: Card): EffectSelection =>
    card.tab === 'lens' ? { ...NO_EFFECTS, lens: card.id } : { ...NO_EFFECTS, filter: card.id };

  return (
    <View style={styles.container}>
      <SegmentedControl options={TABS} value={tab} onChange={setTab} fill />
      <FlatList
        key={tab}
        horizontal
        data={CARDS[tab]}
        keyExtractor={(card) => card.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PreviewCard
            image={image}
            lut={lut}
            uniforms={buildUniforms(DEFAULT_ADJUSTMENTS, {
              film: PLAIN_FILM,
              outSize: PREVIEW_CARD_SIZE,
              bypass: false,
              detailScale: 1,
              hasUserCurve: false,
              effects: effectsOf(item),
            })}
            label={item.label}
            selected={item.id === selectedId}
            onPress={() => select(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
