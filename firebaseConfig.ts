import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { signInAnonymously, getReactNativePersistence, initializeAuth } from 'firebase/auth'
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyAK3a1Ln_jOL9tQun6JdKVJ86x2nakq06Y",
    authDomain: "musollah-15cfe.firebaseapp.com",
    databaseURL: "https://musollah-15cfe-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "musollah-15cfe",
    storageBucket: "musollah-15cfe.appspot.com",
    messagingSenderId: "188630836015",
    appId: "1:188630836015:web:d043b1963c498bd7e0b7da",
    measurementId: "G-DCV7NQ4PYZ"
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