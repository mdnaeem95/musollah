import { MMKV } from 'react-native-mmkv';

// Initialize MMKV with encryption for sensitive data
// Note: Using MMKV v2.x.x for compatibility with old React Native architecture
export const storage = new MMKV({
  id: 'rihlah-storage',
  encryptionKey: 'rihlah-2025-secure-key' // Generate a proper key in production
});

// Create AsyncStorage-compatible wrapper for easy migration
export const MMKVStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return storage.getString(key) ?? null;
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    storage.set(key, value);
  },

  async removeItem(key: string): Promise<void> {
    storage.delete(key);
  },

  async getAllKeys(): Promise<string[]> {
    return storage.getAllKeys();
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return keys.map(key => [key, storage.getString(key) ?? null]);
  },

  async multiSet(kvPairs: [string, string][]): Promise<void> {
    kvPairs.forEach(([key, value]) => storage.set(key, value));
  },

  async clear(): Promise<void> {
    storage.clearAll();
  }
};