import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../context/ThemeContext';
import { useUpdateLocationStatus } from '../../../api/services/musollah';
import Modal from 'react-native-modal';

interface ReportStatusSheetProps {
  visible: boolean;
  onClose: () => void;
  type: 'bidet' | 'musollah';
  locationId: string;
  currentStatus?: 'Available' | 'Unavailable' | 'Unknown';
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
  currentStatus = 'Unknown',
}: ReportStatusSheetProps) {
  const { theme } = useTheme();
  const { mutate: updateStatus, isPending } = useUpdateLocationStatus();
  const [selectedStatus, setSelectedStatus] = useState<'Available' | 'Unavailable' | 'Unknown'>(
    currentStatus
  );

  // Sync local state when modal opens or current status changes
  useEffect(() => {
    if (visible) {
      setSelectedStatus(currentStatus);
    }
  }, [visible, currentStatus]);

  const handleSelect = (status: 'Available' | 'Unavailable' | 'Unknown') => {
    setSelectedStatus(status); // Instant UI feedback

    updateStatus(
      {
        type,
        id: locationId,
        status,
      },
      {
        onSuccess: () => {
          Toast.show({ 
            type: 'success', 
            text1: 'Status updated!',
            text2: `Location marked as ${status}`,
          });
          onClose();
        },
        onError: (error) => {
          console.error('Failed to update location status:', error);
          Toast.show({ 
            type: 'error', 
            text1: 'Failed to update status',
            text2: 'Please try again',
          });
          // Revert UI on error
          setSelectedStatus(currentStatus);
        },
      }
    );
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
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Report Current Status
        </Text>
        <View style={styles.buttonGroup}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.button,
                { backgroundColor: theme.colors.secondary },
                selectedStatus === status && styles.selectedButton,
              ]}
              onPress={() => handleSelect(status)}
              disabled={isPending}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.text.primary },
                  selectedStatus === status && styles.selectedText,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.cancelButton}
          disabled={isPending}
        >
          <Text style={[styles.cancelText, { color: theme.colors.text.secondary }]}>
            Cancel
          </Text>
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
  selectedButton: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  selectedText: {
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});