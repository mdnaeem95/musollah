/**
 * Account Settings - Modern Design
 * 
 * User profile management with glassmorphism and animations
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import SignInModal from '../../../../components/SignInModal';
import { useAccountSettings } from '../../../../hooks/settings/useAccountSettings';
import { calculateContrastColor } from '../../../../utils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AccountSettings = () => {
  const { theme, isDarkMode } = useTheme();

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

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.primary }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <View style={[styles.loadingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        </MotiView>
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading account...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isAuthenticated ? (
          <>
            {/* Profile Header */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <BlurView
                intensity={20}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[styles.profileHeader, { backgroundColor: theme.colors.secondary }]}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: theme.colors.accent }]}>
                  <Text style={[styles.avatarText, { color: calculateContrastColor(theme.colors.accent) }]}>
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
                    {profile?.name || 'User'}
                  </Text>
                  <Text style={[styles.userEmail, { color: theme.colors.text.secondary }]}>
                    {profile?.email}
                  </Text>
                </View>
              </BlurView>
            </MotiView>
            
            {/* Account Details */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 200, damping: 20 }}
            >
              <SectionHeader icon="user" label="Account Details" theme={theme} />

              <BlurView
                intensity={20}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[styles.detailsCard, { backgroundColor: theme.colors.secondary }]}
              >
                {/* Name Field */}
                <SettingsField
                  icon="user"
                  label="Name"
                  value={profile?.name || 'Not set'}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openEditNameModal();
                  }}
                  editable
                  theme={theme}
                />

                <View style={[styles.fieldDivider, { backgroundColor: theme.colors.muted }]} />

                {/* Email Field */}
                <SettingsField
                  icon="envelope"
                  label="Email"
                  value={profile?.email || 'Not set'}
                  theme={theme}
                />
              </BlurView>
            </MotiView>

            {/* Actions */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 250, damping: 20 }}
              style={styles.actionsContainer}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleSignOut();
                }}
                style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="right-from-bracket" size={18} color={theme.colors.text.error} />
                <Text style={[styles.actionText, { color: theme.colors.text.error }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  handleDeleteAccount();
                }}
                style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="trash" size={18} color={theme.colors.text.error} />
                <Text style={[styles.actionText, { color: theme.colors.text.error }]}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </MotiView>
          </>
        ) : (
          // Not Authenticated State
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <BlurView
              intensity={20}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.emptyState, { backgroundColor: theme.colors.secondary }]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6 name="user-lock" size={48} color={theme.colors.accent} />
              </View>

              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                Sign In Required
              </Text>

              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                Sign in to view and manage your account settings
              </Text>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSignUpModalVisible(true);
                }}
                style={[styles.signInButton, { backgroundColor: theme.colors.accent }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.signInText, { color: calculateContrastColor(theme.colors.accent) }]}>
                  Sign In / Sign Up
                </Text>
                <FontAwesome6
                  name="arrow-right"
                  size={16}
                  color={calculateContrastColor(theme.colors.accent)}
                />
              </TouchableOpacity>
            </BlurView>
          </MotiView>
        )}
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        isVisible={isEditNameModalVisible}
        onBackdropPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          closeEditNameModal();
        }}
        backdropOpacity={0.5}
        animationIn="zoomIn"
        animationOut="zoomOut"
      >
        <BlurView
          intensity={30}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.modalContent, { backgroundColor: theme.colors.secondary }]}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              closeEditNameModal();
            }}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="xmark" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={[styles.modalIcon, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6 name="user-pen" size={32} color={theme.colors.accent} />
          </View>

          {/* Title */}
          <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
            Edit Name
          </Text>

          {/* Input */}
          <View style={styles.inputContainer}>
            <FontAwesome6
              name="user"
              size={18}
              color={theme.colors.accent}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.primary,
                color: theme.colors.text.primary,
              }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
              placeholderTextColor={theme.colors.text.muted}
              autoFocus
              editable={!isUpdating}
            />
          </View>

          {/* Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                closeEditNameModal();
              }}
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.muted }]}
              activeOpacity={0.7}
              disabled={isUpdating}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.text.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSaveName();
              }}
              style={[
                styles.modalButton,
                styles.saveButton,
                { backgroundColor: theme.colors.accent },
                (!newName.trim() || isUpdating) && styles.buttonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={isUpdating || !newName.trim()}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={calculateContrastColor(theme.colors.accent)} />
              ) : (
                <>
                  <FontAwesome6
                    name="check"
                    size={16}
                    color={calculateContrastColor(theme.colors.accent)}
                  />
                  <Text style={[styles.modalButtonText, { color: calculateContrastColor(theme.colors.accent) }]}>
                    Save
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* Sign In Modal */}
      <SignInModal
        isVisible={isSignUpModalVisible}
        onClose={() => setSignUpModalVisible(false)}
      />
    </View>
  );
};

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

const SectionHeader = ({
  icon,
  label,
  theme,
}: {
  icon: string;
  label: string;
  theme: any;
}) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
      <FontAwesome6 name={icon} size={14} color={theme.colors.accent} />
    </View>
    <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
      {label}
    </Text>
  </View>
);

// ============================================================================
// SETTINGS FIELD COMPONENT
// ============================================================================

const SettingsField = ({
  icon,
  label,
  value,
  onPress,
  editable,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
  editable?: boolean;
  theme: any;
}) => {
  return (
    <TouchableOpacity
      onPress={editable ? onPress : undefined}
      disabled={!editable}
      activeOpacity={0.7}
      style={styles.settingsField}
    >
      {/* Icon Badge */}
      <View style={[styles.fieldIcon, { backgroundColor: theme.colors.accent + '15' }]}>
        <FontAwesome6 name={icon} size={16} color={theme.colors.accent} />
      </View>

      {/* Content */}
      <View style={styles.fieldContent}>
        <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>
          {label}
        </Text>
        <Text style={[styles.fieldValue, { color: theme.colors.text.primary }]}>
          {value}
        </Text>
      </View>

      {/* Edit Icon */}
      {editable && (
        <FontAwesome6 name="pen" size={16} color={theme.colors.text.muted} />
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Loading
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
  },

  // Profile Header
  profileHeader: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Details Card
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Settings Field
  settingsField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  fieldDivider: {
    height: 1,
    marginVertical: 16,
    marginLeft: 54, // Align with text after icon
  },

  // Actions
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Empty State
  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Modal
  modalContent: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  inputIcon: {
    width: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    padding: 0,
  },

  // Modal Buttons
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelButton: {
    // Styles in modalButton
  },
  saveButton: {
    // Styles in modalButton
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default AccountSettings;