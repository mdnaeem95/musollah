import { Stack, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

const QuranLayout = () => {
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                headerShown: false, // Default: no header for all screens
                gestureEnabled: true,
            }}
        >
            <Stack.Screen 
                name="index"
                options={{
                    gestureEnabled: false,
                    headerShown: true,
                    headerTitle: 'Quran & Duas',
                    headerTitleStyle: {
                        fontFamily: 'Outfit_700Bold',
                        fontSize: 20,
                        color: '#ECDFCC',
                    },
                    headerStyle: {
                        backgroundColor: '#2E3D3A',
                    }
                }}
            />
            <Stack.Screen
              name="bookmarks/index"
              options={{
                headerShown: true,
                headerTitle: 'My Bookmarks',
                headerStyle: {
                  backgroundColor: '#2E3D3A',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontFamily: 'Outfit_700Bold',
                  fontSize: 20,
                  color: '#ECDFCC'
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
                ),
              }}
            />
        </Stack>
    );
};

export default QuranLayout;
