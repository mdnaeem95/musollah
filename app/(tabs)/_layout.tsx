import { Tabs } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#BFE1DB',
        tabBarInactiveTintColor: '#688A84',
        tabBarStyle: {
          backgroundColor: '#4D6561',
          borderTopColor: '#FFFFFF',
          height: 60,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          switch (route.name) {
            case 'index':
              iconName = 'person-praying';
              break;
            case 'musollah':
              iconName = 'location-dot';
              break;
            case 'qiblat':
              iconName = 'compass';
              break;
            case '(quran)':
              iconName = 'book-quran';
              break;
            case 'settings':
              iconName = 'gear';
              break;
            default:
              iconName = 'circle';
          }
          return <FontAwesome6 name={iconName} size={20} color={color} solid={focused} />;
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Prayers',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="musollah"
        options={{
          title: 'Musollah',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="qiblat"
        options={{
          title: 'Qiblat',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="(quran)"
        options={{
          title: 'Quran',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
