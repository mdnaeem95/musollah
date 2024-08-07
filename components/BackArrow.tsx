import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { FontAwesome6 } from '@expo/vector-icons';

const BackArrow = () => {
    const router = useRouter();
  return (
    <View>
        <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" color='white' size={24} />
        </TouchableOpacity>
    </View>
  )
}

export default BackArrow