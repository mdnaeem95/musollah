import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import React, { useContext } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';

const EducationLayout = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: activeTheme.colors.primary }}>
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerTintColor: activeTheme.colors.text.primary,
          headerShadowVisible: false,
          drawerStyle: {
            backgroundColor: activeTheme.colors.secondary,
          },
          drawerActiveTintColor: activeTheme.colors.text.primary,
          drawerInactiveTintColor: activeTheme.colors.text.muted,
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
