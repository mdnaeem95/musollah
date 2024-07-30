import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react'
import Compass from '../../../../components/Compass';

const QiblatTab = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4D6561' }}>
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, marginBottom: 80 }}>
          <Compass />
        </View>
    </SafeAreaView>
  )
}

export default QiblatTab