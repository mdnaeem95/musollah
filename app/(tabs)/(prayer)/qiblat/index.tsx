import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react'
import Compass from '../../../../components/Compass';
import BackArrow from '../../../../components/BackArrow';

const QiblatTab = () => {
  return (
    <SafeAreaView style={styles.mainContainer}>
        <BackArrow />
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
    marginBottom: 80
  },
  mainContainer: {
    padding: 16,
    flex: 1, 
    backgroundColor: '#4D6561'
  }
})

export default QiblatTab