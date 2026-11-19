import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const storage = createMMKV();

export const StorageService = {
  set: (key: string, value: string) => storage.set(key, value),
  get: (key: string) => storage.getString(key),
  remove: (key: string) => storage.remove(key),
};

/** Adapter for zustand `persist` middleware. */
export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => {
    storage.remove(name);
  },
};
