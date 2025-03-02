import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome6 } from '@expo/vector-icons';
import { format, addDays, isAfter } from 'date-fns';
import { scaleSize } from '../../utils';
import { getAuth } from '@react-native-firebase/auth';
import SignInModal from '../SignInModal';

const ramadanStartDate = new Date(2025, 2, 2); // March 1, 2025
const totalDays = 29; // 30 days of Ramadan
const daysPerPage = 7; // Show 7 days per page
const today = new Date(); // Get today's date

const FastTracker = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [fastLog, setFastLog] = useState<boolean[]>(Array(totalDays).fill(false));
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(0);
    const auth = getAuth();
    const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
    const currentUser = auth.currentUser; // Get authenticated user

  useEffect(() => {
    const loadFastLog = async () => {
      try {
        const savedLog = await AsyncStorage.getItem('fastTracker');
        if (savedLog) {
          setFastLog(JSON.parse(savedLog));
        }
      } catch (error) {
        console.error('Error loading fast tracker:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFastLog();
  }, []);

  const toggleFast = async (index: number, fastDate: Date) => {
    if (!currentUser) {
        Alert.alert(
          "Authentication Required",
          "You need to log in to track your fasts.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Log In", onPress: () => setIsAuthModalVisible(true) }
          ]
        );
        return;
    }

    if (isAfter(fastDate, today)) {
      Alert.alert("Logging Restricted", "You can only log fasts for today or past dates.");
      return;
    }

    const updatedLog = [...fastLog];
    updatedLog[index] = !updatedLog[index];

    setFastLog(updatedLog);
    await AsyncStorage.setItem('fastTracker', JSON.stringify(updatedLog));
  };

  const completedFasts = fastLog.filter(fast => fast).length;
  const missedFasts = totalDays - completedFasts;

  // Generate Ramadan dates
  const generateRamadanDates = () => {
    return Array.from({ length: totalDays }, (_, index) => {
      const date = addDays(ramadanStartDate, index);
      return {
        dayNumber: index + 1,
        formattedDate: format(date, 'EEE, MMM d'),
        dateObject: date,
      };
    });
  };

  const ramadanDates = generateRamadanDates();
  const startIndex = currentWeek * daysPerPage;
  const endIndex = startIndex + daysPerPage;
  const weekDates = ramadanDates.slice(startIndex, endIndex);

  return (
    <>
    <Text style={styles.title}>Fast Tracker</Text>
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity 
          onPress={() => setCurrentWeek(prev => Math.max(prev - 1, 0))}
          disabled={currentWeek === 0}
        >
          <FontAwesome6 name="chevron-left" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.weekText}>
          Week {currentWeek + 1} / {Math.ceil(totalDays / daysPerPage)}
        </Text>

        <TouchableOpacity 
          onPress={() => setCurrentWeek(prev => Math.min(prev + 1, Math.ceil(totalDays / daysPerPage) - 1))}
          disabled={endIndex >= totalDays}
        >
          <FontAwesome6 name="chevron-right" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
      ) : (
        <>
          <View style={styles.logContainer}>
            {weekDates.map(({ dayNumber, formattedDate, dateObject }, index) => (
              <TouchableOpacity 
                key={dayNumber} 
                onPress={() => toggleFast(startIndex + index, dateObject)} 
                style={styles.dayBox}
                disabled={isAfter(dateObject, today)} // Disable future dates
              >
                <FontAwesome6
                  name={fastLog[startIndex + index] ? 'check-circle' : 'circle'}
                  size={24}
                  color={isAfter(dateObject, today) ? theme.colors.text.muted : (fastLog[startIndex + index] ? theme.colors.accent : theme.colors.text.muted)}
                />
                <Text style={[styles.dayText, isAfter(dateObject, today) && styles.disabledText]}>
                  {formattedDate}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.summary}>
            <FontAwesome6 name="check" size={scaleSize(14)} color="green" /> Completed: {completedFasts} | <FontAwesome6 name="xmark" size={scaleSize(14)} color="red" /> Missed: {missedFasts}
          </Text>

          <SignInModal isVisible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} />
        </>
      )}
    </View>
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      ...theme.shadows.default,
      margin: theme.spacing.medium,
    },
    title: {
      fontSize: scaleSize(18),
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginLeft: theme.spacing.medium,
      marginTop: theme.spacing.medium
    },
    weekNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    weekText: {
      fontSize: scaleSize(14),
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.secondary,
    },
    logContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    dayBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingVertical: theme.spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.text.muted,
    },
    dayText: {
      fontSize: scaleSize(14),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.primary,
    },
    disabledText: {
      color: theme.colors.text.muted, // Muted text for future dates
    },
    summary: {
      marginTop: theme.spacing.medium,
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: scaleSize(14),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
  });

export default FastTracker;
