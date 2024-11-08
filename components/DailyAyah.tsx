import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router'; // Assuming utility function for random Ayah
import { RootState } from '../redux/store/store';
import { getRandomAyah } from '../utils';
import { ThemeContext } from '../context/ThemeContext';

// Define constants for storage keys
const AYAH_KEY = 'dailyAyah';
const TIMESTAMP_KEY = 'dailyAyahTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const DailyAyah = () => {
    const [ayah, setAyah] = useState<any>(null);
    const router = useRouter();

    // Fetch the Quran Surah data from Redux
    const surahs = useSelector((state: RootState) => state.quran.surahs);

    useEffect(() => {
        const fetchDailyAyah = async () => {
        // Check local storage for cached Ayah and timestamp
        const cachedAyah = await AsyncStorage.getItem(AYAH_KEY);
        const cachedTimestamp = await AsyncStorage.getItem(TIMESTAMP_KEY);

        const currentTime = Date.now();

        if (cachedAyah && cachedTimestamp) {
            const lastFetchedTime = parseInt(cachedTimestamp, 10);

            // If the cached Ayah is less than 24 hours old, use it
            if (currentTime - lastFetchedTime < CACHE_DURATION) {
            setAyah(JSON.parse(cachedAyah));
            return;
            }
        }

        // If no valid cached Ayah, select a new one and cache it
        const randomAyah = getRandomAyah();
        const surah = surahs.find((s: any) => s.number === randomAyah.surahNumber);

        if (surah) {
            // Split the `arabicText` and `englishTranslation` fields by the '|' delimiter
            const arabicAyahs = surah.arabicText.split('|');
            const englishAyahs = surah.englishTranslation.split('|');

            // Get the specific Ayah
            const arabicAyah = arabicAyahs[randomAyah.ayahNumber - 1]; // Adjust for 0-based index
            const englishAyah = englishAyahs[randomAyah.ayahNumber - 1]; // Adjust for 0-based index

            const selectedAyah = {
            arabicText: arabicAyah,
            englishText: englishAyah,
            surahNumber: randomAyah.surahNumber,
            ayahNumber: randomAyah.ayahNumber,
            };

            // Store the selected Ayah and current timestamp
            await AsyncStorage.setItem(AYAH_KEY, JSON.stringify(selectedAyah));
            await AsyncStorage.setItem(TIMESTAMP_KEY, currentTime.toString());

            // Set the Ayah state
            setAyah(selectedAyah);
        }
        };

        fetchDailyAyah();
    }, [surahs]);

    if (!ayah) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    const handleAyahClick = () => {
        router.push({
          pathname: `/surahs/${ayah.surahNumber}`,
          params: { ayahIndex: ayah.ayahNumber }
        });
    };

    return (
      <View style={styles.ayahCard}>
        <Text style={styles.headerText}>Ayat of the Day</Text>
        <TouchableOpacity onPress={handleAyahClick} style={styles.ayahContent}>
          <Text style={styles.arabicText}>{ayah.arabicText}</Text>
          <Text style={styles.englishText}>"{ayah.englishText}"</Text>
          <Text style={styles.ayahInfo}>
            Surah {ayah.surahNumber}, Ayah {ayah.ayahNumber}
          </Text>
        </TouchableOpacity>
      </View>
    );
};

const styles = StyleSheet.create({
  ayahCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, // For Android shadow
    marginVertical: 20, // Ensure it has space when placed on the page
  },
  ayahContent: {
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#333333', // Light gold for contrast
    textAlign: 'center',
    marginBottom: 10,
},
  arabicText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 24,
    lineHeight: 48,
    textAlign: 'center',
    color: '#000000',
  },
  englishText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#555555',
    marginTop: 12,
  },
  ayahInfo: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#666666',
    textAlign: 'center',
  },
});

export default DailyAyah;
