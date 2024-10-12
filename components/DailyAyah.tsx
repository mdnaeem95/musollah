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
    const { isDarkMode } = useContext(ThemeContext);
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
        router.push(`/quran/surah/${ayah.surahNumber}`);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleAyahClick} style={[styles.ayahCard, {backgroundColor: isDarkMode ? "#ECDFCC" : "#FFFFFF"}]}>
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
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  arabicText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#000',
  },
  englishText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#333',
    marginTop: 10,
  },
  ayahInfo: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default DailyAyah;
