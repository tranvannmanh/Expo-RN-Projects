import { type ReactNode, useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PageView } from '../types/document';

import { ICON_SIZE, PREVIEW_WINDOW_SIZE, ZOOM } from '../constants';
import { ZoomControls } from './ZoomControls';
import { ZoomableImage, type ZoomableImageHandle } from './ZoomableImage';
import { useT } from '@/shared/i18n';

type PagePreviewerProps = {
  pages: PageView[];
  initialIndex: number;
  onClose: () => void;
  /** Optional per-page export actions shown in the top bar */
  onSharePage?: (page: PageView) => void;
  onSavePage?: (page: PageView) => void;
};

/**
 * Full-screen page pager with per-page zoom. Rendered as its own route (not a Modal) so the
 * status bar and back button follow the app like any other screen.
 */
export function PagePreviewer({
  pages,
  initialIndex,
  onClose,
  onSharePage,
  onSavePage,
}: PagePreviewerProps) {
  const { width } = useWindowDimensions();
  const t = useT();
  const [current, setCurrent] = useState(initialIndex);
  const [scale, setScale] = useState<number>(ZOOM.min);
  const zoomHandles = useRef(new Map<number, ZoomableImageHandle>());

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrent(Math.round(event.nativeEvent.contentOffset.x / width));
    setScale(ZOOM.min);
  };

  const currentHandle = () => zoomHandles.current.get(current);

  return (
    <ThemedView type="background" style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ThemedView type="background" style={styles.topBar}>
          <TopBarButton
            label={t.pages.closePreview}
            onPress={onClose}
            icon={<AppIcon ios="xmark" android="close" size={ICON_SIZE.medium} color="text" />}
          />
          <ThemedText type="smallBold" themeColor="text" style={styles.fill}>
            {t.pages.pageOf(current + 1, pages.length)}
          </ThemedText>
          {onSharePage && pages[current] && (
            <TopBarButton
              label={t.pages.sharePage(current + 1)}
              onPress={() => onSharePage(pages[current])}
              icon={
                <AppIcon
                  ios="square.and.arrow.up"
                  android="share"
                  size={ICON_SIZE.medium}
                  color="text"
                />
              }
            />
          )}
          {onSavePage && pages[current] && (
            <TopBarButton
              label={t.pages.savePage(current + 1)}
              onPress={() => onSavePage(pages[current])}
              icon={
                <AppIcon
                  ios="square.and.arrow.down"
                  android="download"
                  size={ICON_SIZE.medium}
                  color="text"
                />
              }
            />
          )}
        </ThemedView>

        <ThemedView type="backgroundSelected" style={styles.fill}>
          <FlatList
            data={pages}
            horizontal
            pagingEnabled
            scrollEnabled={scale <= ZOOM.min}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            // Full-resolution pages are large bitmaps: keep only the visible page and its
            // neighbours mounted (FlatList's default window would hold ~21 pages).
            windowSize={PREVIEW_WINDOW_SIZE}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            removeClippedSubviews
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            keyExtractor={(page) => page.id}
            onMomentumScrollEnd={handleScrollEnd}
            renderItem={({ item, index }) => (
              <View style={[styles.page, { width }]}>
                <ZoomableImage
                  ref={(handle) => {
                    if (handle) zoomHandles.current.set(index, handle);
                    else zoomHandles.current.delete(index);
                  }}
                  uri={item.uri}
                  accessibilityLabel={t.pages.page(item.pageNumber)}
                  onScaleChange={(next) => index === current && setScale(next)}
                />
              </View>
            )}
          />
        </ThemedView>

        <ZoomControls
          scale={scale}
          onZoomIn={() => currentHandle()?.zoomBy(ZOOM.step)}
          onZoomOut={() => currentHandle()?.zoomBy(1 / ZOOM.step)}
          onReset={() => currentHandle()?.reset()}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

type TopBarButtonProps = { label: string; icon: ReactNode; onPress: () => void };

function TopBarButton({ label, icon, onPress }: TopBarButtonProps) {
  return (
    <ThemedPressable
      type="background"
      pressedType="backgroundElement"
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.two}
      onPress={onPress}
      style={styles.closeButton}>
      {icon}
    </ThemedPressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  closeButton: {
    padding: Spacing.two,
    borderRadius: Spacing.five,
  },
  page: {
    height: '100%',
  },
});
