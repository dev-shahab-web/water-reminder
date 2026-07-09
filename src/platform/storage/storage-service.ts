import { createMMKV, type MMKV } from 'react-native-mmkv';

export type KeyValueStorage = {
  contains: (key: string) => boolean;
  getBoolean: (key: string) => boolean | undefined;
  getNumber: (key: string) => number | undefined;
  getString: (key: string) => string | undefined;
  remove: (key: string) => boolean;
  set: (key: string, value: boolean | number | string) => void;
};

let storage: MMKV | null = null;

export const initializeStorage = (): KeyValueStorage => {
  if (!storage) {
    storage = createMMKV({ id: 'rn-enterprise-starter' });
  }

  return storage;
};

export const getStorage = (): KeyValueStorage => {
  return initializeStorage();
};
