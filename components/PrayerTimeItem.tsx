import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

interface PrayerTimeItemProps {
    name: string;
    time: string;
}

const PrayerTimeItem = ({ name, time }: PrayerTimeItemProps) => {
  return (
    <View style={{ justifyContent: 'space-between', width: 283, height: 54, borderRadius: 15, borderColor: '#FFFFFF', borderWidth: 2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
      <Text style={styles.text}>{name}</Text>
      <Text style={styles.text}>{time}</Text>
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