import { View, Text, StyleSheet, TextStyle, Dimensions } from 'react-native'
import React from 'react'

const screenWidth = Dimensions.get('window').width;
const containerWidth = screenWidth * 0.75;

interface PrayerTimeItemProps {
    name: string;
    time: string;
    style?: TextStyle
}

const PrayerTimeItem = ({ name, time, style }: PrayerTimeItemProps) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, style]}>{name}</Text>
      <Text style={[styles.text, style]}>{time}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
      justifyContent: 'space-between',
      width: containerWidth,
      minHeight: 54,
      borderRadius: 15,
      borderColor: '#FFFFFF',
      borderWidth: 2,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.5)'
    },
    text: {
        fontFamily: 'Outfit_500Medium',
        fontWeight: 400,
        fontSize: 20,
        lineHeight: 30,
        color: '#333333'
    }
})

export default PrayerTimeItem