export type HardwareKey = 'focus' | 'shutter';

export type HardwareKeyEvent = {
  key: HardwareKey;
  action: 'down' | 'up';
};

export type HardwareKeysEvents = {
  onKey: (event: HardwareKeyEvent) => void;
};
