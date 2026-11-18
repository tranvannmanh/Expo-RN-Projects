import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { BADGE_OPACITY, ICON_SIZE, PAGE_ASPECT_RATIO } from '../constants';
import type { PageView } from '../types/document';
import { useT } from '@/shared/i18n';

export type PageThumbnailActions =
  | { mode: 'view'; onPress: () => void; onDelete?: () => void }
  | {
      mode: 'reorder';
      onMoveEarlier?: () => void;
      onMoveLater?: () => void;
    };

type PageThumbnailProps = {
  page: PageView;
  width: number;
  disabled?: boolean;
  actions: PageThumbnailActions;
};

export function PageThumbnail({ page, width, disabled, actions }: PageThumbnailProps) {
  const t = useT();
  const isView = actions.mode === 'view';

  const label = page.missing ? t.pages.missingA11y(page.pageNumber) : t.pages.page(page.pageNumber);
  const content = (
    <>
      {page.missing ? (
        <ThemedView type="backgroundSelected" style={styles.missing}>
          <AppIcon ios="exclamationmark.triangle" android="broken_image" size={ICON_SIZE.medium} color="textSecondary" />
          <ThemedText type="small" themeColor="textSecondary">
            {t.pages.missing}
          </ThemedText>
        </ThemedView>
      ) : (
        <Image source={{ uri: page.uri }} style={styles.image} contentFit="contain" transition={150} />
      )}

      <ThemedView type="scrim" style={styles.badge}>
        <ThemedText type="smallBold" themeColor="onScrim">
          {page.pageNumber}
        </ThemedText>
      </ThemedView>

      {isView && actions.onDelete && (
        <OverlayButton
          style={styles.topRight}
          label={t.pages.delete(page.pageNumber)}
          disabled={disabled}
          onPress={actions.onDelete}
          icon={<AppIcon ios="trash" android="delete" size={ICON_SIZE.small} color="onScrim" />}
        />
      )}

      {!isView && (
        <ThemedView type="scrim" style={styles.moveBar}>
          <OverlayButton
            label={t.pages.moveEarlier(page.pageNumber)}
            disabled={disabled || !actions.onMoveEarlier}
            onPress={actions.onMoveEarlier}
            icon={<AppIcon ios="chevron.left" android="chevron_left" size={ICON_SIZE.medium} color="onScrim" />}
          />
          <OverlayButton
            label={t.pages.moveLater(page.pageNumber)}
            disabled={disabled || !actions.onMoveLater}
            onPress={actions.onMoveLater}
            icon={<AppIcon ios="chevron.right" android="chevron_right" size={ICON_SIZE.medium} color="onScrim" />}
          />
        </ThemedView>
      )}
    </>
  );

  // Reorder mode uses a plain view: a disabled Pressable would dim the move buttons too.
  if (!isView) {
    return (
      <ThemedView type="backgroundSelected" accessibilityLabel={label} style={[styles.container, { width }]}>
        {content}
      </ThemedView>
    );
  }

  return (
    <ThemedPressable
      type="backgroundSelected"
      pressedType="backgroundElement"
      accessibilityRole="imagebutton"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={actions.onPress}
      style={[styles.container, { width }]}>
      {content}
    </ThemedPressable>
  );
}

type OverlayButtonProps = {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function OverlayButton({ label, icon, disabled, onPress, style }: OverlayButtonProps) {
  return (
    <ThemedPressable
      type="scrim"
      pressedType="backgroundSelected"
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.one}
      disabled={disabled}
      onPress={onPress}
      style={[styles.overlayButton, style]}>
      {icon}
    </ThemedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: PAGE_ASPECT_RATIO,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  badge: {
    position: 'absolute',
    left: Spacing.two,
    bottom: Spacing.two,
    minWidth: Spacing.four,
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
    opacity: BADGE_OPACITY,
  },
  topRight: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    opacity: BADGE_OPACITY,
  },
  // No opacity here so ThemedPressable's disabled style stays visible.
  overlayButton: {
    padding: Spacing.one,
    borderRadius: Spacing.four,
  },
  moveBar: {
    position: 'absolute',
    top: Spacing.one,
    left: Spacing.one,
    right: Spacing.one,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Spacing.four,
    opacity: BADGE_OPACITY,
  },
});
