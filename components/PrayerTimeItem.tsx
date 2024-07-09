import { View, Text, StyleSheet, TextStyle } from 'react-native'
import React from 'react'

interface PrayerTimeItemProps {
    name: string;
    time: string;
    style?: TextStyle
}

const PrayerTimeItem = ({ name, time, style }: PrayerTimeItemProps) => {
  return (
    <View style={{ justifyContent: 'space-between', width: 283, height: 54, borderRadius: 15, borderColor: '#FFFFFF', borderWidth: 2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
      <Text style={[styles.text, style]}>{name}</Text>
      <Text style={[styles.text, style]}>{time}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    text: {
        fontFamily: 'Outfit_400Regular',
        fontWeight: 400,
        fontSize: 20,
        lineHeight: 30,
        color: '#314340'
    }
})

export default PrayerTimeItem