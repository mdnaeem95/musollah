import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

const SettingsLayout = () => {
  const router = useRouter();

  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen
        name="index"
        options={{
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Settings & Others',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: '#ECDFCC'
          },
          headerStyle: {
            backgroundColor: '#2E3D3A',
          }
        }}
      />
      <Stack.Screen
        name="account/index"
        options={{
          headerShown: true,
          headerTitle: 'Account Information',
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
        name="prayers/index"
        options={{
          headerShown: true,
          headerTitle: 'Prayer Settings',
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
        name="support/index"
        options={{
          headerShown: true,
          headerTitle: 'Support & Feedback',
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
        name="food-additives/index"
        options={{
          headerShown: true,
          headerTitle: 'Food Additives',
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
        name="zakat/index"
        options={{
          headerShown: true,
          headerTitle: 'Zakat',
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
        name="zakat/fidyah/index"
        options={{
          headerShown: true,
          headerTitle: 'Zakat Fidyah',
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
        name="zakat/harta/index"
        options={{
          headerShown: true,
          headerTitle: 'Zakat Harta',
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

export default SettingsLayout