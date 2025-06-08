import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../context/ThemeContext';
import { updateLocationStatusInState } from '../../../redux/slices/musollahSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store/store';
import Modal from 'react-native-modal';
import { updateLocationStatusFirestore } from '../../../api/firebase/musollah';

interface ReportStatusSheetProps {
  visible: boolean;
  onClose: () => void;
  type: 'bidet' | 'musollah';
  locationId: string;
}

const statusOptions: ('Available' | 'Unavailable' | 'Unknown')[] = [
  'Available',
  'Unavailable',
  'Unknown',
];

export default function ReportStatusSheet({
  visible,
  onClose,
  type,
  locationId,
}: ReportStatusSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const locationData = useSelector((state: RootState) =>
    type === 'bidet'
      ? state.musollah.bidetLocations.find((loc) => loc.id === locationId)
      : state.musollah.musollahLocations.find((loc) => loc.id === locationId)
  );
  
  const [selectedStatus, setSelectedStatus] = useState<'Available' | 'Unavailable' | 'Unknown'>('Unknown');
  
  // Sync local state when modal opens or Redux data changes
  useEffect(() => {
    if (visible && locationData?.status) {
      setSelectedStatus(locationData.status);
    }
  }, [visible, locationData]);  

  const handleSelect = async (status: 'Available' | 'Unavailable' | 'Unknown') => {
    setSelectedStatus(status); // instant UI feedback
  
    const update = {
      type,
      id: locationId,
      status,
      lastUpdated: Date.now(),
    };
  
    try {
      dispatch(updateLocationStatusInState(update));
      await updateLocationStatusFirestore(type, locationId, status);
      Toast.show({ type: 'success', text1: 'Status updated!' });
      onClose();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to update backend.' });
    }
  };  

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Report Current Status</Text>
        <View style={styles.buttonGroup}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.button, { backgroundColor: theme.colors.secondary }]}
              onPress={() => handleSelect(status)}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: theme.colors.text.secondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  container: {
    width: '85%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});