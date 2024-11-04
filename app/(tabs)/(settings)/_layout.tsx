import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { createSharedElementStackNavigator } from 'react-navigation-shared-element'
import SettingsTab from ".";
import AccountSettings from "./account";
import PrayersSettings from "./prayers";
import SupportPage from "./support";
import FoodAdditivesPage from "./food-additives";
import ZakatIndex from "./zakat";
import FidyahCalculator from "./zakat/fidyah";
import ZakatHarta from "./zakat/harta";
import LandingPage from "./qa";
import NewQuestionScreen from "./qa/newQuestion";
import QuestionThreadScreen from "./qa/questionThread/[id]";

const Stack = createSharedElementStackNavigator()

const SettingsLayout = () => {
  const router = useRouter();

  return (
    <Stack.Navigator screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen
        component={SettingsTab} 
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
        component={AccountSettings}
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
        component={PrayersSettings}
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
        component={SupportPage}
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
        component={FoodAdditivesPage}
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
        component={ZakatIndex}
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
        component={FidyahCalculator}
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
        component={ZakatHarta}
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
      <Stack.Screen
        name="qa/index"
        component={LandingPage}
        options={{
          headerShown: true,
          headerTitle: 'Ask Anything',
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
        name="qa/newQuestion/index"
        component={NewQuestionScreen}
        options={{
          headerShown: true,
          headerTitle: 'Ask a Question',
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
        name="qa/questionThread/[id]"
        component={QuestionThreadScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#2E3D3A',
          },
          headerTintColor: '#FFFFFF',
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
    </Stack.Navigator>
  )
}

export default SettingsLayout