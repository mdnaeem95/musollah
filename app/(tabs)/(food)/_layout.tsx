import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

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
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.circleButton}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color='#ECDFCC'
                />
            </TouchableOpacity>
          )
        }}
      />
        <Stack.Screen
        name="reviews/[id]"
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Submit Your Review',
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

const styles = StyleSheet.create({
  circleButton: {
    width: 40,           // Diameter of the circle
    height: 40,
    borderRadius: 20,    // Half of width/height to make it a circle
    backgroundColor: '#333333', // Example background color
    alignItems: 'center', // Center the icon horizontally
    justifyContent: 'center', // Center the icon vertically
    padding: 8,         // Padding around the icon
  },
});

export default FoodLayout