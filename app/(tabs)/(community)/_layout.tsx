import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store/store';
import { useRouter } from 'expo-router';
import { useNotification } from '../../../context/NotificationContext';
import { CommonActions } from '@react-navigation/native';

const CustomDrawerContent = (props: any) => {
  const { theme } = useTheme();
  const { user: authUser } = useAuth();
  const userState = useSelector((state: RootState) => state.user.user);

  const name = userState?.name || authUser?.displayName || "Guest";
  const avatar = userState?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.profileContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <Text style={[styles.userName, { color: theme.colors.text.primary }]}>{name}</Text>
      </View>

      {/* Default drawer items */}
      <DrawerItemList {...props} />

      {/* Force Events to reset to index */}
      <DrawerItem
        label="Events"
        icon={({ color }) => <FontAwesome6 name="ticket" solid color={color} />}
        onPress={() => {
          props.navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: '(events)' }],
            })
          );
        }}
        labelStyle={{ color: theme.colors.text.primary }}
      />
    </DrawerContentScrollView>
  );
};

const CommunityLayout = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { unreadCount } = useNotification();

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
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push('/(community)/(events)/notifications')} style={{ marginRight: 16 }}>
                <View>
                  <FontAwesome6 name="bell" size={20} color={theme.colors.text.primary} />
                  {unreadCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        right: -6,
                        top: -4,
                        backgroundColor: theme.colors.accent || 'red',
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 10, fontFamily: 'Outfit_700Bold' }}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ),
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
            drawerLabel: () => null, // hide from default drawer since we added custom item
            title: 'Events',
            drawerItemStyle: { height: 0 }, // also hide from layout
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