import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router'; // Assuming utility function for random Ayah
import { RootState } from '../redux/store/store';
import { getRandomAyahByMood } from '../utils';
import { Dropdown } from 'react-native-element-dropdown';

// Define constants for storage keys
const MOOD_KEY = 'selectedMood';
const AYAH_KEY = 'dailyAyah';
const TIMESTAMP_KEY = 'dailyAyahTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const moods = [
  { label: 'Neutral', value: 'Neutral' },
  { label: 'Down', value: 'Down' },
  { label: 'Grateful', value: 'Grateful' },
  { label: 'Motivated', value: 'Motivated' },
  { label: 'Hopeful', value: 'Hopeful' },
  { label: 'Afraid', value: 'Afraid' },
  { label: 'Patient', value: 'Patient' },
];

const DailyAyah = () => {
  const [ayah, setAyah] = useState<any>({
    arabicText: '',
    englishText: '',
    surahNumber: 0,
    ayahNumber: 0,
  });
  const [mood, setMood] = useState<string>('Neutral');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSkeleton, setIsSkeleton] = useState<boolean>(false);
  const router = useRouter();

  // Fetch the Quran Surah data from Redux
  const surahs = useSelector((state: RootState) => state.quran.surahs);

  useEffect(() => {
    const fetchDailyAyah = async () => {
      setLoading(true)

      // Retrieve mood from storage or use default
      const storedMood = await AsyncStorage.getItem(MOOD_KEY);
      const currentMood = storedMood || mood;
      
      setMood(currentMood)

      // Check local storage for cached Ayah and timestamp
      const cachedAyah = await AsyncStorage.getItem(`${AYAH_KEY}_${currentMood}`);
      const cachedTimestamp = await AsyncStorage.getItem(TIMESTAMP_KEY);

      const currentTime = Date.now();

      if (cachedAyah && cachedTimestamp) {
          const lastFetchedTime = parseInt(cachedTimestamp, 10);

          // If the cached Ayah is less than 24 hours old, use it
          if (currentTime - lastFetchedTime < CACHE_DURATION) {
            setAyah(JSON.parse(cachedAyah));
            setLoading(false);
            return;
          }
      }

      // If no valid cached Ayah, select a new one and cache it
      const randomAyah = getRandomAyahByMood(currentMood);
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

          await AsyncStorage.setItem(`${AYAH_KEY}_${currentMood}`, JSON.stringify(selectedAyah));
          await AsyncStorage.setItem(TIMESTAMP_KEY, currentTime.toString());

          setAyah(selectedAyah);
      }

      setLoading(false);
    };

    fetchDailyAyah();
  }, [surahs, mood]);

  const handleMoodChange = async (selectedMood: string) => {
    setIsSkeleton(true);
    setMood(selectedMood);
    await AsyncStorage.setItem(MOOD_KEY, selectedMood);

    setTimeout(() => {
      setIsSkeleton(false); // Stop skeleton loading after fetch
    }, 500); // Delay to simulate smoother transition
  };

  const handleAyahClick = () => {
    router.push({
      pathname: `/surahs/${ayah.surahNumber}`,
      params: { ayahIndex: ayah.ayahNumber }
    });
  };

  return (
    <View style={styles.container}>
      {/* Mood Selector */}
      <View style={styles.moodContainer}>
        <Text style={styles.headerText}>I am feeling: </Text>
        <Dropdown
          data={moods}
          labelField="label"
          valueField="value"
          placeholder="Select mood"
          value={mood}
          onChange={(item) => handleMoodChange(item.value)}
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelectedText}
          iconStyle={styles.dropdownIcon}
          containerStyle={styles.dropdownContainer}
        />
      </View>

      {/* Ayah Card */}
      <View style={styles.ayahCard}>
          <Text style={[styles.headerText, { color: '#000000' }]}>Ayat of the Day</Text>

          {loading || isSkeleton || !ayah ? (
              <View style={styles.ayahContent}>
                  {/* Skeleton for Arabic Text */}
                  <Animated.View style={[styles.skeleton, styles.skeletonArabic]} />
                  {/* Skeleton for English Text */}
                  <Animated.View style={[styles.skeleton, styles.skeletonEnglish]} />
                  {/* Skeleton for Ayah Info */}
                  <Animated.View style={[styles.skeleton, styles.skeletonInfo]} />
              </View>
          ) : (
              <TouchableOpacity onPress={handleAyahClick} style={styles.ayahContent}>
                  <Text style={styles.arabicText}>{ayah.arabicText}</Text>
                  <Text style={styles.englishText}>"{ayah.englishText}"</Text>
                  <Text style={styles.ayahInfo}>
                      Surah {ayah.surahNumber}, Ayah {ayah.ayahNumber}
                  </Text>
              </TouchableOpacity>
          )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  skeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 5,
  },
  skeletonArabic: {
    width: '80%',
    height: 30,
  },
  skeletonEnglish: {
    width: '90%',
    height: 20,
  },
  skeletonInfo: {
    width: '60%',
    height: 15,
  },
  headerText: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#ECDFCC',
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row', // Place text and dropdown on the same line
    alignItems: 'center',
    justifyContent: 'center', // Align vertically
  },
  dropdown: {
    flex: 1, // Take the remaining space
    backgroundColor: '#3D4F4C',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    marginLeft: 5, // Add spacing between text and dropdown
  },
  dropdownPlaceholder: {
    color: '#F4E2C1', // Light placeholder color
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: '#FFFFFF', // White for selected text
    fontFamily: 'Outfit_400Regular',
  },
  dropdownIcon: {
    width: 20,
    height: 20,
  },
  dropdownContainer: {
    borderRadius: 10,
    backgroundColor: '#fff',
  },
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
  arabicText: {
    marginTop: 16,
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
