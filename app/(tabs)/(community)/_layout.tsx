import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const CustomDrawerContent = (props: any) => {
  const { theme } = useTheme();

  // Static user data for now (replace with dynamic user data later)
  const user = {
    name: "Naeem Sani",
    avatar: `https://ui-avatars.com/api/?name=Naeem+Sani`,
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.profileContainer}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={[styles.userName, { color: theme.colors.text.primary }]}>{user.name}</Text>
      </View>

      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

const CommunityLayout = () => {
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
          name="index"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Community',
            headerStyle: { backgroundColor: theme.colors.secondary },
            drawerIcon: ({ color }) => <FontAwesome6 name="house" color={color} />,
          }}
        />
        <Drawer.Screen
          name="(profile)"
          options={{
            headerShown: false,
            drawerLabel: 'Profile',
            title: 'Profile',
            headerStyle: { backgroundColor: theme.colors.secondary },
            drawerIcon: ({ color }) => <FontAwesome6 name="user" solid color={color} />,
          }}
        />
        <Drawer.Screen
          name="(events)"
          options={{
            headerShown: false,
            drawerLabel: 'Events',
            title: 'Events',
            drawerIcon: ({ color }) => <FontAwesome6 name="ticket" solid color={color} />,
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

export default CommunityLayout;