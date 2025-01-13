import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import BannerAdComponent from '../../../components/BannerAd';

const SettingsTab = () => {
  const router = useRouter();
  const { theme } = useTheme();

  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
        {/* SETTINGS */}
        <Text style={styles.sectionHeader}>Settings</Text>

        <View style={styles.generalSettingsContainer}>
          {/* ACCOUNT */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push(`/account`)}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name="user" color={theme.colors.text.primary} size={20} />
              <Text style={styles.settingsName}>Account</Text>
            </View>
            <FontAwesome6 name="chevron-right" color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>

          {/* PRAYERS SETTINGS */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push('/prayers')}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name="person-praying" color={theme.colors.text.primary} size={20} />
              <Text style={styles.settingsName}>Prayers</Text>
            </View>
            <FontAwesome6 name="chevron-right" color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>

          {/* APPEARANCE */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push('/appearance')}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name="palette" color={theme.colors.text.primary} size={20} />
              <Text style={styles.settingsName}>Appearance</Text>
            </View>
            <FontAwesome6 name="chevron-right" color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>

          {/* SUPPORT */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push('/support')}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name="envelope" color={theme.colors.text.primary} size={20} />
              <Text style={styles.settingsName}>Support</Text>
            </View>
            <FontAwesome6 name="chevron-right" color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>

          {/* REFERRAL */}
          <TouchableOpacity style={styles.settingsField} onPress={() => router.push('/referral')}>
            <View style={styles.settingsLeftField}>
              <FontAwesome6 name="gift" color={theme.colors.text.primary} size={20} />
              <Text style={styles.settingsName}>Referral</Text>
            </View>
            <FontAwesome6 name="chevron-right" color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* OTHER FEATURES */}
        <Text style={styles.sectionHeader}>Other Features</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/food-additives')}>
            <FontAwesome6 name="flask" size={30} color={theme.colors.text.primary} />
            <Text style={styles.iconLabel}>Food Additives</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/zakat')}>
            <FontAwesome6 name="hand-holding-dollar" size={30} color={theme.colors.text.primary} />
            <Text style={styles.iconLabel}>Zakat Calculator</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/qa')}>
            <FontAwesome6 name="message" size={30} color={theme.colors.text.primary} />
            <Text style={styles.iconLabel}>Ask Anything</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Banner Ad */}
      <BannerAdComponent />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  sectionHeader: {
    fontFamily: 'Outfit_500Medium',
    fontSize: theme.fontSizes.large,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.medium,
  },
  generalSettingsContainer: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.large,
    ...theme.shadows.default,
  },
  settingsField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.medium,
  },
  settingsLeftField: {
    flexDirection: 'row',
    gap: theme.spacing.small,
  },
  settingsName: {
    fontFamily: 'Outfit_400Regular',
    fontSize: theme.fontSizes.medium,
    color: theme.colors.text.secondary,
  },
  /* Grid styling */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.large,
  },
  gridItem: {
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    height: 100,
    borderRadius: theme.borderRadius.large,
    marginBottom: theme.spacing.medium,
    padding: theme.spacing.medium,
    ...theme.shadows.default,
  },
  iconLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: theme.fontSizes.small,
    marginTop: theme.spacing.small,
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
  adContainer: {
    alignItems: 'center',
    width: '100%', // Ensure the container doesn't exceed the screen width
    overflow: 'hidden', // Prevent any overflow
  },
});

export default SettingsTab;
