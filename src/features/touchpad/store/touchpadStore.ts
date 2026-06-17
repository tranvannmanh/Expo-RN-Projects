import { create } from 'zustand';

import {
  DEFAULT_PORT,
  DEFAULT_SCROLL_SENSITIVITY,
  DEFAULT_SENSITIVITY,
  SCROLL_NATURAL_DIRECTION,
} from '../constants';
import { ConnectionConfig, ConnectionStatus } from '../types';

interface TouchpadStore {
  connectionStatus: ConnectionStatus;
  errorMessage: string | null;
  config: ConnectionConfig;
  sensitivity: number;
  scrollSensitivity: number;
  naturalScroll: boolean;
  setConfig: (config: Partial<ConnectionConfig>) => void;
  setSensitivity: (value: number) => void;
  setScrollSensitivity: (value: number) => void;
  setNaturalScroll: (value: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus, errorMessage?: string) => void;
}

export const useTouchpadStore = create<TouchpadStore>((set) => ({
  connectionStatus: 'disconnected',
  errorMessage: null,
  config: { host: '', port: DEFAULT_PORT },
  sensitivity: DEFAULT_SENSITIVITY,
  scrollSensitivity: DEFAULT_SCROLL_SENSITIVITY,
  naturalScroll: SCROLL_NATURAL_DIRECTION,
  setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
  setSensitivity: (value) => set({ sensitivity: value }),
  setScrollSensitivity: (value) => set({ scrollSensitivity: value }),
  setNaturalScroll: (value) => set({ naturalScroll: value }),
  setConnectionStatus: (status, errorMessage = null) =>
    set({ connectionStatus: status, errorMessage }),
}));
