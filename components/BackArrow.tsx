import { View, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { FontAwesome6 } from '@expo/vector-icons';

const BackArrow = () => {
    const router = useRouter();

    return (
      <View style={{ marginTop: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" color='white' size={24} />
          </TouchableOpacity>
      </View>
    )
}

export default BackArrow