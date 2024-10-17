import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SettingsTab = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Menu</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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

          {/* QURAN SETTINGS */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push('/quran')}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name='book-quran' color='white' size={20} />
              <Text style={styles.settingsName}>Quran</Text>
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

          <TouchableOpacity style={styles.gridItem}>
            <FontAwesome6 name="ellipsis" size={30} color="#FFF" />
            <Text style={styles.iconLabel}>Others coming...</Text>
          </TouchableOpacity>
          {/* Add more items here */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#4D6561',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  sectionHeader: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  generalSettingsContainer: {
    backgroundColor: '#314441',
    borderRadius: 15,
    padding: 10,
    marginBottom: 30,
  },
  settingsField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingsLeftField: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsName: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  /* Grid styling */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  gridItem: {
    backgroundColor: '#314441',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    height: 100,
    borderRadius: 15,
    marginBottom: 20,
    padding: 10,
  },
  iconLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#FFF',
  },
});

export default SettingsTab;
