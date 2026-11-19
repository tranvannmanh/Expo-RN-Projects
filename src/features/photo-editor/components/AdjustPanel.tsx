import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

import { ADJUSTMENT_GROUPS } from '../constants/adjustments.constants';
import type { AdjustmentGroupId, Adjustments } from '../types/editor.types';
import { AdjustmentSlider } from './AdjustmentSlider';
import { ChipButton } from './ChipButton';

type AdjustPanelProps = {
  adjustments: SharedValue<Adjustments>;
};

export function AdjustPanel({ adjustments }: AdjustPanelProps) {
  const [groupId, setGroupId] = useState<AdjustmentGroupId>('light');
  const group = ADJUSTMENT_GROUPS.find((g) => g.id === groupId) ?? ADJUSTMENT_GROUPS[0];

  return (
    <View style={styles.container}>
      <View style={styles.groups}>
        {ADJUSTMENT_GROUPS.map((g) => (
          <ChipButton
            key={g.id}
            label={g.label}
            selected={g.id === groupId}
            onPress={() => setGroupId(g.id)}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.sliders} showsVerticalScrollIndicator={false}>
        {group.items.map((definition) => (
          <AdjustmentSlider key={definition.key} definition={definition} adjustments={adjustments} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  groups: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  sliders: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
