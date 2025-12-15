import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultStorage } from '../api/client/storage'; // <-- adjust path if needed

/**
 * Compatibility shim.
 * Keeps the same "storage" export used across older code,
 * but routes all reads/writes to the canonical MMKV instance
 * from api/client/storage.ts.
 */
export const storage = {
  getString: (k: string) => defaultStorage.getString(k),
  set: (k: string, v: string) => defaultStorage.setString(k, v),
  delete: (k: string) => defaultStorage.delete(k),
  getAllKeys: () => defaultStorage.getAllKeys(),
  clearAll: () => defaultStorage.clearAll(),
  // Optional (some code might call these)
  getBoolean: (k: string) => defaultStorage.getBoolean(k),
  getNumber: (k: string) => defaultStorage.getNumber(k),
};

/**
 * Legacy AsyncStorage-like wrapper (if anything still uses it).
 * We write to MMKV primarily; AsyncStorage is only a fallback read.
 */
export const Storage = {
  async getItem(key: string) {
    const v = storage.getString(key);
    if (v !== undefined) return v;
    return await AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    storage.set(key, value);
    // Optional: if you want dual-write during migration period, uncomment:
    // await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    storage.delete(key);
    // Optional:
    // await AsyncStorage.removeItem(key);
  },
};
