import type { AndroidIcon } from '@/features/photo-editor';

/** One tile in the Fn grid: a text label or an icon, with the current value below. */
export type FnItem = {
  id: string;
  label?: string;
  icon?: AndroidIcon;
  value?: string;
  disabled?: boolean;
  onPress: () => void;
};
