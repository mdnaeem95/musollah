import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from 'react'
import { TouchableOpacity } from "react-native";

const TeachersLayout = () => {
    const router = useRouter();

    return (
        <Stack screenOptions={{
          headerShown: false
        }}>
          <Stack.Screen 
            name="index"
            options={{
              headerShown: true,
              headerTitle: 'Teachers',
              headerStyle: {
                backgroundColor: '#2E3D3A',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontFamily: 'Outfit_700Bold',
                fontSize: 20,
                color:'#ECDFCC'
              },
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 6 }}>
                  <FontAwesome6
                    name="arrow-left"
                    size={24}
                    color='#ECDFCC'
                    />
                </TouchableOpacity>
              )
            }}            
          />
          <Stack.Screen 
            name="[id]"
            options={{
              headerShown: true,
              headerTitle: 'Teachers',
              headerStyle: {
                backgroundColor: '#2E3D3A',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontFamily: 'Outfit_700Bold',
                fontSize: 20,
                color:'#ECDFCC'
              },
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 6 }}>
                  <FontAwesome6
                    name="arrow-left"
                    size={24}
                    color='#ECDFCC'
                    />
                </TouchableOpacity>
              )
            }}            
          />
        </Stack>
    )
}

export default TeachersLayout