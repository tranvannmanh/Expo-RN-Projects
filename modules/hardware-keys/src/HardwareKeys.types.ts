export type HardwareKey = 'focus' | 'shutter' | 'volume';

export type HardwareKeyEvent = {
  key: HardwareKey;
  action: 'down' | 'up';
};

export type HardwareKeysEvents = {
  onKey: (event: HardwareKeyEvent) => void;
};
