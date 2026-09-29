import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const StorageService = {
  set: (key: string, value: string) => storage.set(key, value),
  get: (key: string) => storage.getString(key),
  remove: (key: string) => storage.remove(key),
};
