import { View, Text, StyleSheet, TextStyle, Dimensions } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store/store';
import { format, parse } from 'date-fns';

const screenWidth = Dimensions.get('window').width;
const containerWidth = screenWidth * 0.75;

interface PrayerTimeItemProps {
    name: string;
    time: string;
    style?: TextStyle
}

const PrayerTimeItem = ({ name, time, style }: PrayerTimeItemProps) => {
  const timeFormat = useSelector((state: RootState) => state.userPreferences.timeFormat);

  const formatTime = (time: string) => {
    const parsedTime = parse(time, 'HH:mm', new Date());
    return timeFormat === '12-hour'
      ? format(parsedTime, 'hh:mm a')
      : format(parsedTime, 'HH:mm');
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.prayerName, style]}>{name}</Text>
      <Text style={[styles.prayerTime, style]}>{formatTime(time)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
      justifyContent: 'space-between',
      width: containerWidth,
      minHeight: 54,
      borderRadius: 15,
      borderColor: 'rgba(255, 255, 255)', 
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4, // Shadow for Android
    },
    prayerName: {
      fontFamily: 'Outfit_500Medium',
      fontWeight: '500',
      fontSize: 18,
      color: '#333333',
      flex: 1,
      textAlign: 'left',
    },
    prayerTime: {
      fontFamily: 'Outfit_500Medium',
      fontWeight: '400',
      fontSize: 18,
      color: '#333333',
      flex: 1,
      textAlign: 'right',
    },
})

export default PrayerTimeItem