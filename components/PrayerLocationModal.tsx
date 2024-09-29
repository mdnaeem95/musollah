import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { fetchUserLocation } from '../redux/slices/userLocationSlice';
import { fetchPrayerTimesByLocationData, fetchPrayerTimesData } from '../redux/slices/prayerSlice';
import { AppDispatch } from '../redux/store/store';
import { format } from 'date-fns';

interface PrayerLocationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const PrayerLocationModal: React.FC<PrayerLocationModalProps> = ({ isVisible, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleFetchByLocation = async () => {
    try {
      // Fetch the user's current location and use it to get prayer times
      const userLocation = await dispatch(fetchUserLocation()).unwrap();
      const { latitude, longitude } = userLocation.coords;
      
      const currentDate = format(new Date(), 'dd-MM-yyyy');

      // Fetch prayer times based on the user's location
      await dispatch(fetchPrayerTimesByLocationData({ latitude, longitude, date: currentDate })).unwrap();
      onClose();
    } catch (error) {
      console.error('Error fetching prayer times by location:', error);
    }
  };

  return (
    <Modal transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Prayer Times Location</Text>
          <Text style={styles.modalText}>
            Prayer times are currently based on Singapore. You can fetch prayer times based on your current location instead.
          </Text>
          <TouchableOpacity style={styles.fetchButton} onPress={handleFetchByLocation}>
            <Text style={styles.fetchButtonText}>Fetch Based on Current Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Outfit_400Regular'
  },
  fetchButton: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular'
  },
  closeButton: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#CCC',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular'
  },
});

export default PrayerLocationModal;
