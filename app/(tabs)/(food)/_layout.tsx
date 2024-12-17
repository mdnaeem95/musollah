import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

const FoodLayout = () => {
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
          headerTitle: 'Halal Food',
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
        name="search"
        options={{
          presentation: "fullScreenModal",
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Search',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: '#ECDFCC'
          },
          headerStyle: {
            backgroundColor: '#2E3D3A',
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
        name="[id]"
        options={{
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Details',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: '#ECDFCC'
          },
          headerStyle: {
            backgroundColor: '#2E3D3A',
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

export default FoodLayout