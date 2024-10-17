import React, { useContext } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../../../context/ThemeContext';
import PrayerHeader from '../../../../components/PrayerHeader';

const QuranSettings = () => {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <PrayerHeader title='Quran Settings' backgroundColor='#' />

      <View style={styles.settingsContainer}>
        {/* Quran Dark Mode Toggle */}
        <View style={styles.settingsField}>
          <View style={styles.settingsLeftField}>
            <Text style={styles.settingsName}>Quran Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#4D6561',
    padding: 16,
  },
  settingsContainer: {
    backgroundColor: '#314441',
    borderRadius: 15,
    padding: 16,
    gap: 15,
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
});

export default QuranSettings;
