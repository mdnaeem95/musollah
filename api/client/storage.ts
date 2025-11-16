/**
 * Storage Client - MMKV Wrapper
 * 
 * High-performance, synchronous key-value storage using MMKV.
 * 20-100x faster than AsyncStorage for most operations.
 * 
 * Features:
 * - Type-safe get/set operations
 * - JSON serialization/deserialization
 * - TTL support for cached data
 * - Namespace support for data isolation
 */

import { MMKV } from 'react-native-mmkv';

// ============================================================================
// STORAGE INSTANCES
// ============================================================================

// Default storage
export const storage = new MMKV({
  id: 'musollah-default',
  encryptionKey: 'musollah-secure-key', // Consider using a more secure key from env
});

// Cache storage with separate namespace
export const cacheStorage = new MMKV({
  id: 'musollah-cache',
});

// User-specific storage (cleared on logout)
export const userStorage = new MMKV({
  id: 'musollah-user',
});

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Storage wrapper with type safety and JSON serialization
 */
export class StorageService {
  constructor(private mmkv: MMKV) {}

  /**
   * Get a value from storage
   */
  get<T>(key: string): T | null {
    try {
      const value = this.mmkv.getString(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to get ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * Set a value in storage
   */
  set<T>(key: string, value: T): void {
    try {
      this.mmkv.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set ${key} in storage:`, error);
    }
  }

  /**
   * Get a string value directly (no JSON parsing)
   */
  getString(key: string): string | undefined {
    return this.mmkv.getString(key);
  }

  /**
   * Set a string value directly (no JSON serialization)
   */
  setString(key: string, value: string): void {
    this.mmkv.set(key, value);
  }

  /**
   * Get a number value directly
   */
  getNumber(key: string): number | undefined {
    return this.mmkv.getNumber(key);
  }

  /**
   * Set a number value directly
   */
  setNumber(key: string, value: number): void {
    this.mmkv.set(key, value);
  }

  /**
   * Get a boolean value directly
   */
  getBoolean(key: string): boolean | undefined {
    return this.mmkv.getBoolean(key);
  }

  /**
   * Set a boolean value directly
   */
  setBoolean(key: string, value: boolean): void {
    this.mmkv.set(key, value);
  }

  /**
   * Check if a key exists
   */
  contains(key: string): boolean {
    return this.mmkv.contains(key);
  }

  /**
   * Delete a key
   */
  delete(key: string): void {
    this.mmkv.delete(key);
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.mmkv.clearAll();
  }

  /**
   * Get all keys
   */
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
  ttl: number; // in milliseconds
}

/**
 * Cache service with TTL support
 */
export class CacheService {
  constructor(private storage: StorageService) {}

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    this.storage.set(key, entry);
  }

  /**
   * Get a value from cache (returns null if expired)
   */
  get<T>(key: string): T | null {
    const entry = this.storage.get<CacheEntry<T>>(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.storage.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a cached value exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear a specific cache entry
   */
  clear(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Clear all expired cache entries
   */
  clearExpired(): void {
    const keys = this.storage.getAllKeys();
    const now = Date.now();

    keys.forEach(key => {
      const entry = this.storage.get<CacheEntry<any>>(key);
      if (entry && now - entry.timestamp > entry.ttl) {
        this.storage.delete(key);
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
// MIGRATION FROM ASYNCSTORAGE (if needed)
// ============================================================================

/**
 * Helper to migrate from AsyncStorage to MMKV
 * Call this once during app initialization if you have existing AsyncStorage data
 */
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