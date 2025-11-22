import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Animated, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import Modal from 'react-native-modal';
import ThemedButton from '../../../../components/ThemedButton';
import SignInModal from '../../../../components/SignInModal';
import { useAccountSettings } from '../../../../hooks/settings/useAccountSettings';

const AccountSettings = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    profile,
    isAuthenticated,
    isLoading,
    isUpdating,
    isEditNameModalVisible,
    isSignUpModalVisible,
    newName,
    setNewName,
    openEditNameModal,
    closeEditNameModal,
    handleSaveName,
    handleSignOut,
    handleDeleteAccount,
    setSignUpModalVisible,
  } = useAccountSettings();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* Name Field */}
        <SettingsField
          icon="user"
          label="Name"
          value={profile?.name || 'Not set'}
          onPress={isAuthenticated ? openEditNameModal : undefined}
          editable={isAuthenticated}
        />

        {/* Email Field */}
        <SettingsField
          icon="envelope"
          label="Email"
          value={profile?.email || 'Not set'}
        />

        {/* Actions */}
        {isAuthenticated ? (
          <>
            <ThemedButton
              text="Sign Out"
              onPress={handleSignOut}
              style={{ backgroundColor: theme.colors.text.error }}
              textStyle={{ color: '#FFFFFF' }}
            />
            <ThemedButton
              text="Delete Account"
              onPress={handleDeleteAccount}
              style={{ backgroundColor: theme.colors.text.error }}
              textStyle={{ color: '#FFFFFF' }}
            />
          </>
        ) : (
          <ThemedButton
            text="Sign In / Sign Up"
            onPress={() => setSignUpModalVisible(true)}
          />
        )}
      </View>

      {/* Edit Name Modal */}
      <Modal isVisible={isEditNameModalVisible} onBackdropPress={closeEditNameModal}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <Pressable onPress={closeEditNameModal} style={styles.closeButton}>
            <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary} />
          </Pressable>

          <Text style={styles.modalTitle}>Edit Name</Text>

          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter new name"
            placeholderTextColor={theme.colors.text.muted}
            autoFocus
            editable={!isUpdating}
          />

          <View style={styles.buttonRow}>
            <ThemedButton
              text="Cancel"
              onPress={closeEditNameModal}
              style={styles.backButton}
              textStyle={{ color: '#FFFFFF' }}
              disabled={isUpdating}
            />
            <ThemedButton
              text={isUpdating ? 'Saving...' : 'Save'}
              onPress={handleSaveName}
              style={{ flex: 1 }}
              disabled={isUpdating || !newName.trim()}
            />
          </View>
        </View>
      </Modal>

      {/* Sign In Modal */}
      <SignInModal
        isVisible={isSignUpModalVisible}
        onClose={() => setSignUpModalVisible(false)}
      />
    </View>
  );
};

const SettingsField = ({
  icon,
  label,
  value,
  onPress,
  editable,
}: {
  icon: any;
  label: string;
  value: string;
  onPress?: () => void;
  editable?: boolean;
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () =>
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

  const handlePressOut = () =>
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPressIn={editable ? handlePressIn : undefined}
      onPressOut={editable ? handlePressOut : undefined}
      onPress={editable ? onPress : undefined}
      disabled={!editable}
    >
      <Animated.View
        style={[
          styles.settingsField,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <View style={styles.settingsLeftField}>
          <FontAwesome6 name={icon} size={20} color={theme.colors.text.primary} />
          <Text style={styles.settingsLabel}>{label}</Text>
        </View>
        <View style={styles.settingsLeftField}>
          <Text style={styles.valueText}>{value}</Text>
          {editable && (
            <FontAwesome6 name="edit" size={18} color={theme.colors.text.primary} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    form: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.medium,
      ...theme.shadows.default,
      gap: theme.spacing.medium,
    },
    settingsField: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.text.muted,
    },
    settingsLeftField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    settingsLabel: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
      fontFamily: 'Outfit_500Medium',
    },
    valueText: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
      fontFamily: 'Outfit_400Regular',
    },
    modalContent: {
      gap: theme.spacing.large,
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.large,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      width: '90%',
      alignSelf: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      padding: theme.spacing.small,
    },
    modalTitle: {
      fontSize: theme.fontSizes.xLarge,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
    },
    input: {
      width: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.small,
      padding: theme.spacing.small,
      borderWidth: 1,
      borderColor: theme.colors.text.muted,
      color: theme.colors.text.secondary,
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.medium,
      width: '100%',
      paddingHorizontal: theme.spacing.small,
    },
    backButton: {
      backgroundColor: theme.colors.text.error,
      flex: 1,
    },
  });

export default AccountSettings;