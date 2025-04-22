import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome6 } from '@expo/vector-icons';
import DailyAyah from '../../../components/quran/DailyAyah';
import DailyGoalTracker from '../../../components/quran/DailyGoalTracker';
import OverallProgressTracker from '../../../components/quran/OverallProgressTracker';
import { useTheme } from '../../../context/ThemeContext';
import RecitationProgress from '../../../components/quran/RecitationProgress';

const QuranDashboard = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [lastReadAyah, setLastReadAyah] = useState({ ayahNumber: 0, surahNumber: 0 });
  const [lastListenedAyah, setLastListenedAyah] = useState({ ayahIndex: 0, surahNumber: 0 });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useFocusEffect(
    useCallback(() => {
      const loadLastStates = async () => {
        const lastListened = await AsyncStorage.getItem('lastListenedAyah');
        console.log('Last Listened: ', lastListened)
        const lastRead = await AsyncStorage.getItem('lastReadAyah');
        console.log('Last Read: ', lastRead)

        if (lastListened) {
          const { surahNumber, ayahIndex } = JSON.parse(lastListened);
          setLastListenedAyah({ surahNumber, ayahIndex });
        }

        if (lastRead) {
          const { surahNumber, ayahNumber } = JSON.parse(lastRead);
          setLastReadAyah({ surahNumber, ayahNumber });
        }
      };
      loadLastStates();
    }, [])
  );

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.gridContainer}>
        {[
          {
            label: 'Quran',
            icon: 'book-quran',
            route: '/surahs',
          },
          {
            label: 'Duas',
            icon: 'hands-praying',
            route: '/doas',
          },
          {
            label: 'Bookmarks',
            icon: 'bookmark',
            route: '/bookmarks',
          },
          {
            label: 'Recitation Plan',
            icon: 'calendar-check',
            route: '/recitationPlan',
          }].map(({ label, icon, route }, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gridItem}
              onPress={() => router.push(route)}
              activeOpacity={0.7}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <FontAwesome6
                  name={icon}
                  size={28}
                  color={theme.colors.text.primary}
                  solid
                />
                <Text style={styles.iconLabel}>
                  {label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        <DailyAyah />
        <RecitationProgress />

        {lastListenedAyah.surahNumber > 0 && (
          <TouchableOpacity
            style={styles.ayahContainer}
            onPress={() =>
              router.push({
                pathname: `/surahs/${lastListenedAyah.surahNumber}`,
                params: { ayahIndex: lastListenedAyah.ayahIndex },
              })
            }
          >
            <Text style={styles.ayahHeaderText}>Last Listened</Text>
            <Text style={styles.ayahDetailText}>
              Surah {lastListenedAyah.surahNumber}, Ayah {lastListenedAyah.ayahIndex}
            </Text>
          </TouchableOpacity>
        )}

        {lastReadAyah.surahNumber > 0 && (
          <TouchableOpacity
            style={styles.ayahContainer}
            onPress={() =>
              router.push({
                pathname: `/surahs/${lastReadAyah.surahNumber}`,
                params: { ayahIndex: lastReadAyah.ayahNumber },
              })
            }
          >
            <Text style={styles.ayahHeaderText}>Last Read</Text>
            <Text style={styles.ayahDetailText}>
              Surah {lastReadAyah.surahNumber}, Ayah {lastReadAyah.ayahNumber}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
    scrollContainer: {
      padding: theme.spacing.medium,
    },
    gridContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      marginTop: theme.spacing.medium,
    },
    gridItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '30%',
      marginBottom: theme.spacing.medium,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.secondary,
      ...theme.shadows.default,
    },
    iconLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      marginTop: theme.spacing.small,
      textAlign: 'center',
      color: theme.colors.text.primary,
    },
    ayahContainer: {
      marginTop: theme.spacing.medium,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.large,
      backgroundColor: theme.colors.secondary,
      ...theme.shadows.default,
    },
    ayahHeaderText: {
      fontSize: theme.fontSizes.xLarge,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.small,
    },
    ayahDetailText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
  });

export default QuranDashboard;
