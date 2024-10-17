import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';

const GOLD_API_URL = 'https://api.metalpriceapi.com/v1/latest';
const API_KEY = 'ac71d0fa4cfd6f4733484d2a30af6184';
const OUNCES_TO_GRAMS = 31.1035;

// Function to get today's date as 'YYYY-MM-DD'
const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

// Function to check Firestore for today's price and timestamp
const getGoldPriceFromFirestore = async () => {
  const todayDate = getTodayDate();
  const goldPriceDoc = await firestore().collection('goldPrice').doc(todayDate).get();

  if (goldPriceDoc.exists) {
    const data = goldPriceDoc.data();
    console.log('Fetched from Firesotre: ', data);
    return {
      pricePerGram: data?.pricePerGram,
      timestamp: data?.timestamp,
    };
  } else {
    console.log('No document found in Firestore for today');
    return null;
  }
};

// Function to store gold price and timestamp in Firestore
const storeGoldPriceInFirestore = async (pricePerGram: any, timestamp: any) => {
  const todayDate = getTodayDate();
  await firestore().collection('goldPrice').doc(todayDate).set({
    pricePerGram,
    timestamp,
  });
};

// Function to fetch gold price from the API and convert to grams
const fetchGoldPriceFromAPI = async () => {
  try {
    const response = await axios.get(GOLD_API_URL, {
      params: {
        api_key: API_KEY,
        base: 'XAU',
        currencies: 'SGD',
      },
    });

    const pricePerOunce = response.data.rates.SGD;
    const pricePerGram = (pricePerOunce / OUNCES_TO_GRAMS).toFixed(2); // Convert to grams
    const timestamp = new Date().toISOString(); // Record the current timestamp
    return { pricePerGram, timestamp };
  } catch (error) {
    console.error('Failed to fetch gold price from API:', error);
    throw error;
  }
};

// Main function to get today's gold price and timestamp
export const getGoldPrice = async () => {
  const todayDate = getTodayDate();

  // Check local cache (AsyncStorage)
  const cachedPriceData = await AsyncStorage.getItem(`goldPrice_${todayDate}`);
  if (cachedPriceData) {
    console.log('Fetched from AsyncStorage: ', JSON.parse(cachedPriceData));
    return JSON.parse(cachedPriceData);
  }

  // Check Firestore for today's price and timestamp
  const firestoreData = await getGoldPriceFromFirestore();
  if (firestoreData) {
    // Cache the price and timestamp in AsyncStorage for future use
    console.log('Fetched from Firestore: ', firestoreData);
    await AsyncStorage.setItem(`goldPrice_${todayDate}`, JSON.stringify(firestoreData));
    return firestoreData;
  }

  // Fetch from API if not found in Firestore
  const { pricePerGram, timestamp } = await fetchGoldPriceFromAPI();

  // Store in Firestore and cache in AsyncStorage
  const priceData = { pricePerGram, timestamp };
  await storeGoldPriceInFirestore(pricePerGram, timestamp);
  await AsyncStorage.setItem(`goldPrice_${todayDate}`, JSON.stringify(priceData));

  return priceData;
};
