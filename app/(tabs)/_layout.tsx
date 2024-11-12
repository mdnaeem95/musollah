import { Tabs } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#BFE1DB',
        tabBarInactiveTintColor: '#688A84',
        tabBarStyle: {
          backgroundColor: '#2E3D3A',
          borderTopColor: '#3A504C',
          height: 70,
          paddingBottom: 25,
          paddingTop: 10,
          borderTopWidth: 1, // Thin border line for slight separation
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        tabBarShowLabel: false,
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          switch (route.name) {
            case '(prayer)':
              iconName = 'person-praying';
              break;
            case '(education)':
              iconName = 'book-open-reader';
              break;
            case '(food)':
              iconName = 'utensils';
              break;
            case 'musollah':
              iconName = 'location-dot';
              break;
            case '(quran)':
              iconName = 'book-quran';
              break;
            case '(settings)':
              iconName = 'bars';
              break;
            default:
              iconName = 'circle';
          }
          return <FontAwesome6 name={iconName} size={20} color={color} solid={focused} />;
        },
      })}
    >
      <Tabs.Screen
        name="(prayer)"
        options={{
          title: 'Prayers',
          headerShown: false,
        }}
      />
      <Tabs.Screen 
        name="(education)"
        options={{
          title: 'Education',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="(food)"
        options={{
          title: ' Halal Food',
          headerShown: false
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
        name="(quran)"
        options={{
          title: 'Quran',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
