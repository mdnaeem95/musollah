import { storage } from './storage';

// Type-safe storage helpers
export const StorageHelpers = {
  // Store objects directly
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },
  
  getObject: <T>(key: string): T | null => {
    const value = storage.getString(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  // Store arrays
  setArray: <T>(key: string, value: T[]): void => {
    storage.set(key, JSON.stringify(value));
  },
  
  getArray: <T>(key: string): T[] => {
    const value = storage.getString(key);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  },

  // Store booleans
  setBoolean: (key: string, value: boolean): void => {
    storage.set(key, value);
  },
  
  getBoolean: (key: string, defaultValue = false): boolean => {
    return storage.getBoolean(key) ?? defaultValue;
  },

  // Store numbers
  setNumber: (key: string, value: number): void => {
    storage.set(key, value);
  },
  
  getNumber: (key: string, defaultValue = 0): number => {
    return storage.getNumber(key) ?? defaultValue;
  },

  // Encrypted storage for sensitive data
  setSecure: (key: string, value: string): void => {
    storage.set(`secure_${key}`, value);
  },
  
  getSecure: (key: string): string | undefined => {
    return storage.getString(`secure_${key}`);
  },

  // Check if key exists
  has: (key: string): boolean => {
    return storage.contains(key);
  },

  // Get all keys with prefix
  getKeysWithPrefix: (prefix: string): string[] => {
    return storage.getAllKeys().filter(key => key.startsWith(prefix));
  },

  // Batch operations
  batchSet: (items: Record<string, any>): void => {
    Object.entries(items).forEach(([key, value]) => {
      if (typeof value === 'string') {
        storage.set(key, value);
      } else if (typeof value === 'boolean') {
        storage.set(key, value);
      } else if (typeof value === 'number') {
        storage.set(key, value);
      } else {
        storage.set(key, JSON.stringify(value));
      }
    });
  },

  // Clear specific prefixed keys
  clearPrefix: (prefix: string): void => {
    const keys = storage.getAllKeys().filter(key => key.startsWith(prefix));
    keys.forEach(key => storage.delete(key));
  },

  // Get storage size info
  getStorageInfo: () => {
    const keys = storage.getAllKeys();
    let totalSize = 0;
    
    keys.forEach(key => {
      const value = storage.getString(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    });

    return {
      keyCount: keys.length,
      approximateSizeInBytes: totalSize,
      approximateSizeInMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }
};

// Export specific helpers for common use cases
export const PrayerStorage = {
  savePrayerTimes: (date: string, times: any) => {
    StorageHelpers.setObject(`prayer_times_${date}`, times);
    StorageHelpers.setNumber(`prayer_times_${date}_timestamp`, Date.now());
  },
  
  getPrayerTimes: (date: string) => {
    return StorageHelpers.getObject(`prayer_times_${date}`);
  },
  
  isPrayerTimesStale: (date: string, maxAgeHours = 24): boolean => {
    const timestamp = StorageHelpers.getNumber(`prayer_times_${date}_timestamp`);
    if (!timestamp) return true;
    
    const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
  }
};

export const UserStorage = {
  saveUserProfile: (profile: any) => {
    StorageHelpers.setSecure('user_profile', JSON.stringify(profile));
  },
  
  getUserProfile: () => {
    const profile = StorageHelpers.getSecure('user_profile');
    return profile ? JSON.parse(profile) : null;
  },
  
  saveAuthToken: (token: string) => {
    StorageHelpers.setSecure('auth_token', token);
  },
  
  getAuthToken: () => {
    return StorageHelpers.getSecure('auth_token');
  },
  
  clearUserData: () => {
    StorageHelpers.clearPrefix('secure_');
    StorageHelpers.clearPrefix('user_');
  }
};

export const QuranStorage = {
  saveBookmark: (surahId: number, ayahId: number) => {
    const bookmarks = StorageHelpers.getArray<any>('quran_bookmarks');
    bookmarks.push({ surahId, ayahId, timestamp: Date.now() });
    StorageHelpers.setArray('quran_bookmarks', bookmarks);
  },
  
  getBookmarks: () => {
    return StorageHelpers.getArray('quran_bookmarks');
  },
  
  saveLastRead: (surahId: number, ayahId: number) => {
    StorageHelpers.setObject('quran_last_read', { surahId, ayahId, timestamp: Date.now() });
  },
  
  getLastRead: () => {
    return StorageHelpers.getObject('quran_last_read');
  }
};