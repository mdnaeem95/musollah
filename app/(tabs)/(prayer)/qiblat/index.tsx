import { SafeAreaView, View } from 'react-native'
import React from 'react'
import Compass from '../../../../components/Compass';

const QiblatTab = () => {
  return (
    <View style={{ height: '100%', width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4D6561' }}>
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, marginBottom: 80 }}>
          <Compass />
        </View>
    </View>
  )
}

export default QiblatTab