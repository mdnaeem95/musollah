import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';
import * as Progress from 'react-native-progress';
import { ThemeContext } from '../../context/ThemeContext';

const DAILY_GOAL_KEY = 'dailyGoal';
const DAILY_PROGRESS_KEY = 'dailyProgress';
const DAILY_GOAL_TYPE_KEY = 'dailyGoalType';

const goalTypes = [
  { label: 'Ayahs', value: 'Ayahs' },
  { label: 'Surahs', value: 'Surahs' },
];

const DailyGoalTracker = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const [dailyGoal, setDailyGoal] = useState<number>(5);
  const [progress, setProgress] = useState<number>(0);
  const [goalType, setGoalType] = useState<string>('Ayahs');
  const [surahProgress, setSurahProgress] = useState(0);

  useEffect(() => {
    const loadProgress = async () => {
      const storedGoal = await AsyncStorage.getItem(DAILY_GOAL_KEY);
      const storedGoalType = await AsyncStorage.getItem(DAILY_GOAL_TYPE_KEY);
      const readAyahsToday = await AsyncStorage.getItem('readAyahsToday');
      const readSurahsToday = await AsyncStorage.getItem('readSurahsToday');

      if (storedGoal) setDailyGoal(Number(storedGoal));
      if (storedGoalType) setGoalType(storedGoalType);
      if (readAyahsToday) {
        const totalReadAyahs = JSON.parse(readAyahsToday).length;
        setProgress(totalReadAyahs);
      }
      if (readSurahsToday) {
        const totalReadSurahs = JSON.parse(readSurahsToday).length;
        setSurahProgress(totalReadSurahs);
      }
    };

    const intervalId = setInterval(loadProgress, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const resetDailyProgress = async () => {
      const today = new Date().toDateString();
      const lastReset = await AsyncStorage.getItem('lastResetDate');

      if (lastReset !== today) {
        await AsyncStorage.setItem('lastResetDate', today);
        await AsyncStorage.setItem('readAyahsToday', JSON.stringify([]));
        await AsyncStorage.setItem('readSurahsToday', JSON.stringify([]));
        setProgress(0);
        setSurahProgress(0);
      }
    };

    resetDailyProgress();
  }, []);

  const updateGoal = async (newGoal: number) => {
    setDailyGoal(newGoal);
    await AsyncStorage.setItem(DAILY_GOAL_KEY, newGoal.toString());
  };

  const updateGoalType = async (type: string) => {
    setGoalType(type);
    setProgress(0);
    await AsyncStorage.setItem(DAILY_GOAL_TYPE_KEY, type);
    await AsyncStorage.setItem(DAILY_PROGRESS_KEY, '0');
  };

  const styles = createStyles(activeTheme);

  return (
    <View style={styles.goalContainer}>
      <Text style={styles.goalHeader}>Daily Quran Reading Goal</Text>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Track by:</Text>
        <Dropdown
          data={goalTypes}
          labelField="label"
          valueField="value"
          placeholder="Select type"
          value={goalType}
          onChange={(item) => updateGoalType(item.value)}
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelectedText}
          iconStyle={styles.dropdownIcon}
          containerStyle={styles.dropdownContainer}
        />
      </View>

      <View style={styles.goalInputContainer}>
        <Text style={styles.goalTextLabel}>Set Daily Goal:</Text>
        <TextInput
          style={styles.goalInput}
          keyboardType="numeric"
          value={dailyGoal ? dailyGoal.toString() : '0'}
          onChangeText={(text) => updateGoal(Number(text))}
        />
        <Text style={styles.goalTextUnit}>{goalType}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Progress.Bar
          progress={goalType === 'Ayahs' ? progress / (dailyGoal || 1) : surahProgress / (dailyGoal || 1)}
          height={10}
          color={activeTheme.colors.accent}
          unfilledColor={activeTheme.colors.primary}
          borderWidth={0}
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>
          {goalType === 'Ayahs' ? progress : surahProgress} / {dailyGoal || 0} {goalType} Completed
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    goalContainer: {
      backgroundColor: theme.colors.secondary,
      padding: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    goalHeader: {
      fontSize: 20,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_600SemiBold',
      marginBottom: 15,
      textAlign: 'center',
    },
    progressContainer: {
      marginVertical: 20,
      alignItems: 'center',
    },
    progressBar: {
      borderRadius: 10,
      overflow: 'hidden',
    },
    progressText: {
      marginTop: 8,
      fontSize: 16,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    pickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    pickerLabel: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_500Medium',
      marginRight: 10,
    },
    dropdown: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 10,
      height: 40,
      justifyContent: 'center',
    },
    dropdownPlaceholder: {
      color: theme.colors.text.muted,
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
    },
    dropdownSelectedText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_500Medium',
    },
    dropdownContainer: {
      borderRadius: 10,
    },
    dropdownIcon: {
      width: 20,
      height: 20,
      tintColor: theme.colors.accent,
    },
    goalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      padding: 10,
    },
    goalTextLabel: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_500Medium',
      marginRight: 10,
    },
    goalInput: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      borderRadius: 10,
      color: theme.colors.text.primary,
      paddingHorizontal: 10,
      height: 40,
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
    },
    goalTextUnit: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_500Medium',
      marginLeft: 10,
    },
  });

export default DailyGoalTracker;
