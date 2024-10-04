import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react'
import Compass from '../../../../components/Compass';
import PrayerHeader from '../../../../components/PrayerHeader';

const QiblatTab = () => {
  return (
    <SafeAreaView style={styles.mainContainer}>
        <PrayerHeader title="Qiblat" backgroundColor='#4D6561' />
        <View style={styles.compassContainer}>
          <Compass />
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  compassContainer: {
    justifyContent: 'center', 
    alignItems: 'center', 
    flex: 1, 
    marginBottom: 120
  },
  mainContainer: {
    padding: 16,
    flex: 1, 
    backgroundColor: '#4D6561'
  }
})

export default QiblatTab