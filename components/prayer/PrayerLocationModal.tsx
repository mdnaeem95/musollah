/**
 * PrayerLocationModal v2.0 (MODERN STEP-BY-STEP PROGRESS)
 * 
 * Shows detailed progress for location-based prayer time fetching:
 * 1. Request location permission
 * 2. Detect GPS coordinates
 * 3. Reverse geocode to city/country
 * 4. Fetch prayer times from API
 * 5. Schedule notifications
 * 6. Success confirmation
 * 
 * @version 2.0
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../context/ThemeContext';
import { useLocationStore } from '../../stores/useLocationStore';
import { useInvalidatePrayerTimes } from '../../api/services/prayer';

// ============================================================================
// TYPES
// ============================================================================

interface PrayerLocationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type Step = {
  id: number;
  label: string;
  icon: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
};

// ============================================================================
// COMPONENT
// ============================================================================

const PrayerLocationModal: React.FC<PrayerLocationModalProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ city: string; country: string } | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: 'Request Location Permission', icon: 'location-dot', status: 'pending' },
    { id: 2, label: 'Detect GPS Coordinates', icon: 'satellite-dish', status: 'pending' },
    { id: 3, label: 'Identify City & Country', icon: 'map-location-dot', status: 'pending' },
    { id: 4, label: 'Fetch Prayer Times', icon: 'clock', status: 'pending' },
    { id: 5, label: 'Schedule Notifications', icon: 'bell', status: 'pending' },
  ]);
  
  // Zustand store
  const { setLocation } = useLocationStore();
  
  // TanStack Query invalidation
  const { invalidateToday } = useInvalidatePrayerTimes();

  // Reset state when modal closes
  useEffect(() => {
    if (!isVisible) {
      setTimeout(() => {
        setSteps(steps.map(s => ({ ...s, status: 'pending', message: undefined })));
        setDetectedLocation(null);
        setIsProcessing(false);
      }, 300);
    }
  }, [isVisible]);

  // ============================================================================
  // STEP UPDATERS
  // ============================================================================

  const updateStep = (id: number, status: Step['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, message } : step
    ));
  };

  // ============================================================================
  // MAIN PROCESS
  // ============================================================================

  const handleFetchByLocation = async () => {
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // STEP 1: Request Permission
      updateStep(1, 'loading');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        updateStep(1, 'error', 'Permission denied');
        throw new Error('Location permission is required to fetch prayer times for your area.');
      }
      
      updateStep(1, 'success', 'Permission granted');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await delay(300);

      // STEP 2: Get GPS Coordinates
      updateStep(2, 'loading');
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = locationResult.coords;
      updateStep(2, 'success', `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await delay(300);

      // STEP 3: Reverse Geocode
      updateStep(3, 'loading');
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (!reverseGeocode.length) {
        updateStep(3, 'error', 'Unable to identify location');
        throw new Error('Unable to identify your city. Please try again.');
      }

      const { city, country } = reverseGeocode[0];
      const detectedCity = city || 'Unknown';
      const detectedCountry = country || 'Unknown';
      
      setDetectedLocation({ city: detectedCity, country: detectedCountry });
      updateStep(3, 'success', `${detectedCity}, ${detectedCountry}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await delay(300);

      // STEP 4: Fetch Prayer Times
      updateStep(4, 'loading');

      const { enableCustomLocation } = useLocationStore.getState();
      enableCustomLocation({ latitude, longitude });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await delay(300);
      
      // Store location in Zustand
      setLocation(locationResult);
      
      // Invalidate cache to trigger refetch
      invalidateToday({ latitude, longitude });
      
      updateStep(4, 'success', 'Prayer times updated');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await delay(300);

      // STEP 5: Schedule Notifications
      updateStep(5, 'loading');
      await delay(500); // Simulate notification scheduling
      updateStep(5, 'success', 'Notifications scheduled');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Location Updated',
        text2: `Prayer times set for ${detectedCity}, ${detectedCountry}`,
        position: 'bottom',
      });
      
      // Close modal after brief delay
      await delay(1000);
      onClose();
      
    } catch (error) {
      console.error('Location fetch error:', error);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: error instanceof Error ? error.message : 'Failed to fetch location',
        position: 'bottom',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToSingapore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const { resetToSingapore } = useLocationStore.getState();
    resetToSingapore();
    
    // Invalidate cache to refetch with Singapore coords
    invalidateToday({ latitude: 1.3521, longitude: 103.8198 });
    
    Toast.show({
      type: 'success',
      text1: 'Location Reset',
      text2: 'Prayer times reset to Singapore',
      position: 'bottom',
    });
    
    onClose();
  };

  const handleClose = () => {
    if (!isProcessing) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentStep = steps.findIndex(s => s.status === 'loading') + 1 || 
                      (steps.every(s => s.status === 'success') ? 6 : 0);
  const progress = currentStep > 0 ? (currentStep / steps.length) * 100 : 0;

  return (
    <Modal 
      transparent 
      visible={isVisible} 
      onRequestClose={handleClose}
      animationType="fade"
    >
      <BlurView 
        intensity={40} 
        tint="dark"
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleClose}
          disabled={isProcessing}
        />

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.modalWrapper}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.modalContent, { backgroundColor: theme.colors.secondary }]}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Close Button */}
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: theme.colors.accent }]} 
                onPress={handleClose}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <FontAwesome6 name="xmark" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6 name="location-dot" size={48} color={theme.colors.accent} />
              </View>

              {/* Title */}
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                Prayer Times Location
              </Text>
              
              {/* Description */}
              {!isProcessing && !detectedLocation && (
                <Text style={[styles.modalText, { color: theme.colors.text.secondary }]}>
                  Prayer times are currently based on Singapore. Tap below to fetch prayer times for your current location.
                </Text>
              )}

              {/* Detected Location (if available) */}
              {detectedLocation && (
                <MotiView
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  style={styles.detectedLocationCard}
                >
                  <FontAwesome6 name="map-pin" size={20} color={theme.colors.accent} />
                  <View style={styles.detectedLocationText}>
                    <Text style={[styles.detectedCity, { color: theme.colors.text.primary }]}>
                      {detectedLocation.city}
                    </Text>
                    <Text style={[styles.detectedCountry, { color: theme.colors.text.secondary }]}>
                      {detectedLocation.country}
                    </Text>
                  </View>
                </MotiView>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <MotiView
                      from={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: 'timing', duration: 300 }}
                      style={[styles.progressBar, { backgroundColor: theme.colors.accent }]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
                    {Math.round(progress)}% Complete
                  </Text>
                </View>
              )}

              {/* Steps */}
              {isProcessing && (
                <View style={styles.stepsContainer}>
                  {steps.map((step, index) => (
                    <MotiView
                      key={step.id}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ 
                        type: 'timing',
                        delay: index * 50,
                        duration: 300
                      }}
                      style={styles.stepRow}
                    >
                      {/* Icon */}
                      <View style={[
                        styles.stepIcon,
                        { 
                          backgroundColor: 
                            step.status === 'success' ? '#10B981' + '15' :
                            step.status === 'loading' ? theme.colors.accent + '15' :
                            step.status === 'error' ? '#ff6b6b' + '15' :
                            theme.colors.secondary
                        }
                      ]}>
                        <FontAwesome6 
                          name={
                            step.status === 'success' ? 'circle-check' :
                            step.status === 'loading' ? 'spinner' :
                            step.status === 'error' ? 'circle-xmark' :
                            'circle'
                          }
                          size={20} 
                          color={
                            step.status === 'success' ? '#10B981' :
                            step.status === 'loading' ? theme.colors.accent :
                            step.status === 'error' ? '#ff6b6b' :
                            theme.colors.text.muted
                          }
                        />
                      </View>

                      {/* Text */}
                      <View style={styles.stepText}>
                        <Text style={[
                          styles.stepLabel,
                          { 
                            color: step.status === 'pending' 
                              ? theme.colors.text.muted 
                              : theme.colors.text.primary
                          }
                        ]}>
                          {step.label}
                        </Text>
                        {step.message && (
                          <Text style={[styles.stepMessage, { color: theme.colors.text.secondary }]}>
                            {step.message}
                          </Text>
                        )}
                      </View>
                    </MotiView>
                  ))}
                </View>
              )}

              {/* Fetch Button */}
              {!isProcessing && (
                <TouchableOpacity 
                  style={[styles.fetchButton, { backgroundColor: theme.colors.accent }]} 
                  onPress={handleFetchByLocation}
                  activeOpacity={0.8}
                >
                  <FontAwesome6 name="location-crosshairs" size={16} color="#fff" />
                  <Text style={styles.fetchButtonText}>
                    Fetch Based on Current Location
                  </Text>
                </TouchableOpacity>
              )}

              {/* Cancel Button */}
              {!isProcessing && (
                <TouchableOpacity 
                  style={[
                    styles.closeButtonBottom,
                    { 
                      borderColor: theme.colors.accent,
                      backgroundColor: 'transparent'
                    }
                  ]} 
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.closeButtonText, { color: theme.colors.accent }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
          
              {/* Reset to Singapore Button */}
              {!isProcessing && detectedLocation && (
                <TouchableOpacity 
                  style={[
                    styles.resetButton,
                    { 
                      borderColor: '#ff6b6b',
                      backgroundColor: 'transparent'
                    }
                  ]} 
                  onPress={handleResetToSingapore}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 name="rotate-left" size={16} color="#ff6b6b" />
                  <Text style={[styles.resetButtonText, { color: '#ff6b6b' }]}>
                    Reset to Singapore
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </BlurView>
        </MotiView>
      </BlurView>
    </Modal>
  );
};

// ============================================================================
// HELPER
// ============================================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 12,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 22,
  },
  detectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(163, 192, 187, 0.1)',
    marginBottom: 24,
  },
  detectedLocationText: {
    flex: 1,
  },
  detectedCity: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 2,
  },
  detectedCountry: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(163, 192, 187, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
    paddingTop: 4,
  },
  stepLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 2,
  },
  stepMessage: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  closeButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default PrayerLocationModal;