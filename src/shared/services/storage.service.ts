import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export const StorageService = {
  set: (key: string, value: string) => storage.set(key, value),
  get: (key: string) => storage.getString(key),
  remove: (key: string) => storage.delete(key),
};
