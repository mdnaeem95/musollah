import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SettingsTab = () => {
  const router = useRouter();

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
        {/* SETTINGS */}
        <Text style={styles.sectionHeader}>Settings</Text>

        <View style={styles.generalSettingsContainer}>
          {/* ACCOUNT */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push(`/account`)}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='user' color='white' size={20} />
              <Text style={styles.settingsName}>Account</Text>
            </View>
            <FontAwesome6 name='chevron-right' color='white' size={20} />
          </TouchableOpacity>

          {/* PRAYERS SETTINGS */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push('/prayers')}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='person-praying' color='white' size={20} />
              <Text style={styles.settingsName}>Prayers</Text>
            </View>
            <FontAwesome6 name='chevron-right' color='white' size={20} />
          </TouchableOpacity>

          {/* SUPPORT */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push('/support')}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='envelope' color='white' size={20} />
              <Text style={styles.settingsName}>Support</Text>
            </View>
            <FontAwesome6 name='chevron-right' color='white' size={20} />
          </TouchableOpacity>
        </View>

        {/* OTHER FEATURES */}
        <Text style={styles.sectionHeader}>Other Features</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/food-additives')}>
            <FontAwesome6 name="flask" size={30} color="#FFF" />
            <Text style={styles.iconLabel}>Food Additives</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/zakat')}>
            <FontAwesome6 name="hand-holding-dollar" size={30} color="#FFF" />
            <Text style={styles.iconLabel}>Zakat Calculator</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/qa')}>
            <FontAwesome6 name="message" size={30} color="#FFF" />
            <Text style={styles.iconLabel}>Ask Anything</Text>
          </TouchableOpacity>
          {/* Add more items here */}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#2E3D3A',
  },
  sectionHeader: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#ECDFCC',
    marginBottom: 16,
  },
  generalSettingsContainer: {
    backgroundColor: '#3D4F4C',
    borderRadius: 15,
    padding: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
  },
  settingsField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  settingsLeftField: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsName: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#ECDFCC',
  },
  /* Grid styling */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  gridItem: {
    backgroundColor: '#3D4F4C',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    height: 100,
    borderRadius: 15,
    marginBottom: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
  },
  iconLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#ECDFCC',
  },
});

export default SettingsTab;
