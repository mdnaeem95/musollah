import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './storage';

interface MigrationProgress {
  totalKeys: number;
  migratedKeys: number;
  failedKeys: string[];
  startTime: number;
  endTime?: number;
}

export const migrateFromAsyncStorage = async (
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> => {
  console.log('🔄 Starting AsyncStorage to MMKV migration...');
  
  const progress: MigrationProgress = {
    totalKeys: 0,
    migratedKeys: 0,
    failedKeys: [],
    startTime: Date.now()
  };

  // Check if migration already completed
  const migrationCompleted = storage.getBoolean('migration_completed_v2');
  if (migrationCompleted) {
    console.log('✅ Migration already completed');
    progress.endTime = Date.now();
    return progress;
  }

  try {
    // Get all keys from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    progress.totalKeys = keys.length;
    console.log(`📦 Found ${keys.length} keys to migrate`);

    // Skip system keys that shouldn't be migrated
    const keysToMigrate = keys.filter(key => 
      !key.startsWith('persist:') && // Redux persist internal keys
      !key.startsWith('expo-') // Expo internal keys
    );

    // Batch migrate data for better performance
    const batchSize = 10;
    for (let i = 0; i < keysToMigrate.length; i += batchSize) {
      const batch = keysToMigrate.slice(i, i + batchSize);
      
      try {
        const data = await AsyncStorage.multiGet(batch);
        
        // Migrate each key-value pair
        for (const [key, value] of data) {
          if (value !== null) {
            try {
              // Handle different data types
              if (key.includes('preferences') || key.includes('settings')) {
                // These are likely JSON objects
                storage.set(key, value);
              } else if (value === 'true' || value === 'false') {
                // Boolean values
                storage.set(key, value === 'true');
              } else if (!isNaN(Number(value))) {
                // Numeric values
                storage.set(key, Number(value));
              } else {
                // Default to string
                storage.set(key, value);
              }
              progress.migratedKeys++;
            } catch (error) {
              console.error(`Failed to migrate key ${key}:`, error);
              progress.failedKeys.push(key);
            }
          }
        }
        
        // Report progress
        if (onProgress) {
          onProgress(progress);
        }
        
        console.log(`📊 Migrated ${Math.min(i + batchSize, keysToMigrate.length)}/${keysToMigrate.length} items`);
      } catch (batchError) {
        console.error('Batch migration error:', batchError);
        // Continue with next batch
      }
    }

    // Migrate Redux persist data separately (it needs special handling)
    await migrateReduxPersist(keys);

    // Mark migration as completed
    storage.set('migration_completed_v2', true);
    storage.set('migration_date', new Date().toISOString());
    
    progress.endTime = Date.now();
    const migrationTime = progress.endTime - progress.startTime;
    
    console.log(`✅ Migration completed in ${migrationTime}ms`);
    console.log(`📊 Successfully migrated ${progress.migratedKeys}/${progress.totalKeys} keys`);
    
    if (progress.failedKeys.length > 0) {
      console.warn(`⚠️ Failed to migrate ${progress.failedKeys.length} keys:`, progress.failedKeys);
    }

    // Optional: Clear AsyncStorage after successful migration
    // Uncomment this after testing to free up space
    // await AsyncStorage.clear();
    
    return progress;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    progress.endTime = Date.now();
    throw error;
  }
};

// Special handling for Redux persist data
async function migrateReduxPersist(allKeys: readonly string[]): Promise<void> {
  const persistKeys = allKeys.filter(key => key.startsWith('persist:'));
  
  for (const key of persistKeys) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        storage.set(key, value);
      }
    } catch (error) {
      console.error(`Failed to migrate Redux persist key ${key}:`, error);
    }
  }
}