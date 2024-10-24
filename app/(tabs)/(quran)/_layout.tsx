// _layout.tsx
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slider, Switch } from '@rneui/base';
import { Stack, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ThemeContext } from '../../../context/ThemeContext';
import { reciterOptions } from '../../../utils/constants';

const QuranLayout = () => {
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);
  const { isDarkMode, toggleDarkMode, textSize, setTextSize, reciter, setReciter } = useContext(ThemeContext);

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

  const toggleModal = () => setModalVisible(!isModalVisible);
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false, // Default: no header for all screens
          gestureEnabled: true,
        }}
      >
        <Stack.Screen 
          name="index"
          options={{
            gestureEnabled: false
          }}
        />
        {/* Enable the header for surahs/[id] page */}
        <Stack.Screen
          name="surahs/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Quran',
            headerStyle: {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#4D6561',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontFamily: 'Outfit_700Bold',
              fontSize: 20,
              color: isDarkMode ? '#ECDFCC' : '#FFFFFF'
            },
            headerLeft: () => (
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={isDarkMode ? '#ECDFCC' : '#FFFFFF'}
                style={{ padding: 10 }}
                onPress={() => router.back()}
              />
            ),
            headerRight: () => (
              <FontAwesome6
                name="gear"
                size={24}
                color={isDarkMode ? '#ECDFCC' : '#FFFFFF'}
                style={{ padding: 10 }}
                onPress={toggleModal}
              />
            ),
          }}
        />
        <Stack.Screen
          name="surahs/index"
          options={{
            headerShown: true,
            headerTitle: 'Surahs',
            headerStyle: {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#4D6561',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontFamily: 'Outfit_700Bold',
              fontSize: 20,
              color: isDarkMode ? '#ECDFCC' : '#FFFFFF'
            },
            headerLeft: () => (
              <FontAwesome6
                name="arrow-left"
                size={24}
                color= {isDarkMode ? '#ECDFCC' : '#FFFFFF'}
                style={{ padding: 10 }}
                onPress={() => router.back()}
              />
            ),
          }}
        />
      </Stack>
      {/* Modal for Settings */}
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

              {/* Reciter Section */}
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

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
                <Text style={[styles.closeButtonText, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default QuranLayout;

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
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
  modeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#6A807B',
    marginHorizontal: 5,
  },
  modeButtonActive: {
    backgroundColor: '#ECDFCC',
  },
  modeButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_500Regular',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#6A807B',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_500Regular',
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
