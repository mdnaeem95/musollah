import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store/store';

const CustomClock = () => {
  const [currentTime, setCurrentTime] = useState('');
  const { timeFormat } = useSelector((state: RootState) => state.userPreferences);

  // Function to format time based on user preference
  const formatTime = (date: any) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (timeFormat === '12-hour') {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
      return `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
    }
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(formatTime(now));
    };

    // Initialize time and set interval
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [timeFormat]);

  return (
    <View style={styles.container}>
      <Text style={styles.clockText}>{currentTime}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 60,
    color: '#000000',
    textAlign: 'center',
  },
});

export default CustomClock;
