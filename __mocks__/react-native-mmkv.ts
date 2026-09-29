const storage = new Map<string, string | number | boolean>();

export const createMMKV = jest.fn(() => ({
  getString: (key: string) => {
    const value = storage.get(key);

    return typeof value === 'string' ? value : undefined;
  },

  getNumber: (key: string) => {
    const value = storage.get(key);

    return typeof value === 'number' ? value : undefined;
  },

  getBoolean: (key: string) => {
    const value = storage.get(key);

    return typeof value === 'boolean' ? value : undefined;
  },

  set: (key: string, value: string | number | boolean) => {
    storage.set(key, value);
  },

  remove: (key: string) => {
    storage.delete(key);
  },
}));
