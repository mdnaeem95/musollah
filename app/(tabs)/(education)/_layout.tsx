import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const EducationLayout = () => {
  const router = useRouter();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4D6561',
          },
          headerTitleStyle: {
            fontFamily: 'Outfit_500Medium',
            color: '#FFFFFF'
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
            drawerLabel: 'Courses',
            title: 'Courses',
            drawerIcon: () => <FontAwesome6 name="book" />,
            headerRight: () => (
              <TouchableOpacity style={{ marginRight: 16 }} onPress={() => router.replace('/courses')}>
                <FontAwesome6 name="house" size={22} color="white" />
              </TouchableOpacity>
            )
          }}
        />
        <Drawer.Screen 
          name="teachers"
          options={{
            drawerLabel: 'Teachers',
            title: 'Teachers',
            drawerIcon: () => <FontAwesome6 name="chalkboard-user" />
          }}
        />
        <Drawer.Screen
          name="profile/index"
          options={{
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
