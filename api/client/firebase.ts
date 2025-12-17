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

const app = getApp();

// Must run before first Firestore usage
initializeFirestore(app, {
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  persistence: true,
});

export const db = getFirestore(app);
export const authService = getAuth(app);
export const storageService = getStorage(app);
export const analyticsService = getAnalytics(app);
export const crashlyticsService = getCrashlytics();

// ---------------------------------------------------------------------------
// Firestore helpers (modular)
// ---------------------------------------------------------------------------

export function getCollection<
  T extends FirebaseFirestoreTypes.DocumentData = FirebaseFirestoreTypes.DocumentData
>(collectionPath: string) {
  return collection(db, collectionPath) as unknown as FirebaseFirestoreTypes.CollectionReference<T>;
}

export function getDocument<
  T extends FirebaseFirestoreTypes.DocumentData = FirebaseFirestoreTypes.DocumentData
>(collectionPath: string, docId: string) {
  return doc(db, collectionPath, docId) as unknown as FirebaseFirestoreTypes.DocumentReference<T>;
}

export function createBatch() {
  return writeBatch(db);
}

export function runFirestoreTransaction<T>(
  updateFn: (tx: FirebaseFirestoreTypes.Transaction) => Promise<T>,
) {
  return runTransaction(db, updateFn as any) as Promise<T>;
}

// ---------------------------------------------------------------------------
// Timestamp / FieldValue replacements (recommended)
// ---------------------------------------------------------------------------

export { Timestamp, serverTimestamp, increment, arrayUnion, arrayRemove, deleteField };

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

/**
 * Upload review image to Firebase Storage
 * Returns download URL or null on failure
 */
export const uploadReviewImage = async (
  localUri: string,
  restaurantId: string
): Promise<string | null> => {
  try {
    // Generate unique filename
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storagePath = `restaurants/${restaurantId}/reviews/${filename}`;
    
    // Create storage reference
    const storageRef = ref(storageService, storagePath);
    
    // Fetch the file as blob
    const response = await fetch(localUri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('✅ Image uploaded:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Failed to upload review image:', error);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Analytics helpers (modular)
// ---------------------------------------------------------------------------

export const logAnalyticsEvent = async (eventName: string, params?: Record<string, any>) => {
  try {
    await logEvent(analyticsService, eventName as any, params as any);
  } catch (e) {
    console.error('Failed to log analytics event:', e);
  }
};

// ---------------------------------------------------------------------------
// Crashlytics helpers (modular)
// ---------------------------------------------------------------------------

export const logError = (error: Error, context?: string) => {
  console.error(context ? `[${context}]` : '', error);
  recordError(crashlyticsService, error);
};

export const setCrashlyticsUserId = (userId: string) => {
  setUserId(crashlyticsService, userId);
};

export const crashLog = (message: string) => {
  log(crashlyticsService, message);
};

export { onAuthStateChanged, signOut };