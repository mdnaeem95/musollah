import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState } from '../../redux/store/store';
import { getRandomAyahByMood } from '../../utils';
import { Dropdown } from 'react-native-element-dropdown';
import { ThemeContext } from '../../context/ThemeContext';

const MOOD_KEY = 'selectedMood';
const AYAH_KEY = 'dailyAyah';
const TIMESTAMP_KEY = 'dailyAyahTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

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
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;
  const styles = createStyles(activeTheme);

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

  const surahs = useSelector((state: RootState) => state.quran.surahs);

  useEffect(() => {
    const fetchDailyAyah = async () => {
      setLoading(true);

      const storedMood = await AsyncStorage.getItem(MOOD_KEY);
      const currentMood = storedMood || mood;
      setMood(currentMood);

      const cachedAyah = await AsyncStorage.getItem(`${AYAH_KEY}_${currentMood}`);
      const cachedTimestamp = await AsyncStorage.getItem(TIMESTAMP_KEY);

      const currentTime = Date.now();

      if (cachedAyah && cachedTimestamp) {
        const lastFetchedTime = parseInt(cachedTimestamp, 10);
        if (currentTime - lastFetchedTime < CACHE_DURATION) {
          setAyah(JSON.parse(cachedAyah));
          setLoading(false);
          return;
        }
      }

      const randomAyah = getRandomAyahByMood(currentMood);
      const surah = surahs.find((s: any) => s.number === randomAyah.surahNumber);

      if (surah) {
        const arabicAyahs = surah.arabicText.split('|');
        const englishAyahs = surah.englishTranslation.split('|');

        const selectedAyah = {
          arabicText: arabicAyahs[randomAyah.ayahNumber - 1],
          englishText: englishAyahs[randomAyah.ayahNumber - 1],
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
      setIsSkeleton(false);
    }, 500);
  };

  const handleAyahClick = () => {
    router.push({
      pathname: `/surahs/${ayah.surahNumber}`,
      params: { ayahIndex: ayah.ayahNumber },
    });
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.ayahCard}>
        <Text style={styles.headerText}>Ayah of the Day</Text>

        {loading || isSkeleton || !ayah ? (
          <View style={styles.ayahContent}>
            <Animated.View style={[styles.skeleton, styles.skeletonArabic]} />
            <Animated.View style={[styles.skeleton, styles.skeletonEnglish]} />
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

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.medium,
    },
    moodContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    dropdown: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.medium,
      height: 40,
      marginLeft: theme.spacing.small,
    },
    dropdownPlaceholder: {
      color: theme.colors.text.muted,
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
    },
    dropdownSelectedText: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_400Regular',
    },
    dropdownIcon: {
      width: 20,
      height: 20,
      tintColor: theme.colors.text.primary,
    },
    dropdownContainer: {
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.secondary,
      shadowColor: theme.shadows.default.shadowColor,
      shadowOffset: theme.shadows.default.shadowOffset,
      shadowOpacity: theme.shadows.default.shadowOpacity,
      shadowRadius: theme.shadows.default.shadowRadius,
    },
    ayahCard: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.large,
      marginVertical: theme.spacing.large,
    },
    ayahContent: {
      alignItems: 'center',
    },
    arabicText: {
      marginTop: theme.spacing.medium,
      fontFamily: 'Amiri_400Regular',
      fontSize: theme.fontSizes.xxLarge,
      lineHeight: theme.fontSizes.xxLarge * 2.5,
      textAlign: 'center',
      color: theme.colors.text.primary,
    },
    englishText: {
      fontSize: theme.fontSizes.medium,
      fontStyle: 'italic',
      textAlign: 'center',
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.medium,
    },
    ayahInfo: {
      marginTop: theme.spacing.small,
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
    skeleton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      marginVertical: theme.spacing.small,
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
  });

export default DailyAyah;
