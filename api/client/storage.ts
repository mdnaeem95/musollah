import { createMMKV, type MMKV } from 'react-native-mmkv';

// ============================================================================
// STORAGE INSTANCES (MMKV v4)
// ============================================================================

export const storage = createMMKV({
  id: 'musollah-default',
  encryptionKey: 'musollah-secure-key', // TODO: use a real key in prod
});

export const cacheStorage = createMMKV({
  id: 'musollah-cache',
});

export const userStorage = createMMKV({
  id: 'musollah-user',
});

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export class StorageService {
  constructor(private mmkv: MMKV) {}

  get<T>(key: string): T | null {
    try {
      const value = this.mmkv.getString(key);

      // Guard against missing or corrupted values
      if (!value || value === 'undefined' || value === 'null') {
        if (value === 'undefined' || value === 'null') {
          // Clean up corrupted key so it doesn't keep crashing
          this.mmkv.remove(key);
        }
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      // If JSON parsing fails, delete the bad value so we recover
      console.error(`Failed to get ${key} from storage:`, error);
      try {
        this.mmkv.remove(key);
      } catch {}
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      // Prevent storing undefined (JSON.stringify(undefined) => undefined)
      // Also prevents storing functions/symbols etc that serialize to undefined.
      const json = JSON.stringify(value);

      if (json === undefined) {
        // safest behavior: remove the key (or just return)
        this.mmkv.remove(key);
        return;
      }

      this.mmkv.set(key, json);
    } catch (error) {
      console.error(`Failed to set ${key} in storage:`, error);
    }
  }

  getString(key: string): string | undefined {
    const v = this.mmkv.getString(key);
    if (v === 'undefined' || v === 'null') {
      this.mmkv.remove(key);
      return undefined;
    }
    return v;
  }

  setString(key: string, value: string): void {
    // guard against accidental "undefined" strings being stored
    if (value === 'undefined' || value === 'null') {
      this.mmkv.remove(key);
      return;
    }
    this.mmkv.set(key, value);
  }

  getNumber(key: string): number | undefined {
    return this.mmkv.getNumber(key);
  }

  setNumber(key: string, value: number): void {
    this.mmkv.set(key, value);
  }

  getBoolean(key: string): boolean | undefined {
    return this.mmkv.getBoolean(key);
  }

  setBoolean(key: string, value: boolean): void {
    this.mmkv.set(key, value);
  }

  contains(key: string): boolean {
    return this.mmkv.contains(key);
  }

  delete(key: string): void {
    this.mmkv.remove(key);
  }

  clearAll(): void {
    this.mmkv.clearAll();
  }

  getAllKeys(): string[] {
    return this.mmkv.getAllKeys();
  }
}

// ============================================================================
// CACHE WITH TTL SUPPORT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // ms
}

export class CacheService {
  constructor(private storage: StorageService) {}

  set<T>(key: string, value: T, ttlMs: number): void {
    // Never cache undefined; it leads to corrupted storage and weird runtime states
    if (value === (undefined as any)) {
      this.storage.delete(key);
      return;
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: Math.max(0, ttlMs),
    };

    this.storage.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.storage.get<CacheEntry<T>>(key);
    if (!entry) return null;

    // Validate shape (protect against partially-written entries)
    if (
      typeof entry.timestamp !== 'number' ||
      typeof entry.ttl !== 'number' ||
      !isFinite(entry.timestamp) ||
      !isFinite(entry.ttl)
    ) {
      this.storage.delete(key);
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.storage.delete(key);
      return null;
    }

    // If data is missing (e.g. older corrupted write), treat as cache miss
    if ((entry as any).data === undefined) {
      this.storage.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(key: string): void {
    this.storage.delete(key);
  }

  clearExpired(): void {
    const keys = this.storage.getAllKeys();
    const now = Date.now();

    keys.forEach((key) => {
      const entry = this.storage.get<CacheEntry<any>>(key);
      if (entry && typeof entry.timestamp === 'number' && typeof entry.ttl === 'number') {
        if (now - entry.timestamp > entry.ttl) {
          this.storage.delete(key);
        }
      }
    });
  }
}

// ============================================================================
// EXPORTED INSTANCES
// ============================================================================

export const defaultStorage = new StorageService(storage);
export const cache = new CacheService(new StorageService(cacheStorage));
export const userStorageService = new StorageService(userStorage);

// ============================================================================
// CONSTANTS
// ============================================================================

export const TTL = {
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// MIGRATION FROM ASYNCSTORAGE (optional)
// ============================================================================

export async function migrateFromAsyncStorage(
  AsyncStorage: any,
  keysToMigrate: string[]
): Promise<void> {
  try {
    console.log('🔄 Starting AsyncStorage → MMKV migration...');

    for (const key of keysToMigrate) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          defaultStorage.setString(key, value);
          await AsyncStorage.removeItem(key);
          console.log(`✅ Migrated: ${key}`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate ${key}:`, error);
      }
    }

    console.log('✅ AsyncStorage → MMKV migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}
