/**
 * Prayer Location Modal
 * 
 * Modal for fetching prayer times based on user's current GPS location.
 * Replaces default Singapore location with user's actual coordinates.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useLocationStore } from '../../stores/useLocationStore';
import { useInvalidatePrayerTimes } from '../../api/services/prayer';

// ============================================================================
// TYPES
// ============================================================================

interface PrayerLocationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PrayerLocationModal: React.FC<PrayerLocationModalProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  // Zustand store
  const { fetchLocation, userLocation } = useLocationStore();
  
  // TanStack Query invalidation
  const { invalidateToday } = useInvalidatePrayerTimes();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFetchByLocation = async () => {
    try {
      setLoading(true);
      
      // Fetch user's current GPS location
      await fetchLocation();
      
      // Get the location from store (fetchLocation updates it)
      const location = useLocationStore.getState().userLocation;
      
      if (!location) {
        throw new Error('Unable to get location. Please check your location permissions.');
      }

      const { latitude, longitude } = location.coords;
      
      // Invalidate prayer times cache to trigger refetch with new location
      invalidateToday({ latitude, longitude });
      
      Toast.show({
        type: 'success',
        text1: 'Location Updated',
        text2: 'Prayer times updated for your current location',
        position: 'bottom',
      });
      
      onClose();
    } catch (error) {
      console.error('❌ Error fetching prayer times by location:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: error instanceof Error 
          ? error.message 
          : 'Failed to fetch prayer times. Please try again.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Modal 
      transparent 
      visible={isVisible} 
      onRequestClose={handleClose}
      animationType="fade"
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <FontAwesome6 name="location-dot" size={48} color="#A3C0BB" />
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>Prayer Times Location</Text>
          
          {/* Description */}
          <Text style={styles.modalText}>
            Prayer times are currently based on Singapore. You can fetch prayer times based on your current location instead.
          </Text>

          {/* Current Location Info (if available) */}
          {userLocation && (
            <View style={styles.locationInfo}>
              <FontAwesome6 name="circle-check" size={16} color="#10B981" />
              <Text style={styles.locationInfoText}>
                Location available
              </Text>
            </View>
          )}

          {/* Fetch Button */}
          <TouchableOpacity 
            style={[
              styles.fetchButton,
              loading && styles.buttonDisabled
            ]} 
            onPress={handleFetchByLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome6 name="location-crosshairs" size={16} color="#fff" />
                <Text style={styles.fetchButtonText}>
                  Fetch Based on Current Location
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity 
            style={[
              styles.closeButton,
              loading && styles.buttonDisabled
            ]} 
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(163, 192, 187, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1E1E1E',
  },
  modalText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Outfit_400Regular',
    color: '#666666',
    lineHeight: 22,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  locationInfoText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#10B981',
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
  },
  closeButtonText: {
    color: '#333333',
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default PrayerLocationModal;