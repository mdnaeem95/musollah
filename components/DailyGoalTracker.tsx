import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';
import * as Progress from 'react-native-progress'

const DAILY_GOAL_KEY = 'dailyGoal';
const DAILY_PROGRESS_KEY = 'dailyProgress';
const DAILY_GOAL_TYPE_KEY = 'dailyGoalType';

const goalTypes = [
    { label: 'Ayahs', value: 'Ayahs' },
    { label: 'Surahs', value: 'Surahs' },
  ];

const DailyGoalTracker = () => {
    const [dailyGoal, setDailyGoal] = useState<number>(5); // Default goal: 5 ayahs
    const [progress, setProgress] = useState<number>(0); // Default progress: 0 ayahs
    const [goalType, setGoalType] = useState<string>('Ayahs'); // Default type: Ayahs
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
                setSurahProgress(totalReadSurahs); // Track surahs separately
            }
        };
    
        const intervalId = setInterval(loadProgress, 1000); // Periodic refresh for real-time updates
    
        return () => clearInterval(intervalId); // Clean up on unmount
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
        setProgress(0); // Reset progress when changing goal type
        await AsyncStorage.setItem(DAILY_GOAL_TYPE_KEY, type);
        await AsyncStorage.setItem(DAILY_PROGRESS_KEY, '0');
    };

    return (
        <View style={styles.goalContainer}>
            <Text style={styles.goalHeader}>Daily Quran Reading Goal</Text>

            {/* Goal Type Picker */}
            <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Track by: </Text>
                <Dropdown
                    data={goalTypes}
                    labelField="label"
                    valueField="value"
                    placeholder="Select mood"
                    value={goalType}
                    onChange={(item) => updateGoalType(item.value)}
                    style={styles.dropdown}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
                    iconStyle={styles.dropdownIcon}
                    containerStyle={styles.dropdownContainer}
                />
            </View>

            {/* Goal Input */}
            <View style={styles.goalInputContainer}>
                <Text style={styles.goalTextLabel}>Set Daily Goal:</Text>
                <TextInput
                    style={styles.goalInput}
                    keyboardType="numeric"
                    value={dailyGoal ? dailyGoal.toString() : "0"}
                    onChangeText={(text) => updateGoal(Number(text))}
                />
                <Text style={styles.goalTextUnit}>{goalType}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <Progress.Bar
                    progress={goalType === 'Ayahs' ? progress / (dailyGoal || 1) : surahProgress / (dailyGoal || 1)}
                    height={10}
                    color="#A8D5BA"
                    unfilledColor="#2E3D3A"
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

const styles = StyleSheet.create({
    goalContainer: {
        backgroundColor: '#3D4F4C',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    goalHeader: {
        fontSize: 20,
        color: '#ECDFCC',
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 15,
        textAlign: 'center',
    },
    progressContainer: {
        marginVertical: 20,
        alignItems: 'center'
    },
    progressBar: {
        borderRadius: 10, // Rounded corners for the bar
        overflow: 'hidden', // Ensures rounded corners are applied properly
    },
    progressText: {
        marginTop: 8,
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    pickerLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Outfit_500Medium',
        marginRight: 10,
    },
    dropdown: {
        flex: 1,
        backgroundColor: '#2E3D3A',
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 40,
        justifyContent: 'center',
    },
    dropdownPlaceholder: {
        color: '#888888', // Subtle placeholder color
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    dropdownSelectedText: {
        fontSize: 16,
        color: '#FFFFFF', // White for selected text
        fontFamily: 'Outfit_500Medium',
    },
    dropdownContainer: {
        borderRadius: 10,
    },
    dropdownIcon: {
        width: 20,
        height: 20,
        tintColor: '#ECDFCC', // Icon matches the theme
    },
    goalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#2E3D3A',
        borderRadius: 10,
        padding: 10,
    },
    goalTextLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Outfit_500Medium',
        marginRight: 10,
    },
    goalInput: {
        flex: 1,
        backgroundColor: '#3D4F4C',
        borderRadius: 10,
        color: '#FFFFFF',
        paddingHorizontal: 10,
        height: 40,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    goalTextUnit: {
        fontSize: 16,
        color: '#ECDFCC',
        fontFamily: 'Outfit_500Medium',
        marginLeft: 10,
    },
    goalText: {
        fontSize: 16,
        color: '#FFFFFF',
        marginVertical: 15,
        textAlign: 'center',
        fontFamily: 'Outfit_400Regular',
    },
    goalButton: {
        backgroundColor: '#A8D5BA', // Light green button
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    resetButton: {
        backgroundColor: '#E57373', // Muted red for reset
        marginTop: 10,
    },
    goalButtonText: {
        color: '#2E3D3A',
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
    },
});


export default DailyGoalTracker;
