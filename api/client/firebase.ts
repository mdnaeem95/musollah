/**
 * Firebase Client
 * 
 * React Native Firebase is pre-initialized via native configuration.
 * No manual initialization required - just import and use the modules.
 * 
 * This file provides typed, ready-to-use Firebase service instances.
 */

import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

// ============================================================================
// FIRESTORE CONFIGURATION
// ============================================================================

// Enable offline persistence and multi-tab support
firestore().settings({
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  persistence: true,
});

// ============================================================================
// EXPORTS
// ============================================================================

export const db = firestore();
export const authService = auth();
export const storageService = storage();
export const analyticsService = analytics();
export const crashlyticsService = crashlytics();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a Firestore collection reference with type safety
 */
export function getCollection<T = any>(collectionPath: string) {
  return db.collection(collectionPath) as FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData>;
}

/**
 * Get a Firestore document reference with type safety
 */
export function getDocument<T = any>(collectionPath: string, docId: string) {
  return db.collection(collectionPath).doc(docId) as FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
}

/**
 * Batch write helper
 */
export function createBatch() {
  return db.batch();
}

/**
 * Transaction helper
 */
export function runTransaction<T>(
  updateFunction: (transaction: FirebaseFirestoreTypes.Transaction) => Promise<T>
) {
  return db.runTransaction(updateFunction);
}

// ============================================================================
// FIRESTORE TYPES
// ============================================================================

export type FirestoreTimestamp = FirebaseFirestoreTypes.Timestamp;
export type FirestoreFieldValue = FirebaseFirestoreTypes.FieldValue;

// Export commonly used field values
export const FieldValue = firestore.FieldValue;
export const Timestamp = firestore.Timestamp;

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

export const logAnalyticsEvent = async (
  eventName: string,
  params?: { [key: string]: any }
) => {
  try {
    await analyticsService.logEvent(eventName, params);
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};

// ============================================================================
// CRASHLYTICS HELPERS
// ============================================================================

export const logError = (error: Error, context?: string) => {
  console.error(context ? `[${context}]` : '', error);
  crashlyticsService.recordError(error);
};

export const setUserId = (userId: string) => {
  crashlyticsService.setUserId(userId);
};

export const log = (message: string) => {
  crashlyticsService.log(message);
};