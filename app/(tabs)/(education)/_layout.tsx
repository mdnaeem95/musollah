import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store/store';

const CustomDrawerContent = (props: any) => {
  const { theme } = useTheme();
  const { user: authUser } = useAuth();
  const userState = useSelector((state: RootState) => state.user.user);

  const name = userState?.name || authUser?.displayName || 'Guest';
  const hasAvatar =
  userState?.avatarUrl &&
  userState?.avatarUrl.trim() !== "" &&
  !userState?.avatarUrl.includes("via.placeholder.com");

    return (
      <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
        <View style={styles.profileContainer}>
          {hasAvatar ? (
            <Image source={{ uri: userState?.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: theme.colors.muted }]}>
              <FontAwesome6 name="user" size={32} color={theme.colors.text.primary} />
            </View>
          )}
          <Text style={[styles.userName, { color: theme.colors.text.primary }]}>{name}</Text>
        </View>
  
        {/* Default drawer items */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
  );
};

const EducationLayout = () => {
  const { theme } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
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
          name="articles"
          options={{
            headerShown: false,
            drawerLabel: 'Articles',
            title: 'Articles',
            drawerIcon: ({ color }) => <FontAwesome6 name="book-open" color={color} />,
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
          name="bookmarks"
          options={{
            headerShown: false,
            drawerLabel: 'Bookmarks',
            title: 'Bookmarks',
            drawerIcon: ({ color }) => <FontAwesome6 name="bookmark" color={color} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
});

export default EducationLayout;
