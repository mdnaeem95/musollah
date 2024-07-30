import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
 
import React from 'react'
import { FontAwesome6 } from '@expo/vector-icons';

const EducationLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Dashboard',
            drawerIcon: () => <FontAwesome6 name="tachometer-alt" />
          }}
          />
        <Drawer.Screen
          name="courses/index"
          options={{
            drawerLabel: 'Courses',
            title: 'Courses',
            drawerIcon: () => <FontAwesome6 name="book" />
          }}
          />
        <Drawer.Screen
          name="profile/index"
          options={{
            drawerLabel: 'Profile',
            title: 'Profile',
            drawerIcon: () => <FontAwesome6 name="user" />
          }}
          />
      </Drawer>
    </GestureHandlerRootView>
  )
}

export default EducationLayout