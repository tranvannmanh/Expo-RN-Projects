import { type ReactNode, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

type PagePreviewModalProps = {
  pages: PageView[];
  /** Index of the page to open; null hides the modal */
  initialIndex: number | null;
  onClose: () => void;
  /** Optional per-page export actions shown in the top bar */
  onSharePage?: (page: PageView) => void;
  onSavePage?: (page: PageView) => void;
};

export function PagePreviewModal({
  pages,
  initialIndex,
  onClose,
  onSharePage,
  onSavePage,
}: PagePreviewModalProps) {
  return (
    <Modal
      visible={initialIndex !== null}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      {/* Modals render outside the app root, so gestures need their own root view */}
      <GestureHandlerRootView style={styles.fill}>
        {initialIndex !== null && (
          <PreviewPager
            key={initialIndex}
            pages={pages}
            initialIndex={initialIndex}
            onClose={onClose}
            onSharePage={onSharePage}
            onSavePage={onSavePage}
          />
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

type PreviewPagerProps = Omit<PagePreviewModalProps, 'initialIndex'> & { initialIndex: number };

function PreviewPager({ pages, initialIndex, onClose, onSharePage, onSavePage }: PreviewPagerProps) {
  const { width } = useWindowDimensions();
  const [current, setCurrent] = useState(initialIndex);
  const [scale, setScale] = useState<number>(ZOOM.min);
  const zoomHandles = useRef(new Map<number, ZoomableImageHandle>());

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrent(Math.round(event.nativeEvent.contentOffset.x / width));
    setScale(ZOOM.min);
  };

  const currentHandle = () => zoomHandles.current.get(current);

  return (
    <ThemedView type="scrim" style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ThemedView type="scrim" style={styles.topBar}>
          <TopBarButton
            label="Close preview"
            onPress={onClose}
            icon={<AppIcon ios="xmark" android="close" size={ICON_SIZE.medium} color="onScrim" />}
          />
          <ThemedText type="smallBold" themeColor="onScrim" style={styles.fill}>
            Page {current + 1} / {pages.length}
          </ThemedText>
          {onSharePage && pages[current] && (
            <TopBarButton
              label={`Share page ${current + 1}`}
              onPress={() => onSharePage(pages[current])}
              icon={<AppIcon ios="square.and.arrow.up" android="share" size={ICON_SIZE.medium} color="onScrim" />}
            />
          )}
          {onSavePage && pages[current] && (
            <TopBarButton
              label={`Save page ${current + 1} to Pictures`}
              onPress={() => onSavePage(pages[current])}
              icon={<AppIcon ios="square.and.arrow.down" android="download" size={ICON_SIZE.medium} color="onScrim" />}
            />
          )}
        </ThemedView>

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
                accessibilityLabel={`Page ${item.pageNumber}`}
                onScaleChange={(next) => index === current && setScale(next)}
              />
            </View>
          )}
        />

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
      type="scrim"
      pressedType="backgroundSelected"
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
