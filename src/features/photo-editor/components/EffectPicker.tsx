import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';

import { LENS_EFFECTS, LIGHT_FILTERS } from '../constants/effects.constants';
import type { EffectOption, EffectSelection } from '../types/editor.types';
import { ChipButton } from './ChipButton';

type EffectPickerProps = {
  value: EffectSelection;
  onChange: (patch: Partial<EffectSelection>) => void;
};

type EffectRowProps<T extends string> = {
  title: string;
  options: EffectOption<T>[];
  selected: T;
  onSelect: (id: T) => void;
};

function EffectRow<T extends string>({ title, options, selected, onSelect }: EffectRowProps<T>) {
  return (
    <View style={styles.group}>
      <ThemedText type="small" style={styles.title}>
        {title}
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((o) => (
          <ChipButton
            key={o.id}
            label={o.label}
            selected={o.id === selected}
            onPress={() => onSelect(o.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/** Lens simulation + light filter chips; one of each can be active. */
export function EffectPicker({ value, onChange }: EffectPickerProps) {
  return (
    <View style={styles.container}>
      <EffectRow
        title="Ống kính"
        options={LENS_EFFECTS}
        selected={value.lens}
        onSelect={(lens) => onChange({ lens })}
      />
      <EffectRow
        title="Bộ lọc ánh sáng"
        options={LIGHT_FILTERS}
        selected={value.filter}
        onSelect={(filter) => onChange({ filter })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  group: {
    gap: Spacing.one,
  },
  title: {
    color: EditorColors.textMuted,
    paddingHorizontal: Spacing.four,
  },
  row: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
