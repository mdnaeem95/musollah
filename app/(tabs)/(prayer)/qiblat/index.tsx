import { StyleSheet, View } from 'react-native'
import React from 'react'
import Compass from '../../../../components/Compass';

const QiblatTab = () => {
  return (
    <View style={styles.mainContainer}>
        <View style={styles.compassContainer}>
          <Compass />
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
  compassContainer: {
    justifyContent: 'center', 
    alignItems: 'center', 
    flex: 1, 
    marginBottom: 200
  },
  mainContainer: {
    padding: 16,
    flex: 1, 
    backgroundColor: '#2E3D3A'
  }
})

export default QiblatTab