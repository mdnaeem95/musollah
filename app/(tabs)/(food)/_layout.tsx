import { Stack } from "expo-router";

const FoodLayout = () => {
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
    </Stack>
  )
}

export default FoodLayout