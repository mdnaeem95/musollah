import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

const SettingsTab = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ padding: theme.spacing.medium }}>
        {/* SETTINGS HEADER */}
        <Text style={styles.sectionHeader}>Settings</Text>

        <View style={styles.generalSettingsContainer}>
          {/* ACCOUNT */}
          <SettingsItem icon="user" label="Account" onPress={() => router.push('/account')} />
          <SettingsItem icon="person-praying" label="Prayers" onPress={() => router.push('/prayers')} />
          <SettingsItem icon="palette" label="Appearance" onPress={() => router.push('/appearance')} />
          <SettingsItem icon="envelope" label="Support" onPress={() => router.push('/support')} />
          <SettingsItem icon="gift" label="Referral" onPress={() => router.push('/referral')} />
        </View>

        {/* OTHER FEATURES HEADER */}
        <Text style={styles.sectionHeader}>Other Features</Text>

        <View style={styles.gridContainer}>
          <FeatureCard icon="flask" label="Food Additives" onPress={() => router.push('/food-additives')} />
          <FeatureCard icon="hand-holding-dollar" label="Zakat Calculator" onPress={() => router.push('/zakat')} />
        </View>
      </ScrollView>

      {/* Banner Ad */}
      {/* <BannerAdComponent /> */}
    </View>
  );
};

/* ✅ Individual Settings Item Component */
const SettingsItem = ({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }).start();

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View style={[styles.settingsField, { transform: [{ scale: scaleValue }] }]}>
        <View style={styles.settingsLeftField}>
          <FontAwesome6 name={icon} color={theme.colors.text.primary} size={20} />
          <Text style={styles.settingsName}>{label}</Text>
        </View>
        <FontAwesome6 name="chevron-right" color={theme.colors.text.primary} size={20} />
      </Animated.View>
    </Pressable>
  );
};

/* ✅ Feature Card Component */
const FeatureCard = ({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.gridItem} onPress={onPress}>
      <FontAwesome6 name={icon} size={30} color={theme.colors.text.primary} />
      <Text style={styles.iconLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

/* ✅ Styles */
const createStyles = (theme: any) =>
  StyleSheet.create({
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
      alignItems: 'center',
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
  });

export default SettingsTab;
