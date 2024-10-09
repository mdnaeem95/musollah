import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native'
import React, { useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome6 } from '@expo/vector-icons'
import { Switch } from '@rneui/themed'
import { useRouter } from 'expo-router'
import { ThemeContext } from '../../../context/ThemeContext'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../../redux/store/store'
import { Picker } from '@react-native-picker/picker';
import { toggleTimeFormat, setReminderInterval } from '../../../redux/slices/userPreferencesSlice'

const SettingsTab = () => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState<boolean>(false);
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext)
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { timeFormat, reminderInterval } = useSelector((state: RootState) => state.userPreferences);

  const handleTimeFormatToggle = () => {
    dispatch(toggleTimeFormat())
  }

  const handleReminderIntervalChange = (value: number) => {
    dispatch(setReminderInterval(value));
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>S E T T I N G S</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* GENERAL */}
        <View style={{ gap: 16, marginBottom: 16 }}>
          <Text style={styles.generalHeader}>G E N E R A L</Text>
          <View style={styles.generalSettingsContainer}>
            <TouchableOpacity style={styles.settingsField} onPress={() => router.push(`/account`)}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='user' color='white' size={20} />
                <Text style={styles.settingsName}>Account</Text>
              </View>
              <FontAwesome6 name='chevron-right' color='white' size={20} />
            </TouchableOpacity>

            <View style={styles.settingsField}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='volume-low' color='white' size={20} />
                <Text style={styles.settingsName}>Sounds</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => setNotificationsEnabled(value)} 
                />
            </View>

            <View style={styles.settingsField}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='bell' color='white' size={20} />
                <Text style={styles.settingsName}>Notifications</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(value) => setSoundEnabled(value)} 
                />
            </View>
          </View>
        </View>

        
        <View style={{ gap: 16, marginBottom: 16 }}>
        <Text style={styles.generalHeader}>P R A Y E R S  &  Q U R A N</Text>
          <View style={styles.generalSettingsContainer}>

            <View style={styles.settingsField}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='moon' color='white' size={20} />
                <Text style={styles.settingsName}>Quran Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode} 
                />
            </View>
            
            <View style={styles.settingsField}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='clock' color='white' size={20} />
                <Text style={styles.settingsName}>Prayer Time 24hr Format</Text>
              </View>
              <Switch
                value={timeFormat === '24-hour'}
                onValueChange={handleTimeFormatToggle} 
                />
            </View>

            <TouchableOpacity style={styles.settingsField} onPress={() => setIsReminderPickerVisible(true)}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='bell' color='white' size={20} />
                <Text style={styles.settingsName}>Pre-Prayer Reminder </Text>
              </View>
              <Text style={styles.settingsName}>
                {reminderInterval === 0 ? 'None' : `${reminderInterval} mins`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <Text style={styles.generalHeader}>S U P P O R T</Text>
          <View style={styles.generalSettingsContainer}>
            <TouchableOpacity style={styles.settingsField} onPress={() => router.push('/support')}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='envelope' color='white' size={20} />
                <Text style={styles.settingsName}>Support</Text>
              </View>
              <FontAwesome6 name='chevron-right' color='white' size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsField}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='dollar-sign' color='white' size={20} />
                <Text style={styles.settingsName}>One Time Donation</Text>
              </View>
              <Text style={styles.settingsName}>$4.98</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsField}>
              <View style={styles.settingsLeftField}>
                <FontAwesome6 name='ban' color='white' size={20} />
                <Text style={styles.settingsName}>Remove Ads</Text>
              </View>
              <Text style={styles.settingsName}>$2.98</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isReminderPickerVisible}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setIsReminderPickerVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Reminder Interval</Text>
            <Picker
              selectedValue={reminderInterval}
              style={styles.picker}
              onValueChange={(itemValue) => handleReminderIntervalChange(itemValue as number)}
            >
              <Picker.Item label='None' value={0} />
              {[5, 10, 15, 20, 25, 30].map((interval) => (
                <Picker.Item key={interval} label={`${interval} minutes`} value={interval} />
              ))}
            </Picker>
            <TouchableOpacity onPress={() => setIsReminderPickerVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, 
    backgroundColor: '#4D6561', 
    padding: 16, 
    gap: 16
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 30,
    lineHeight: 45,
    color: '#FFFFFF'
  },
  generalSettingsContainer: {
    backgroundColor: '#314441',
    width: '100%',
    borderRadius: 15,
    padding: 10,
    gap: 15,
  },
  generalHeader: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: '#FFFFFF'
  },
  settingsField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  settingsLeftField: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsName: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF'
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  picker: {
    marginBottom: 30,
    width: 200,
    height: 150,
  },
  closeButton: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#314340',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
})

export default SettingsTab