import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PixelRatio,
  StyleSheet,
  View,
  type ViewToken,
} from 'react-native';
import { FlatList, Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AppIcon } from '@/components/app-icon';
import { StatusBanner } from '@/components/status-banner';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ZoomControls } from '@/features/document-scanner/components/ZoomControls';
import { useTheme } from '@/hooks/use-theme';
import { toAppError } from '@/shared/errors/appError';
import { useT } from '@/shared/i18n';

import { ICON, VIEWER } from '../constants';
import { getPreviewPageSizes, type PageSize } from '../services/pdfTools.service';
import type { PdfFile } from '../types/pdfFile';
import { PdfViewerPage } from './PdfViewerPage';

type PageLayout = { index: number; width: number; height: number; length: number; offset: number };

/**
 * Lays out every page at `zoom`. Width, height, gaps and padding all scale by the same factor,
 * so zooming maps any content point (x, y) to (x·r, y·r) — which keeps the focal point stable.
 */
function buildLayout(sizes: PageSize[], viewportWidth: number, zoom: number) {
  const gap = VIEWER.pageGap * zoom;
  const pageWidth = (viewportWidth - 2 * VIEWER.sidePadding) * zoom;
  let offset = 0;
  const pages: PageLayout[] = sizes.map((size, index) => {
    const height = pageWidth * (size.height / size.width);
    const page = { index, width: pageWidth, height, length: height + gap, offset };
    offset += height + gap;
    return page;
  });
  return {
    pages,
    pageWidth,
    contentWidth: viewportWidth * zoom,
    gap,
    padding: VIEWER.sidePadding * zoom,
  };
}

/** Smallest sharp tier that covers the on-screen page width (in physical pixels). */
function sharpWidthFor(pageWidthDp: number): number {
  const needed = PixelRatio.getPixelSizeForLayoutSize(pageWidthDp) * 0.9;
  return (
    VIEWER.sharpWidths.find((w) => w >= needed) ?? VIEWER.sharpWidths[VIEWER.sharpWidths.length - 1]
  );
}

/** Page whose area contains content offset `y` (binary search over cumulative offsets). */
function pageAt(pages: PageLayout[], y: number): number {
  let low = 0;
  let high = pages.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (pages[mid].offset <= y) low = mid;
    else high = mid - 1;
  }
  return low;
}

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

/**
 * Full-screen, continuously scrolling (vertical) PDF viewer with document-wide zoom.
 * Rendered as its own route (not a Modal) so the status bar and back button follow the app.
 */
type PdfDocumentViewerProps = {
  file: PdfFile;
  onClose: () => void;
  /** Extra top-bar buttons (e.g. share/save), rendered after the page counter. */
  actions?: ReactNode;
  /** Status shown over the top of the pages (e.g. "Saved to …"). */
  banner?: ReactNode;
};

export function PdfDocumentViewer({ file, onClose, actions, banner }: PdfDocumentViewerProps) {
  const t = useT();
  const theme = useTheme();
  const sizes = useQuery({
    queryKey: ['pdf-page-sizes', file.id],
    queryFn: () => getPreviewPageSizes(file),
    // Stored PDFs never change, so page sizes stay valid.
    staleTime: Infinity,
  });

  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(0);
  const [pinching, setPinching] = useState(false);
  const [visibleSet, setVisibleSet] = useState<ReadonlySet<number>>(new Set());
  const [settledSet, setSettledSet] = useState<ReadonlySet<number>>(new Set());

  const layout = useMemo(
    () => buildLayout(sizes.data ?? [], viewport.width, zoom),
    [sizes.data, viewport.width, zoom],
  );
  const sharpWidth = sharpWidthFor(layout.pageWidth);

  // ---- scroll tracking (refs: needed synchronously when committing a zoom)
  const listRef = useRef<FlatList<PageLayout>>(null);
  const hScrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const scrollX = useRef(0);
  const zoomRef = useRef(1);
  const pendingZoom = useRef<{
    ratio: number;
    x: number;
    y: number;
    fromX: number;
    fromY: number;
  } | null>(null);

  const onVerticalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    if (layout.pages.length === 0) return;
    const page = pageAt(layout.pages, scrollY.current + viewport.height / 2);
    if (page !== current) setCurrent(page);
  };

  // Two viewability rules: "visible" (render the small image first) and "settled" (visible for
  // a moment while not flinging past → worth a sharp render). Must be stable refs for FlatList.
  const viewability = useRef([
    {
      viewabilityConfig: { itemVisiblePercentThreshold: 1 },
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken<PageLayout>[] }) =>
        setVisibleSet(new Set(viewableItems.map((item) => item.index ?? -1))),
    },
    {
      viewabilityConfig: { itemVisiblePercentThreshold: 10, minimumViewTime: VIEWER.settleMs },
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken<PageLayout>[] }) =>
        setSettledSet(new Set(viewableItems.map((item) => item.index ?? -1))),
    },
  ]).current;

  // ---- zoom: live transform while pinching, real re-layout on release
  const liveScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const zoomShared = useSharedValue(1);
  const viewportShared = useSharedValue({ width: 0, height: 0 });

  const commitZoom = useCallback(
    (factor: number, x: number, y: number) => {
      setPinching(false);
      const from = zoomRef.current;
      const next = clamp(from * factor, 1, VIEWER.maxZoom);
      liveScale.value = 1;
      if (Math.abs(next - from) < 0.01) return;
      pendingZoom.current = {
        ratio: next / from,
        x,
        y,
        fromX: scrollX.current,
        fromY: scrollY.current,
      };
      zoomRef.current = next;
      zoomShared.value = next;
      setZoom(next);
    },
    [liveScale, zoomShared],
  );

  // Keep the point under the fingers in place after the re-layout.
  useLayoutEffect(() => {
    const pending = pendingZoom.current;
    if (!pending) return;
    pendingZoom.current = null;
    const y = Math.max(0, (pending.fromY + pending.y) * pending.ratio - pending.y);
    const x = Math.max(0, (pending.fromX + pending.x) * pending.ratio - pending.x);
    scrollY.current = y;
    scrollX.current = zoom > 1 ? x : 0;
    listRef.current?.scrollToOffset({ offset: y, animated: false });
    hScrollRef.current?.scrollTo({ x: scrollX.current, animated: false });
  }, [zoom]);

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      focalX.value = event.focalX;
      focalY.value = event.focalY;
      scheduleOnRN(setPinching, true);
    })
    .onUpdate((event) => {
      liveScale.value = clamp(event.scale, 1 / zoomShared.value, VIEWER.maxZoom / zoomShared.value);
    })
    .onEnd(() => {
      scheduleOnRN(commitZoom, liveScale.value, focalX.value, focalY.value);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      const factor =
        zoomShared.value > 1 ? 1 / zoomShared.value : VIEWER.maxZoom / zoomShared.value;
      scheduleOnRN(commitZoom, factor, event.x, event.y);
    });

  const gesture = Gesture.Simultaneous(pinch, doubleTap);

  const liveStyle = useAnimatedStyle(() => {
    const k = liveScale.value;
    const { width, height } = viewportShared.value;
    return {
      transform: [
        { translateX: (focalX.value - width / 2) * (1 - k) },
        { translateY: (focalY.value - height / 2) * (1 - k) },
        { scale: k },
      ],
    };
  });

  const onViewportLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
    viewportShared.value = { width, height };
  };

  const zoomAtCenter = (factor: number) =>
    commitZoom(factor, viewport.width / 2, viewport.height / 2);
  const total = sizes.data?.length ?? file.pageCount;

  return (
    <ThemedView type="background" style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ThemedView type="background" style={styles.topBar}>
          <ThemedPressable
            type="background"
            pressedType="backgroundElement"
            accessibilityRole="button"
            accessibilityLabel={t.pages.closePreview}
            hitSlop={Spacing.two}
            onPress={onClose}
            style={styles.iconButton}>
            <AppIcon ios="xmark" android="close" size={ICON.medium} color="text" />
          </ThemedPressable>
          <ThemedText type="smallBold" themeColor="text" style={styles.fill}>
            {t.pages.pageOf(current + 1, total)}
          </ThemedText>
          {actions}
        </ThemedView>

        <ThemedView type="backgroundSelected" style={styles.viewport} onLayout={onViewportLayout}>
          {banner && (
            <View style={styles.banner} pointerEvents="box-none">
              {banner}
            </View>
          )}
          {sizes.isError && (
            <View style={styles.center}>
              <StatusBanner variant="error" error={toAppError(sizes.error)} />
            </View>
          )}
          {sizes.isPending && (
            <View style={styles.center}>
              <ActivityIndicator color={theme.textSecondary} />
            </View>
          )}
          {sizes.data && viewport.width > 0 && (
            <GestureDetector gesture={gesture}>
              <Animated.View style={[styles.fill, liveStyle]}>
                <ScrollView
                  ref={hScrollRef}
                  horizontal
                  scrollEnabled={zoom > 1 && !pinching}
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={(event) => {
                    scrollX.current = event.nativeEvent.contentOffset.x;
                  }}
                  contentContainerStyle={{ width: layout.contentWidth }}>
                  <FlatList
                    ref={listRef}
                    style={{ width: layout.contentWidth, height: viewport.height }}
                    data={layout.pages}
                    keyExtractor={(page) => String(page.index)}
                    getItemLayout={(_, index) => ({
                      length: layout.pages[index].length,
                      offset: layout.pages[index].offset,
                      index,
                    })}
                    scrollEnabled={!pinching}
                    onScroll={onVerticalScroll}
                    scrollEventThrottle={16}
                    viewabilityConfigCallbackPairs={viewability}
                    windowSize={VIEWER.windowSize}
                    initialNumToRender={2}
                    maxToRenderPerBatch={2}
                    removeClippedSubviews
                    showsVerticalScrollIndicator
                    extraData={{ visibleSet, settledSet, sharpWidth }}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          height: item.length,
                          paddingTop: layout.gap,
                          paddingHorizontal: layout.padding,
                        }}>
                        <PdfViewerPage
                          file={file}
                          index={item.index}
                          width={item.width}
                          height={item.height}
                          visible={visibleSet.has(item.index)}
                          settled={settledSet.has(item.index)}
                          sharpWidth={sharpWidth}
                        />
                      </View>
                    )}
                  />
                </ScrollView>
              </Animated.View>
            </GestureDetector>
          )}
        </ThemedView>

        <ZoomControls
          scale={zoom}
          max={VIEWER.maxZoom}
          onZoomIn={() => zoomAtCenter(VIEWER.zoomStep)}
          onZoomOut={() => zoomAtCenter(1 / VIEWER.zoomStep)}
          onReset={() => zoomAtCenter(1 / zoom)}
        />
      </SafeAreaView>
    </ThemedView>
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
  banner: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.three,
    right: Spacing.three,
    zIndex: 1,
  },
  iconButton: {
    padding: Spacing.two,
    borderRadius: Spacing.five,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
});
