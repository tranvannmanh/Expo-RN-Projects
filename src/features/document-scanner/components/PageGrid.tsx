import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

import { GRID_COLUMNS_COMPACT, GRID_COLUMNS_WIDE, GRID_WIDE_BREAKPOINT } from '../constants';
import type { PageView } from '../types/document';
import { PageThumbnail, type PageThumbnailActions } from './PageThumbnail';

type PageGridProps = {
  pages: PageView[];
  /** Horizontal space taken by parents (screen + card padding) */
  horizontalInset: number;
  disabled?: boolean;
  actionsFor: (page: PageView, index: number) => PageThumbnailActions;
};

export function PageGrid({ pages, horizontalInset, disabled, actionsFor }: PageGridProps) {
  const { width } = useWindowDimensions();
  const columns = width >= GRID_WIDE_BREAKPOINT ? GRID_COLUMNS_WIDE : GRID_COLUMNS_COMPACT;
  const available = Math.min(width, MaxContentWidth) - horizontalInset;
  const itemWidth = Math.floor((available - GAP * (columns - 1)) / columns);

  return (
    <View style={styles.grid}>
      {pages.map((page, index) => (
        <PageThumbnail
          key={page.id}
          page={page}
          width={itemWidth}
          disabled={disabled}
          actions={actionsFor(page, index)}
        />
      ))}
    </View>
  );
}

const GAP = Spacing.two;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});
