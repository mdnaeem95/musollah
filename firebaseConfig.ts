import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth'
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASEAPIKEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASEAUTHDOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASEDATABASEURL,
    projectId: process.env.EXPO_PUBLIC_FIREBASEPROJECTID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASESTORAGEBUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASEMESSAGINGSENDERID,
    appId: process.env.EXPO_PUBLIC_FIREBASEAPPID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASEMEASUREMENTID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { db, auth };