import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const PERSISTED_STORE_KEY = 'grid-preview-store';
export const PERSISTED_SCHEMA_VERSION = 1;

export const persistedStorage = createJSONStorage(() => AsyncStorage);

export const migratePersistedState = (persistedState: unknown, versionFoundOnDisk: number) => {
  if (versionFoundOnDisk === PERSISTED_SCHEMA_VERSION) return persistedState;
  return persistedState;
};
