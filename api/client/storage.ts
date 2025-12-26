/**
 * Storage Client - Infrastructure Layer with Structured Logging
 * 
 * Provides MMKV-based storage with TTL support, corruption recovery,
 * and comprehensive logging for cache performance monitoring
 * 
 * @version 3.0 - Structured Logging Migration
 */

import { createMMKV, type MMKV } from 'react-native-mmkv';
import { logger } from '../../services/logging/logger';

// ============================================================================
// STORAGE INSTANCES (MMKV v4)
// ============================================================================

logger.debug('Creating MMKV storage instances', {
  instances: ['default', 'cache', 'user'],
  operation: 'mmkv-init',
});

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

logger.success('MMKV storage instances created', {
  instances: ['default (encrypted)', 'cache', 'user'],
  operation: 'mmkv-init',
});

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export class StorageService {
  constructor(private mmkv: MMKV) {}

  /**
   * Get value from storage with JSON parsing and corruption recovery
   */
  get<T>(key: string): T | null {
    const getStart = Date.now();
    
    try {
      const value = this.mmkv.getString(key);

      // Guard against missing or corrupted values
      if (!value || value === 'undefined' || value === 'null') {
        if (value === 'undefined' || value === 'null') {
          // Clean up corrupted key so it doesn't keep crashing
          logger.warn('Corrupted storage value detected, removing', {
            key,
            corruptedValue: value,
            operation: 'storage-get',
          });
          
          this.mmkv.remove(key);
        }
        
        const getDuration = Date.now() - getStart;
        
        logger.debug('Storage get: key not found', {
          key,
          getDuration: `${getDuration}ms`,
          operation: 'storage-get',
        });
        
        return null;
      }

      const parsed = JSON.parse(value) as T;
      const getDuration = Date.now() - getStart;
      
      logger.debug('Storage get: success', {
        key,
        valueSize: value.length,
        getDuration: `${getDuration}ms`,
        operation: 'storage-get',
      });
      
      return parsed;
      
    } catch (error) {
      const getDuration = Date.now() - getStart;
      
      // If JSON parsing fails, delete the bad value so we recover
      logger.error('Failed to parse storage value, removing corrupted data', {
        key,
        error: error instanceof Error ? error.message : String(error),
        getDuration: `${getDuration}ms`,
        operation: 'storage-get',
      });
      
      try {
        this.mmkv.remove(key);
      } catch {}
      
      return null;
    }
  }

  /**
   * Set value in storage with JSON serialization
   */
  set<T>(key: string, value: T): void {
    const setStart = Date.now();
    
    try {
      // Prevent storing undefined (JSON.stringify(undefined) => undefined)
      // Also prevents storing functions/symbols etc that serialize to undefined.
      const json = JSON.stringify(value);

      if (json === undefined) {
        logger.warn('Attempted to store undefined value, removing key instead', {
          key,
          operation: 'storage-set',
        });
        
        // safest behavior: remove the key (or just return)
        this.mmkv.remove(key);
        return;
      }

      this.mmkv.set(key, json);
      const setDuration = Date.now() - setStart;
      
      logger.debug('Storage set: success', {
        key,
        valueSize: json.length,
        setDuration: `${setDuration}ms`,
        operation: 'storage-set',
      });
      
    } catch (error) {
      const setDuration = Date.now() - setStart;
      
      logger.error('Failed to set storage value', {
        key,
        error: error instanceof Error ? error.message : String(error),
        setDuration: `${setDuration}ms`,
        operation: 'storage-set',
      });
    }
  }

  /**
   * Get string value with corruption recovery
   */
  getString(key: string): string | undefined {
    const v = this.mmkv.getString(key);
    
    if (v === 'undefined' || v === 'null') {
      logger.warn('Corrupted string value detected, removing', {
        key,
        corruptedValue: v,
        operation: 'storage-get-string',
      });
      
      this.mmkv.remove(key);
      return undefined;
    }
    
    if (v !== undefined) {
      logger.debug('Storage getString: success', {
        key,
        valueLength: v.length,
        operation: 'storage-get-string',
      });
    }
    
    return v;
  }

  /**
   * Set string value with validation
   */
  setString(key: string, value: string): void {
    // guard against accidental "undefined" strings being stored
    if (value === 'undefined' || value === 'null') {
      logger.warn('Attempted to store invalid string literal, removing key', {
        key,
        invalidValue: value,
        operation: 'storage-set-string',
      });
      
      this.mmkv.remove(key);
      return;
    }
    
    this.mmkv.set(key, value);
    
    logger.debug('Storage setString: success', {
      key,
      valueLength: value.length,
      operation: 'storage-set-string',
    });
  }

  /**
   * Get number value
   */
  getNumber(key: string): number | undefined {
    const value = this.mmkv.getNumber(key);
    
    if (value !== undefined) {
      logger.debug('Storage getNumber: success', {
        key,
        value,
        operation: 'storage-get-number',
      });
    }
    
    return value;
  }

  /**
   * Set number value
   */
  setNumber(key: string, value: number): void {
    this.mmkv.set(key, value);
    
    logger.debug('Storage setNumber: success', {
      key,
      value,
      operation: 'storage-set-number',
    });
  }

  /**
   * Get boolean value
   */
  getBoolean(key: string): boolean | undefined {
    const value = this.mmkv.getBoolean(key);
    
    if (value !== undefined) {
      logger.debug('Storage getBoolean: success', {
        key,
        value,
        operation: 'storage-get-boolean',
      });
    }
    
    return value;
  }

  /**
   * Set boolean value
   */
  setBoolean(key: string, value: boolean): void {
    this.mmkv.set(key, value);
    
    logger.debug('Storage setBoolean: success', {
      key,
      value,
      operation: 'storage-set-boolean',
    });
  }

  /**
   * Check if key exists
   */
  contains(key: string): boolean {
    return this.mmkv.contains(key);
  }

  /**
   * Delete key from storage
   */
  delete(key: string): void {
    const exists = this.mmkv.contains(key);
    this.mmkv.remove(key);
    
    logger.debug('Storage delete', {
      key,
      existed: exists,
      operation: 'storage-delete',
    });
  }

  /**
   * Clear all storage
   */
  clearAll(): void {
    const keysBefore = this.mmkv.getAllKeys().length;
    this.mmkv.clearAll();
    
    logger.warn('Storage cleared all data', {
      keysRemoved: keysBefore,
      operation: 'storage-clear-all',
    });
  }

  /**
   * Get all storage keys
   */
  getAllKeys(): string[] {
    const keys = this.mmkv.getAllKeys();
    
    logger.debug('Storage getAllKeys', {
      keyCount: keys.length,
      operation: 'storage-get-all-keys',
    });
    
    return keys;
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

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const setStart = Date.now();
    
    // Never cache undefined; it leads to corrupted storage and weird runtime states
    if (value === (undefined as any)) {
      logger.warn('Attempted to cache undefined value, deleting key instead', {
        key,
        operation: 'cache-set',
      });
      
      this.storage.delete(key);
      return;
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: Math.max(0, ttlMs),
    };

    this.storage.set(key, entry);
    const setDuration = Date.now() - setStart;
    
    logger.debug('Cache set: entry stored', {
      key,
      ttl: `${ttlMs}ms`,
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      setDuration: `${setDuration}ms`,
      operation: 'cache-set',
    });
  }

  /**
   * Get cache entry with TTL validation
   */
  get<T>(key: string): T | null {
    const getStart = Date.now();
    const entry = this.storage.get<CacheEntry<T>>(key);
    
    if (!entry) {
      const getDuration = Date.now() - getStart;
      
      logger.debug('Cache get: miss (key not found)', {
        key,
        getDuration: `${getDuration}ms`,
        cacheHit: false,
        operation: 'cache-get',
      });
      
      return null;
    }

    // Validate shape (protect against partially-written entries)
    if (
      typeof entry.timestamp !== 'number' ||
      typeof entry.ttl !== 'number' ||
      !isFinite(entry.timestamp) ||
      !isFinite(entry.ttl)
    ) {
      logger.warn('Cache get: corrupted entry detected, removing', {
        key,
        hasTimestamp: typeof entry.timestamp === 'number',
        hasTTL: typeof entry.ttl === 'number',
        operation: 'cache-get',
      });
      
      this.storage.delete(key);
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const isExpired = age > entry.ttl;

    if (isExpired) {
      const getDuration = Date.now() - getStart;
      
      logger.debug('Cache get: miss (expired)', {
        key,
        age: `${age}ms`,
        ttl: `${entry.ttl}ms`,
        expiredBy: `${age - entry.ttl}ms`,
        getDuration: `${getDuration}ms`,
        cacheHit: false,
        operation: 'cache-get',
      });
      
      this.storage.delete(key);
      return null;
    }

    // If data is missing (e.g. older corrupted write), treat as cache miss
    if ((entry as any).data === undefined) {
      logger.warn('Cache get: entry missing data field, removing', {
        key,
        operation: 'cache-get',
      });
      
      this.storage.delete(key);
      return null;
    }

    const getDuration = Date.now() - getStart;
    const remainingTTL = entry.ttl - age;
    
    logger.success('Cache get: hit', {
      key,
      age: `${age}ms`,
      ttl: `${entry.ttl}ms`,
      remainingTTL: `${remainingTTL}ms`,
      ttlUsedPercent: `${((age / entry.ttl) * 100).toFixed(1)}%`,
      getDuration: `${getDuration}ms`,
      cacheHit: true,
      operation: 'cache-get',
    });

    return entry.data;
  }

  /**
   * Check if cache has valid entry for key
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear single cache entry
   */
  clear(key: string): void {
    logger.debug('Cache clear: removing entry', {
      key,
      operation: 'cache-clear',
    });
    
    this.storage.delete(key);
  }

  /**
   * Clear all expired cache entries
   */
  clearExpired(): void {
    const clearStart = Date.now();
    const keys = this.storage.getAllKeys();
    const now = Date.now();
    let removedCount = 0;
    let totalCount = 0;

    logger.debug('Cache clearExpired: starting cleanup', {
      totalKeys: keys.length,
      operation: 'cache-clear-expired',
    });

    keys.forEach((key) => {
      const entry = this.storage.get<CacheEntry<any>>(key);
      
      if (entry && typeof entry.timestamp === 'number' && typeof entry.ttl === 'number') {
        totalCount++;
        
        if (now - entry.timestamp > entry.ttl) {
          this.storage.delete(key);
          removedCount++;
        }
      }
    });

    const clearDuration = Date.now() - clearStart;
    
    logger.success('Cache clearExpired: cleanup completed', {
      totalCacheEntries: totalCount,
      expiredEntriesRemoved: removedCount,
      validEntriesRemaining: totalCount - removedCount,
      cleanupDuration: `${clearDuration}ms`,
      operation: 'cache-clear-expired',
    });
  }
}

// ============================================================================
// EXPORTED INSTANCES
// ============================================================================

logger.debug('Creating storage service instances', {
  operation: 'storage-services-init',
});

export const defaultStorage = new StorageService(storage);
export const cache = new CacheService(new StorageService(cacheStorage));
export const userStorageService = new StorageService(userStorage);

logger.success('Storage service instances created', {
  services: ['defaultStorage', 'cache', 'userStorageService'],
  operation: 'storage-services-init',
});

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

logger.debug('TTL constants defined', {
  FIVE_MINUTES: '5m',
  FIFTEEN_MINUTES: '15m',
  ONE_HOUR: '1h',
  ONE_DAY: '24h',
  ONE_WEEK: '7d',
  ONE_MONTH: '30d',
  operation: 'storage-constants',
});

// ============================================================================
// MIGRATION FROM ASYNCSTORAGE (optional)
// ============================================================================

/**
 * Migrate data from AsyncStorage to MMKV
 */
export async function migrateFromAsyncStorage(
  AsyncStorage: any,
  keysToMigrate: string[]
): Promise<void> {
  const migrationStart = Date.now();
  
  logger.info('Starting AsyncStorage to MMKV migration', {
    keysToMigrate: keysToMigrate.length,
    operation: 'storage-migration',
  });

  let successCount = 0;
  let failureCount = 0;

  try {
    for (const key of keysToMigrate) {
      const keyStart = Date.now();
      
      try {
        const value = await AsyncStorage.getItem(key);
        
        if (value !== null) {
          defaultStorage.setString(key, value);
          await AsyncStorage.removeItem(key);
          
          const keyDuration = Date.now() - keyStart;
          successCount++;
          
          logger.debug('Migration: key migrated', {
            key,
            valueSize: value.length,
            duration: `${keyDuration}ms`,
            operation: 'storage-migration',
          });
        }
      } catch (error) {
        failureCount++;
        
        logger.error('Migration: failed to migrate key', {
          key,
          error: error instanceof Error ? error.message : String(error),
          operation: 'storage-migration',
        });
      }
    }

    const migrationDuration = Date.now() - migrationStart;
    
    logger.success('AsyncStorage to MMKV migration completed', {
      totalKeys: keysToMigrate.length,
      successCount,
      failureCount,
      migrationDuration: `${migrationDuration}ms`,
      operation: 'storage-migration',
    });
    
  } catch (error) {
    const migrationDuration = Date.now() - migrationStart;
    
    logger.error('AsyncStorage migration failed', {
      error: error instanceof Error ? error.message : String(error),
      successCount,
      failureCount,
      migrationDuration: `${migrationDuration}ms`,
      operation: 'storage-migration',
    });
  }
}