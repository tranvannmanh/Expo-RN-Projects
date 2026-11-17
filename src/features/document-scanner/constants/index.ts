/** A4 portrait (1 : √2), the most common scanned page shape. */
export const PAGE_ASPECT_RATIO = 1 / Math.SQRT2;

/** Thumbnail grid: 3 columns on phones, 4 from small-tablet width (dp). */
export const GRID_COLUMNS_COMPACT = 3;
export const GRID_COLUMNS_WIDE = 4;
export const GRID_WIDE_BREAKPOINT = 600;

export const ICON_SIZE = {
  small: 16,
  medium: 24,
  hero: 56,
} as const;

/** Page-number badge sits on top of the image; keep the page visible underneath. */
export const BADGE_OPACITY = 0.75;

/** Page preview zoom limits and steps (scale factors relative to "fit"). */
export const ZOOM = {
  min: 1,
  max: 4,
  /** Scale used when double-tapping a page at fit size */
  doubleTap: 2.5,
  /** Multiplier applied by the zoom-in / zoom-out buttons */
  step: 1.5,
  animationMs: 200,
} as const;

/** Cover thumbnail width in the document list (dp). */
export const LIST_COVER_WIDTH = 56;

/** Preview pager render window, in screens: the current page plus one on each side. */
export const PREVIEW_WINDOW_SIZE = 3;
