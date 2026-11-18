import type { AndroidSymbol, SFSymbol } from 'expo-symbols';


export const ICON = { small: 16, medium: 24, large: 32 } as const;

/** List thumbnail width (dp); height follows A4 portrait. */
export const LIST_THUMB_WIDTH = 56;
/** Detail header thumbnail width (dp). */
export const HEADER_THUMB_WIDTH = 120;
export const A4_ASPECT = 1 / Math.SQRT2;

type Icon = { ios: SFSymbol; android: AndroidSymbol };

export const TOOL_ICONS = {
  import: { ios: 'square.and.arrow.down.on.square', android: 'upload_file' },
  compress: { ios: 'arrow.down.right.and.arrow.up.left', android: 'compress' },
  merge: { ios: 'arrow.triangle.merge', android: 'merge_type' },
  split: { ios: 'scissors', android: 'content_cut' },
  watermark: { ios: 'drop', android: 'branding_watermark' },
  pdf: { ios: 'doc.richtext', android: 'picture_as_pdf' },
  tools: { ios: 'wrench.and.screwdriver', android: 'handyman' },
} satisfies Record<string, Icon>;

/** Overlay badges on thumbnails stay readable without hiding the page. */
export const BADGE_OPACITY = 0.75;

/** Continuous PDF viewer tuning. */
export const VIEWER = {
  maxZoom: 2,
  zoomStep: 1.5,
  /** Gap between pages and side padding at 1× (dp); both scale with zoom. */
  pageGap: 8,
  sidePadding: 8,
  /** Quick, low-memory image (~1 MB decoded) shown while scrolling. */
  lowResWidth: 480,
  /** Sharp tiers (px), chosen from the on-screen page width; 2000 px ≈ 170 dpi on A4. */
  sharpWidths: [960, 1440, 2000],
  /** List window in screens: visible page plus ~2 screens of pages above and below. */
  windowSize: 5,
  /** A page counts as "settled" (gets the sharp image) after being visible this long. */
  settleMs: 250,
} as const;

/** Queue priorities (lower runs first). */
export const RENDER_PRIORITY = { visibleLow: 0, visibleSharp: 1, nearbyLow: 2 } as const;
