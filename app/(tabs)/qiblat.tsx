import { SafeAreaView, View } from 'react-native'
import React from 'react'
import Compass from '../../components/Compass'

const QiblatTab = () => {
  return (
    <SafeAreaView style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#4D6561' }}>
      <View style={{ alignItems: 'center', backgroundColor: '#4D6561', width: '100%', height: '100%' }}>
        <Compass />
      </View>
    </SafeAreaView>
  )
}

export default QiblatTab