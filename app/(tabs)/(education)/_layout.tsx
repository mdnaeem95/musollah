import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';

const EducationLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E3D3A',
          },
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color:'#ECDFCC'
          },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      >
        <Drawer.Screen
          name="dashboard/index"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Dashboard',
            drawerIcon: () => <FontAwesome6 name="house" />,
          }}
        />
        <Drawer.Screen
          name="courses"
          options={{
            headerShown: false,
            drawerLabel: 'Courses',
            title: 'Courses',
            drawerIcon: () => <FontAwesome6 name="chalkboard" />,
          }}
        />
        <Drawer.Screen 
          name="teachers"
          options={{
            headerShown: false,
            drawerLabel: 'Teachers',
            title: 'Teachers',
            drawerIcon: () => <FontAwesome6 name="chalkboard-user" />,
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            headerShown: false,
            drawerLabel: 'Profile',
            title: 'Profile',
            drawerIcon: () => <FontAwesome6 name="user" solid />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
};

export default EducationLayout;
