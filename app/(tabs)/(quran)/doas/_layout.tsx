// surahs/_layout.tsx
import { Stack, usePathname, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { Modal, Text } from 'react-native';
import { ThemeContext } from '../../../../context/ThemeContext';
import { FloatingPlayer } from '../../../../components/FloatingPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slider, Switch } from '@rneui/base';
import { reciterOptions } from '../../../../utils/constants';

const DoaLayout = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isModalVisible, setModalVisible] = useState(false);
    const { toggleDarkMode, isDarkMode, textSize, setTextSize, reciter, setReciter } = useContext(ThemeContext);

    const toggleModal = () => setModalVisible(!isModalVisible);

    // Load the text size from AsyncStorage on component mount
    useEffect(() => {
        const loadTextSize = async () => {
        const savedTextSize = await AsyncStorage.getItem('textSize');
        if (savedTextSize !== null) {
            setTextSize(parseInt(savedTextSize, 10));
        }
        };
        loadTextSize();
    }, []);

    // Save the text size to AsyncStorage when it changes
    const handleTextSizeChange = async (value: number) => {
        setTextSize(value);
        await AsyncStorage.setItem('textSize', value.toString());
    };

    return (
        <View style={styles.container}>
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
                    headerTitle: 'Duas',
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
                name="[id]"
                options={{
                    headerShown: true,
                    headerTitle: 'Doas',
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
                    headerRight: () => (
                    <TouchableOpacity onPress={toggleModal}>
                        <FontAwesome6
                        name="gear"
                        size={24}
                        color='#ECDFCC'
                        style={{ padding: 10 }}
                        />
                    </TouchableOpacity>
                    ),
                }}
            /> 
        </Stack>
        {/* Modal for Reciter and Text Size Settings */}
        {isModalVisible && (
            <Modal
                transparent={true}
                animationType="fade"
                visible={isModalVisible}
                onRequestClose={toggleModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#4D6561' }]}>
                        <Text style={[styles.modalHeader, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF' }]}>Settings</Text>
                            {/* Text Size Slider */}
                            <View style={styles.modalRow}>
                            <Text style={[styles.modalText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF' }]}>Text Size</Text>
                            <View style={styles.sliderContainer}>
                            <Slider 
                                value={textSize}
                                onValueChange={handleTextSizeChange}
                                minimumValue={26}
                                maximumValue={36}
                                step={2}
                                thumbTintColor={isDarkMode ? '#ECDFCC' : '#CCC'}
                                minimumTrackTintColor={isDarkMode ? '#F0DBA0' : '#3A504C'}
                                maximumTrackTintColor="#D3D3D3"
                                style={styles.slider}
                            />
                            </View>
                            </View>

                            {/* Dark/Light Mode Switch */}
                            <View style={styles.modalRow}>
                                <Text style={[styles.modalText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF' }]}>Appearance</Text>
                                <View style={styles.toggleContainer}>
                                <Text style={[styles.toggleText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF' }]}>Light</Text>
                                <Switch
                                    value={isDarkMode}
                                    onValueChange={toggleDarkMode}
                                    thumbColor={isDarkMode ? '#ECDFCC' : 'white'}
                                    trackColor={{ false: 'grey', true: 'grey' }}
                                />
                                <Text style={[styles.toggleText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF' }]}>Dark</Text>
                                </View>
                            </View>

                            {/* Conditionally Render Reciter Section */}
                            {pathname.includes('/surahs') && (
                                <View style={[styles.modalRow, { flexDirection: 'column', gap: 20}]}>
                                <Text style={[styles.modalText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF', alignSelf: 'flex-start' }]}>
                                    Reciter
                                </Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                > 
                                    {reciterOptions.map((reciterOption) => (
                                    <TouchableOpacity 
                                        key={reciterOption.value}
                                        style={[
                                        styles.reciterCard, 
                                        reciter === reciterOption.value ? styles.reciterCardActive : null, 
                                        ]}
                                        onPress={() => setReciter(reciterOption.value)}
                                    >
                                        <Text           
                                        style={[
                                            styles.reciterCardText,
                                            reciter === reciterOption.value ? styles.reciterCardTextActive : null,
                                        ]}
                                        >
                                        {reciterOption.label}
                                        </Text>
                                    </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                </View>
                            )}
                        <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
                            <Text style={[styles.closeButtonText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF' }]}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    floatingPlayer: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        zIndex: 1000,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#4D6561',
        padding: 20,
        borderRadius: 10,
    },
    modalHeader: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#6A807B',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    closeButtonText: {
        fontFamily: 'Outfit_500Regular',
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
      },
      modalText: {
        color: '#FFFFFF',
        fontFamily: 'Outfit_500Regular',
      },
      sliderContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
      },
      slider: {
        width: 160,
      },
      sliderPlaceholder: {
        width: 150,
        height: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
      },
      toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      toggleText: {
        color: '#FFFFFF',
        fontFamily: 'Outfit_500Regular',
        marginHorizontal: 5,
      },
      reciterCard: {
        backgroundColor: '#6A807B',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginHorizontal: 5,
      },
      reciterCardActive: {
        backgroundColor: '#F0DBA0', // Highlighted color
      },
      reciterCardText: {
        color: '#FFFFFF',
        fontFamily: 'Outfit_500Regular',
      },
      reciterCardTextActive: {
        color: '#3A504C', // Text color when active
        fontWeight: 'bold',
      },
});

export default DoaLayout;
