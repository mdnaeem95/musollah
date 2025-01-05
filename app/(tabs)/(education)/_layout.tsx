import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const EducationLayout = () => {
  const { theme } = useTheme()

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerTintColor: theme.colors.text.primary,
          headerShadowVisible: false,
          drawerStyle: {
            backgroundColor: theme.colors.secondary,
          },
          drawerActiveTintColor: theme.colors.text.primary,
          drawerInactiveTintColor: theme.colors.text.muted,
        }}
      >
        <Drawer.Screen
          name="dashboard/index"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Dashboard',
            drawerIcon: ({ color }) => <FontAwesome6 name="house" color={color} />,
          }}
        />
        <Drawer.Screen
          name="courses"
          options={{
            headerShown: false,
            drawerLabel: 'Courses',
            title: 'Courses',
            drawerIcon: ({ color }) => <FontAwesome6 name="chalkboard" color={color} />,
          }}
        />
        <Drawer.Screen
          name="teachers"
          options={{
            headerShown: false,
            drawerLabel: 'Teachers',
            title: 'Teachers',
            drawerIcon: ({ color }) => <FontAwesome6 name="chalkboard-user" color={color} />,
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            headerShown: false,
            drawerLabel: 'Profile',
            title: 'Profile',
            drawerIcon: ({ color }) => <FontAwesome6 name="user" solid color={color} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
};

export default EducationLayout;
