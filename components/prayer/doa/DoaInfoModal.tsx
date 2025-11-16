import React, { memo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import type { DoaModalProps } from '../../../types/doa.types';

/**
 * Modal component for displaying Doa information
 * Following SRP - only responsible for modal UI
 */
const DoaInfoModal: React.FC<DoaModalProps> = ({
  visible,
  onClose,
  backgroundColor,
  textColor,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor }]}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close information"
          >
            <FontAwesome6 name="xmark" size={20} color={textColor} />
          </TouchableOpacity>
          
          <Text style={[styles.text, { color: textColor }]}>
            There are many Duas/Zikirs that we can recite. We may recite any heartfelt Dua, in any language that we
            know, either out loud or silently. This is just a guide for those who are unsure of what to ask for.
          </Text>
          
          <Text style={[styles.text, { color: textColor }]}>
            May Allah s.w.t guide us to all that which pleases Him and accept all our prayers.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: 250,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    width: '100%',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  text: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default memo(DoaInfoModal);