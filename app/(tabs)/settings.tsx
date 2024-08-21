import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome6 } from '@expo/vector-icons'
import { Switch } from '@rneui/themed'

const SettingsTab = () => {
  const [soundChecked, setsoundChecked] = useState<boolean>(true);
  const [notificationsChecked, setNotificationsChecked] = useState<boolean>(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4D6561', paddingHorizontal: 16, gap: 16 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>S E T T I N G S</Text>
      </View>

      <View style={{ gap: 16 }}>
        <Text style={styles.generalHeader}>G E N E R A L</Text>
        <View style={styles.generalSettingsContainer}>
          <View style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='user' color='white' size={20} />
              <Text style={styles.settingsName}>Account</Text>
            </View>
            <FontAwesome6 name='chevron-right' color='white' size={20} />
          </View>

          <View style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='volume-low' color='white' size={20} />
              <Text style={styles.settingsName}>Sounds</Text>
            </View>
            <Switch
              value={notificationsChecked}
              onValueChange={(value) => setNotificationsChecked(value)} 
            />
          </View>

          <View style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='bell' color='white' size={20} />
              <Text style={styles.settingsName}>Notifications</Text>
            </View>
            <Switch
              value={soundChecked}
              onValueChange={(value) => setsoundChecked(value)} 
            />
          </View>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <Text style={styles.generalHeader}>S U P P O R T</Text>
        <View style={styles.generalSettingsContainer}>
          <View style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='envelope' color='white' size={20} />
              <Text style={styles.settingsName}>Support</Text>
            </View>
            <FontAwesome6 name='chevron-right' color='white' size={20} />
          </View>

          <TouchableOpacity style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='dollar-sign' color='white' size={20} />
              <Text style={styles.settingsName}>One Time Donation</Text>
            </View>
            <Text style={styles.settingsName}>$5.00</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsField}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='ban' color='white' size={20} />
              <Text style={styles.settingsName}>Remove Ads</Text>
            </View>
            <Text style={styles.settingsName}>$2.99</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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