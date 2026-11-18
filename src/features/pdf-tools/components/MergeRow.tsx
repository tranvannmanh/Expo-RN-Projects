import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON } from '../constants';
import type { PdfFile } from '../types/pdfFile';
import { pdfFileSummary } from './PdfFileListItem';
import { useT } from '@/shared/i18n';

type MergeRowProps = {
  file: PdfFile;
  /** Position in the merge order, or -1 when not selected. */
  order: number;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onMove: (offset: -1 | 1) => void;
};

export function MergeRow({
  file,
  order,
  isFirst,
  isLast,
  disabled,
  onToggle,
  onMove,
}: MergeRowProps) {
  const t = useT();
  const selected = order >= 0;
  return (
    <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.row}>
      <ThemedPressable
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected, disabled }}
        accessibilityLabel={file.name}
        disabled={disabled}
        onPress={onToggle}
        style={styles.main}>
        <ThemedView type={selected ? 'primary' : 'backgroundSelected'} style={styles.badge}>
          <ThemedText type="smallBold" themeColor={selected ? 'onPrimary' : 'textSecondary'}>
            {selected ? order + 1 : ''}
          </ThemedText>
        </ThemedView>
        <ThemedView
          type={selected ? 'backgroundSelected' : 'backgroundElement'}
          style={styles.body}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {file.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {pdfFileSummary(file, t)}
          </ThemedText>
        </ThemedView>
      </ThemedPressable>
      {selected && (
        <>
          <MoveButton
            label={t.pdfTools.mergeScreen.moveUp(file.name)}
            icon="up"
            disabled={disabled || isFirst}
            onPress={() => onMove(-1)}
          />
          <MoveButton
            label={t.pdfTools.mergeScreen.moveDown(file.name)}
            icon="down"
            disabled={disabled || isLast}
            onPress={() => onMove(1)}
          />
        </>
      )}
    </ThemedView>
  );
}

function MoveButton({
  label,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  icon: 'up' | 'down';
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <ThemedPressable
      type="backgroundSelected"
      pressedType="backgroundElement"
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.one}
      disabled={disabled}
      onPress={onPress}
      style={styles.move}>
      <AppIcon
        ios={icon === 'up' ? 'chevron.up' : 'chevron.down'}
        android={icon === 'up' ? 'arrow_upward' : 'arrow_downward'}
        size={ICON.medium}
      />
    </ThemedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingRight: Spacing.two,
    borderRadius: Spacing.three,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  badge: {
    width: Spacing.five,
    height: Spacing.five,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  move: {
    padding: Spacing.two,
    borderRadius: Spacing.four,
  },
});
