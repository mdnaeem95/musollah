import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { signInAnonymously, getReactNativePersistence, initializeAuth } from 'firebase/auth'
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_APIKEY,
    authDomain: process.env.FIREBASE_AUTHDOMAIN,
    databaseURL: process.env.FIREBASE_DATABASEURL,
    projectId: process.env.FIREBASE_PROJECTID,
    storageBucket: process.env.FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID,
    appId: process.env.FIREBASE_APPID,
    measurementId: process.env.FIREBASE_MEASUREMENTID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const signInAnonymouslyToFirebase = async () => {
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error('Error signing in anonymously', error);
    }
}

export { db, signInAnonymouslyToFirebase };