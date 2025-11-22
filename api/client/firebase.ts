import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

firestore().settings({
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  persistence: true,
});

export const db = firestore();
export const authService = auth();
export const storageService = storage();
export const analyticsService = analytics();
export const crashlyticsService = crashlytics();

export function getCollection<T = any>(collectionPath: string) {
  return db.collection(collectionPath) as FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData>;
}

export function getDocument<T = any>(collectionPath: string, docId: string) {
  return db.collection(collectionPath).doc(docId) as FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
}

export function createBatch() {
  return db.batch();
}

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