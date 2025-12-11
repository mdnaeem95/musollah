/**
 * AddLocationSheet - Request New Location Form (v2.0 - FULL PAGE)
 * 
 * User-submitted location request form for adding new Bidet/Musollah locations.
 * Now a full-page modal with plenty of space for all fields.
 * 
 * Features:
 * - Full-page modal (no bottom sheet)
 * - Type toggle (Bidet/Musollah)
 * - Required fields (Building Name, Address, Postal Code)
 * - Conditional fields based on type
 * - Form validation with error toasts
 * - Glassmorphism design
 * - Staggered entrance animations
 * - Haptic feedback
 * - Smooth scrolling with plenty of space
 * 
 * @version 2.0 - Full-page modal (eliminates all scroll issues)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../context/ThemeContext';
import { useSubmitLocationRequest } from '../../api/services/musollah';

// =====================================================================
// CONSTANTS
// =====================================================================

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

interface AddLocationSheetProps {
  visible: boolean;
  onClose: () => void;
}

type LocationType = 'Bidet' | 'Musollah';

// =====================================================================
// MEMOIZED COMPONENTS
// =====================================================================

/**
 * Type Toggle Component (Bidet/Musollah)
 */
const TypeToggle = React.memo(({ 
  selectedType, 
  onTypeChange, 
  theme 
}: { 
  selectedType: LocationType;
  onTypeChange: (type: LocationType) => void;
  theme: any;
}) => {
  const handlePress = (type: LocationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTypeChange(type);
  };

  return (
    <View style={styles.typeToggleContainer}>
      <TouchableOpacity
        style={[
          styles.typeButton,
          {
            backgroundColor:
              selectedType === 'Bidet'
                ? theme.colors.accent
                : theme.colors.secondary,
          },
        ]}
        onPress={() => handlePress('Bidet')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.typeButtonText,
            {
              color:
                selectedType === 'Bidet'
                  ? '#FFFFFF'
                  : theme.colors.text.primary,
            },
          ]}
        >
          Bidet
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeButton,
          {
            backgroundColor:
              selectedType === 'Musollah'
                ? theme.colors.accent
                : theme.colors.secondary,
          },
        ]}
        onPress={() => handlePress('Musollah')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.typeButtonText,
            {
              color:
                selectedType === 'Musollah'
                  ? '#FFFFFF'
                  : theme.colors.text.primary,
            },
          ]}
        >
          Musollah
        </Text>
      </TouchableOpacity>
    </View>
  );
});

TypeToggle.displayName = 'TypeToggle';

/**
 * Checkbox Field Component
 */
const CheckboxField = React.memo(({ 
  label, 
  checked, 
  onToggle, 
  theme 
}: { 
  label: string;
  checked: boolean;
  onToggle: () => void;
  theme: any;
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <TouchableOpacity
      style={[
        styles.checkboxCard,
        {
          backgroundColor: theme.colors.secondary,
          borderColor: checked ? theme.colors.accent : 'transparent',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <BlurView
        intensity={20}
        tint={theme.isDarkMode ? 'dark' : 'light'}
        style={[styles.checkboxBlur, { backgroundColor: theme.colors.secondary }]}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: checked
                ? theme.colors.accent
                : 'transparent',
              borderColor: checked
                ? theme.colors.accent
                : theme.colors.text.muted,
            },
          ]}
        >
          {checked && (
            <FontAwesome6 name="check" size={12} color="#FFFFFF" solid />
          )}
        </View>
        <Text style={[styles.checkboxLabel, { color: theme.colors.text.primary }]}>
          {label}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );
});

CheckboxField.displayName = 'CheckboxField';

// =====================================================================
// MAIN COMPONENT
// =====================================================================

const AddLocationSheet: React.FC<AddLocationSheetProps> = ({ visible, onClose }) => {
  const { theme, isDarkMode} = useTheme();

  // ===================================================================
  // STATE
  // ===================================================================

  const [locationType, setLocationType] = useState<LocationType>('Bidet');
  const [buildingName, setBuildingName] = useState('');
  const [address, setAddress] = useState('');
  const [postal, setPostal] = useState('');

  // Bidet-specific
  const [maleFacility, setMaleFacility] = useState(false);
  const [femaleFacility, setFemaleFacility] = useState(false);
  const [accessibleFacility, setAccessibleFacility] = useState(false);

  // Musollah-specific
  const [segregated, setSegregated] = useState(false);
  const [airConditioned, setAirConditioned] = useState(false);
  const [ablutionArea, setAblutionArea] = useState(false);
  const [slippers, setSlippers] = useState(false);
  const [prayerMats, setPrayerMats] = useState(false);
  const [telekung, setTelekung] = useState(false);
  const [directions, setDirections] = useState('');

  // ===================================================================
  // MUTATION
  // ===================================================================

  const { mutate: submitRequest, isPending } = useSubmitLocationRequest();

  // ===================================================================
  // HANDLERS
  // ===================================================================

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const resetForm = () => {
    setBuildingName('');
    setAddress('');
    setPostal('');
    setMaleFacility(false);
    setFemaleFacility(false);
    setAccessibleFacility(false);
    setSegregated(false);
    setAirConditioned(false);
    setAblutionArea(false);
    setSlippers(false);
    setPrayerMats(false);
    setTelekung(false);
    setDirections('');
  };

  const validateForm = (): string | null => {
    if (!buildingName.trim()) {
      return 'Building name is required';
    }
    if (!address.trim()) {
      return 'Address is required';
    }
    if (!postal.trim()) {
      return 'Postal code is required';
    }
    if (postal.length !== 6) {
      return 'Postal code must be 6 digits';
    }
    return null;
  };

  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: error,
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const requestData: any = {
      type: locationType,
      buildingName: buildingName.trim(),
      address: address.trim(),
      postal: postal.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (locationType === 'Bidet') {
      requestData.male = maleFacility;
      requestData.female = femaleFacility;
      requestData.handicap = accessibleFacility;
    } else {
      requestData.segregated = segregated;
      requestData.airConditioned = airConditioned;
      requestData.ablutionArea = ablutionArea;
      requestData.slippers = slippers;
      requestData.prayerMats = prayerMats;
      requestData.telekung = telekung;
      if (directions.trim()) {
        requestData.directions = directions.trim();
      }
    }

    submitRequest(requestData, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: 'success',
          text1: 'Request Submitted! 🎉',
          text2: 'Thank you! We\'ll review your submission.',
          position: 'top',
          visibilityTime: 3000,
        });
        resetForm();
        onClose();
      },
      onError: (error: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: 'error',
          text1: 'Submission Failed',
          text2: error.message || 'Please try again later',
          position: 'top',
          visibilityTime: 3000,
        });
      },
    });
  };

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.secondary }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="arrow-left" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Request New Location
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
                Help us expand our database
              </Text>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Type Toggle */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                Location Type
              </Text>
              <TypeToggle
                selectedType={locationType}
                onTypeChange={setLocationType}
                theme={theme}
              />
            </MotiView>

            {/* Building Name */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 50, damping: 20 }}
            >
              <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>
                Building Name <Text style={{ color: '#ff6b6b' }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.secondary,
                  },
                ]}
                placeholder="e.g., Tampines Mall"
                placeholderTextColor={theme.colors.text.muted}
                value={buildingName}
                onChangeText={setBuildingName}
                maxLength={100}
              />
            </MotiView>

            {/* Address */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 100, damping: 20 }}
            >
              <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>
                Address <Text style={{ color: '#ff6b6b' }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.secondary,
                  },
                ]}
                placeholder="e.g., 4 Tampines Central 5"
                placeholderTextColor={theme.colors.text.muted}
                value={address}
                onChangeText={setAddress}
                maxLength={200}
              />
            </MotiView>

            {/* Postal Code */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 150, damping: 20 }}
            >
              <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>
                Postal Code <Text style={{ color: '#ff6b6b' }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.secondary,
                  },
                ]}
                placeholder="e.g., 529510"
                placeholderTextColor={theme.colors.text.muted}
                value={postal}
                onChangeText={setPostal}
                maxLength={6}
                keyboardType="number-pad"
              />
            </MotiView>

            {/* Conditional Fields */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 200, damping: 20 }}
            >
              <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                {locationType === 'Bidet' ? 'Facilities Available' : 'Amenities'}
              </Text>

              {locationType === 'Bidet' ? (
                <>
                  <CheckboxField
                    label="Male Facility"
                    checked={maleFacility}
                    onToggle={() => setMaleFacility(!maleFacility)}
                    theme={theme}
                  />
                  <CheckboxField
                    label="Female Facility"
                    checked={femaleFacility}
                    onToggle={() => setFemaleFacility(!femaleFacility)}
                    theme={theme}
                  />
                  <CheckboxField
                    label="Accessible/Handicap Facility"
                    checked={accessibleFacility}
                    onToggle={() => setAccessibleFacility(!accessibleFacility)}
                    theme={theme}
                  />
                </>
              ) : (
                <>
                  <View style={styles.checkboxRow}>
                    <View style={styles.checkboxHalf}>
                      <CheckboxField
                        label="Segregated"
                        checked={segregated}
                        onToggle={() => setSegregated(!segregated)}
                        theme={theme}
                      />
                    </View>
                    <View style={styles.checkboxHalf}>
                      <CheckboxField
                        label="Air Conditioned"
                        checked={airConditioned}
                        onToggle={() => setAirConditioned(!airConditioned)}
                        theme={theme}
                      />
                    </View>
                  </View>

                  <View style={styles.checkboxRow}>
                    <View style={styles.checkboxHalf}>
                      <CheckboxField
                        label="Ablution Area"
                        checked={ablutionArea}
                        onToggle={() => setAblutionArea(!ablutionArea)}
                        theme={theme}
                      />
                    </View>
                    <View style={styles.checkboxHalf}>
                      <CheckboxField
                        label="Slippers"
                        checked={slippers}
                        onToggle={() => setSlippers(!slippers)}
                        theme={theme}
                      />
                    </View>
                  </View>

                  <View style={styles.checkboxRow}>
                    <View style={styles.checkboxHalf}>
                      <CheckboxField
                        label="Prayer Mats"
                        checked={prayerMats}
                        onToggle={() => setPrayerMats(!prayerMats)}
                        theme={theme}
                      />
                    </View>
                    <View style={styles.checkboxHalf}>
                      <CheckboxField
                        label="Telekung"
                        checked={telekung}
                        onToggle={() => setTelekung(!telekung)}
                        theme={theme}
                      />
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.text.secondary, marginTop: SPACING.lg },
                    ]}
                  >
                    Directions (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: theme.colors.secondary,
                        color: theme.colors.text.primary,
                        borderColor: theme.colors.secondary,
                      },
                    ]}
                    placeholder="e.g., Level 3, near Food Court, turn left..."
                    placeholderTextColor={theme.colors.text.muted}
                    value={directions}
                    onChangeText={setDirections}
                    multiline
                    numberOfLines={4}
                    maxLength={300}
                    textAlignVertical="top"
                  />
                </>
              )}
            </MotiView>

            {/* Info Message */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.colors.accent + '10' },
              ]}
            >
              <FontAwesome6
                name="circle-info"
                size={14}
                color={theme.colors.accent}
              />
              <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                Your submission will be reviewed by our team before being added to
                the map
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: theme.colors.accent,
                  opacity: isPending ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <FontAwesome6 name="paper-plane" size={16} color="#FFFFFF" solid />
              <Text style={styles.submitButtonText}>
                {isPending ? 'Submitting...' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// =====================================================================
// STYLES
// =====================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: SPACING.sm,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: SPACING.sm,
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxCard: {
    borderRadius: 14,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  checkboxHalf: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default AddLocationSheet;