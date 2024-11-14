import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

const PrayerLayout = () => {

  const router = useRouter();
  const date = new Date();
  const year = date.getFullYear();
  const month = date.toLocaleString('default', { month: 'long' }); // Convert month to full name, e.g., 'October'
  const formattedMonth = `${month} ${year}`;

  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen 
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="qiblat/index"
        options={{
          headerShown: true,
          headerTitle: 'Qiblat',
          headerStyle: {
            backgroundColor: '#2E3D3A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color:'#ECDFCC'
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color='#ECDFCC'
                style={{ padding: 10 }}
                />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="doa/index"
        options={{
          headerShown: true,
          headerTitle: 'Post-Prayer Doa',
          headerStyle: {
            backgroundColor: '#2E3D3A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color:'#ECDFCC'
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color='#ECDFCC'
                style={{ padding: 10 }}
                />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="monthlyPrayerTimes/index"
        options={{
          headerShown: true,
          headerTitle: formattedMonth,
          headerStyle: {
            backgroundColor: '#2E3D3A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color:'#ECDFCC'
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color='#ECDFCC'
                style={{ padding: 10 }}
                />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="prayerDashboard/index"
        options={{
          headerShown: true,
          headerTitle: 'Prayer Dashboard',
          headerStyle: {
            backgroundColor: '#2E3D3A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color:'#ECDFCC'
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color='#ECDFCC'
                style={{ padding: 10 }}
                />
            </TouchableOpacity>
          )
        }}
      />
    </Stack>
  )
}

export default PrayerLayout