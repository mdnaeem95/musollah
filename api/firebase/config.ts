import { initializeApp, getApps, getApp } from '@react-native-firebase/app';
import firestoreModule, { getFirestore } from '@react-native-firebase/firestore';
import authModule, { getAuth } from '@react-native-firebase/auth';
import storageModule, { getStorage } from '@react-native-firebase/storage';
import analyticsModule, { getAnalytics } from '@react-native-firebase/analytics';
import crashlyticsModule, { getCrashlytics } from '@react-native-firebase/crashlytics';

let firebaseApp;
let firestore: ReturnType<typeof firestoreModule>;
let auth: ReturnType<typeof authModule>;
let storage: ReturnType<typeof storageModule>;
let analytics: ReturnType<typeof analyticsModule>;
let crashlytics: ReturnType<typeof crashlyticsModule>;

export async function initFirebase() {
  if (getApps().length === 0) {
    firebaseApp = await initializeApp({
      apiKey: process.env.EXPO_PUBLIC_FIREBASEAPIKEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASEAUTHDOMAIN,
      databaseURL: process.env.EXPO_PUBLIC_FIREBASEDATABASEURL,
      projectId: process.env.EXPO_PUBLIC_FIREBASEPROJECTID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASESTORAGEBUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASEMESSAGINGSENDERID,
      appId: process.env.EXPO_PUBLIC_FIREBASEAPPID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASEMEASUREMENTIDs,
    });
  } else {
    firebaseApp = getApp();
  }

  firestore = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
  storage = getStorage(firebaseApp);
  analytics = getAnalytics(firebaseApp);
  crashlytics = getCrashlytics();
}

// Export services after init
export { firebaseApp, firestore, auth, storage, analytics, crashlytics, getFirestore };
