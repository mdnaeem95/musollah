/**
 * Firebase Client - Infrastructure Layer with Structured Logging
 * 
 * Provides Firebase services (Firestore, Auth, Storage, Analytics, Crashlytics)
 * with comprehensive logging for observability
 * 
 * @version 3.0 - Structured Logging Migration
 */

import { getApp } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore'
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { collection, doc, getFirestore, initializeFirestore, runTransaction, writeBatch, serverTimestamp,
  increment, arrayUnion, arrayRemove, deleteField, Timestamp } from '@react-native-firebase/firestore';
import { onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import { getAuth } from '@react-native-firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@react-native-firebase/storage';

// Analytics modular functions exist even if older docs show namespaced usage
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';

// Crashlytics modular API is documented via type declarations in the migration guide
import { getCrashlytics, recordError, setUserId, log } from '@react-native-firebase/crashlytics';
import { logger } from '../../services/logging/logger';

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

const initStart = Date.now();

logger.debug('Initializing Firebase app', {
  operation: 'firebase-init',
});

const app = getApp();

// Must run before first Firestore usage
const firestoreInitStart = Date.now();
initializeFirestore(app, {
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  persistence: true,
});
const firestoreInitDuration = Date.now() - firestoreInitStart;

logger.success('Firestore initialized with persistence', {
  cacheSizeBytes: 'UNLIMITED',
  persistence: true,
  initDuration: `${firestoreInitDuration}ms`,
  operation: 'firestore-init',
});

const initDuration = Date.now() - initStart;

logger.success('Firebase services initialized', {
  totalDuration: `${initDuration}ms`,
  services: ['Firestore', 'Auth', 'Storage', 'Analytics', 'Crashlytics'],
  operation: 'firebase-init',
});

export const db = getFirestore(app);
export const authService = getAuth(app);
export const storageService = getStorage(app);
export const analyticsService = getAnalytics(app);
export const crashlyticsService = getCrashlytics();

// ============================================================================
// Firestore helpers (modular)
// ============================================================================

/**
 * Get Firestore collection reference with type safety
 */
export function getCollection<
  T extends FirebaseFirestoreTypes.DocumentData = FirebaseFirestoreTypes.DocumentData
>(collectionPath: string) {
  logger.debug('Getting Firestore collection reference', {
    collectionPath,
    operation: 'firestore-collection-ref',
  });
  
  return collection(db, collectionPath) as unknown as FirebaseFirestoreTypes.CollectionReference<T>;
}

/**
 * Get Firestore document reference with type safety
 */
export function getDocument<
  T extends FirebaseFirestoreTypes.DocumentData = FirebaseFirestoreTypes.DocumentData
>(collectionPath: string, docId: string) {
  logger.debug('Getting Firestore document reference', {
    collectionPath,
    docId: docId.substring(0, 8) + '...',
    operation: 'firestore-doc-ref',
  });
  
  return doc(db, collectionPath, docId) as unknown as FirebaseFirestoreTypes.DocumentReference<T>;
}

/**
 * Create Firestore batch write
 */
export function createBatch() {
  logger.debug('Creating Firestore batch write', {
    operation: 'firestore-batch',
  });
  
  return writeBatch(db);
}

/**
 * Run Firestore transaction
 */
export function runFirestoreTransaction<T>(
  updateFn: (tx: FirebaseFirestoreTypes.Transaction) => Promise<T>,
) {
  const txStart = Date.now();
  
  logger.debug('Starting Firestore transaction', {
    operation: 'firestore-transaction',
  });
  
  return runTransaction(db, updateFn as any)
    .then((result) => {
      const txDuration = Date.now() - txStart;
      
      logger.success('Firestore transaction completed', {
        duration: `${txDuration}ms`,
        operation: 'firestore-transaction',
      });
      
      return result as T;
    })
    .catch((error) => {
      const txDuration = Date.now() - txStart;
      
      logger.error('Firestore transaction failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: `${txDuration}ms`,
        operation: 'firestore-transaction',
      });
      
      throw error;
    });
}

// ============================================================================
// Timestamp / FieldValue replacements (recommended)
// ============================================================================

export { Timestamp, serverTimestamp, increment, arrayUnion, arrayRemove, deleteField };

// ============================================================================
// Storage helpers
// ============================================================================

/**
 * Upload review image to Firebase Storage
 * Returns download URL or null on failure
 */
export const uploadReviewImage = async (
  localUri: string,
  restaurantId: string
): Promise<string | null> => {
  const uploadStart = Date.now();
  
  logger.debug('Starting review image upload', {
    restaurantId: restaurantId.substring(0, 8) + '...',
    localUri: localUri.substring(0, 50) + '...',
    operation: 'storage-upload',
  });
  
  try {
    // Generate unique filename
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storagePath = `restaurants/${restaurantId}/reviews/${filename}`;
    
    logger.debug('Generated storage path', {
      filename,
      storagePath,
      operation: 'storage-upload',
    });
    
    // Create storage reference
    const storageRef = ref(storageService, storagePath);
    
    // Fetch the file as blob
    const fetchStart = Date.now();
    const response = await fetch(localUri);
    const blob = await response.blob();
    const fetchDuration = Date.now() - fetchStart;
    const blobSize = blob.size;
    
    logger.debug('Image converted to blob', {
      blobSize: `${(blobSize / 1024).toFixed(2)}KB`,
      fetchDuration: `${fetchDuration}ms`,
      operation: 'storage-upload',
    });
    
    // Upload to Firebase Storage
    const uploadBytesStart = Date.now();
    await uploadBytes(storageRef, blob);
    const uploadBytesDuration = Date.now() - uploadBytesStart;
    
    logger.debug('Image uploaded to storage', {
      uploadBytesDuration: `${uploadBytesDuration}ms`,
      blobSize: `${(blobSize / 1024).toFixed(2)}KB`,
      uploadSpeed: `${((blobSize / 1024) / (uploadBytesDuration / 1000)).toFixed(2)}KB/s`,
      operation: 'storage-upload',
    });
    
    // Get download URL
    const urlStart = Date.now();
    const downloadURL = await getDownloadURL(storageRef);
    const urlDuration = Date.now() - urlStart;
    
    const totalDuration = Date.now() - uploadStart;
    
    logger.success('Review image upload completed', {
      restaurantId: restaurantId.substring(0, 8) + '...',
      filename,
      downloadURL: downloadURL.substring(0, 80) + '...',
      blobSize: `${(blobSize / 1024).toFixed(2)}KB`,
      fetchDuration: `${fetchDuration}ms`,
      uploadBytesDuration: `${uploadBytesDuration}ms`,
      urlDuration: `${urlDuration}ms`,
      totalDuration: `${totalDuration}ms`,
      operation: 'storage-upload',
    });
    
    return downloadURL;
    
  } catch (error) {
    const totalDuration = Date.now() - uploadStart;
    
    logger.error('Failed to upload review image', {
      restaurantId: restaurantId.substring(0, 8) + '...',
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${totalDuration}ms`,
      operation: 'storage-upload',
    });
    
    return null;
  }
};

// ============================================================================
// Analytics helpers (modular)
// ============================================================================

/**
 * Log analytics event with error handling
 */
export const logAnalyticsEvent = async (eventName: string, params?: Record<string, any>) => {
  const logStart = Date.now();
  
  logger.debug('Logging analytics event', {
    eventName,
    params: params ? Object.keys(params) : [],
    operation: 'analytics-log',
  });
  
  try {
    await logEvent(analyticsService, eventName as any, params as any);
    const logDuration = Date.now() - logStart;
    
    logger.success('Analytics event logged', {
      eventName,
      paramCount: params ? Object.keys(params).length : 0,
      logDuration: `${logDuration}ms`,
      operation: 'analytics-log',
    });
    
  } catch (error) {
    const logDuration = Date.now() - logStart;
    
    logger.error('Failed to log analytics event', {
      eventName,
      error: error instanceof Error ? error.message : String(error),
      logDuration: `${logDuration}ms`,
      operation: 'analytics-log',
    });
  }
};

// ============================================================================
// Crashlytics helpers (modular)
// ============================================================================

/**
 * Log error to Crashlytics
 */
export const logError = (error: Error, context?: string) => {
  logger.error('Recording error to Crashlytics', {
    errorMessage: error.message,
    errorName: error.name,
    context,
    stack: error.stack?.substring(0, 200) + '...',
    operation: 'crashlytics-error',
  });
  
  recordError(crashlyticsService, error);
};

/**
 * Set Crashlytics user ID for crash attribution
 */
export const setCrashlyticsUserId = (userId: string) => {
  logger.debug('Setting Crashlytics user ID', {
    userId: userId.substring(0, 8) + '...',
    operation: 'crashlytics-user',
  });
  
  setUserId(crashlyticsService, userId);
};

/**
 * Log custom message to Crashlytics
 */
export const crashLog = (message: string) => {
  logger.debug('Logging to Crashlytics', {
    message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    messageLength: message.length,
    operation: 'crashlytics-log',
  });
  
  log(crashlyticsService, message);
};

export { onAuthStateChanged, signOut };