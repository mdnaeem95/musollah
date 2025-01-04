import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Modal from 'react-native-modal';
import { FontAwesome6 } from '@expo/vector-icons';
import { MosqueLocation } from './Map';
import { ThemeContext } from '../context/ThemeContext';

interface MosqueModalProps {
  isVisible: boolean;
  location: MosqueLocation | null;
  onClose: () => void;
}

const MosqueModal = ({ isVisible, location, onClose }: MosqueModalProps) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location?.building}, ${location?.address}`;
    Linking.openURL(url);
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      backdropOpacity={0.3}
      animationIn="zoomIn"
      animationOut="zoomOut"
      useNativeDriver
      style={styles.modal}
    >
      <View style={[styles.contentContainer, { backgroundColor: activeTheme.colors.primary }]}>
        <View style={{ width: '100%' }}>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              { backgroundColor: activeTheme.colors.accent },
            ]}
          >
            <FontAwesome6 name="xmark" size={18} color={activeTheme.colors.text.primary} solid />
          </TouchableOpacity>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.locationText, { color: activeTheme.colors.text.primary }]}>
            {location?.building}
          </Text>
          <Text style={[styles.distanceText, { color: activeTheme.colors.text.secondary }]}>
            {location?.address}
          </Text>
        </View>

        {location?.shia && (
          <Text
            style={[
              styles.disclaimerText,
              { color: activeTheme.colors.text.muted },
            ]}
          >
            Note: This is a Shia mosque.
          </Text>
        )}

        <TouchableOpacity
          onPress={openMaps}
          style={[
            styles.googleMapsButton,
            { backgroundColor: activeTheme.colors.accent },
          ]}
        >
          <Text style={[styles.googleMapsButtonText, { color: activeTheme.colors.text.primary }]}>
            Open in Maps
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '80%',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  closeButton: {
    height: 38,
    width: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  locationText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 20,
    lineHeight: 21,
  },
  distanceText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    lineHeight: 21,
    textAlign: 'center',
  },
  googleMapsButton: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  googleMapsButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
  disclaimerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default MosqueModal;
