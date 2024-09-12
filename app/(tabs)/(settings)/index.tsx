import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome6 } from '@expo/vector-icons'
import { Switch } from '@rneui/themed'
import { useRouter } from 'expo-router'

const SettingsTab = () => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>S E T T I N G S</Text>
      </View>

      <View style={{ gap: 16 }}>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, 
    backgroundColor: '#4D6561', 
    paddingHorizontal: 16, 
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
  }
})

export default SettingsTab