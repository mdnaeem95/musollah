import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import React, { useContext } from 'react';
import Modal from 'react-native-modal';
import { FontAwesome6 } from '@expo/vector-icons';
import { BidetLocation } from './Map';
import { ThemeContext } from '../context/ThemeContext';

interface BidetModalProps {
  isVisible: boolean;
  location: BidetLocation | null;
  onClose: () => void;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const { iconName, iconColor } =
    value.toLowerCase() === 'yes'
      ? { iconName: 'check', iconColor: 'green' }
      : value.toLowerCase() === 'no'
      ? { iconName: 'xmark', iconColor: 'red' }
      : { iconName: 'question', iconColor: 'gray' };

  return (
    <View style={styles.infoColumn}>
      <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>{label}</Text>
      {iconName ? (
        <FontAwesome6 name={iconName} size={20} color={iconColor} />
      ) : (
        <Text style={[styles.valueText, { color: activeTheme.colors.text.secondary }]}>{value}</Text>
      )}
    </View>
  );
};

const BidetModal = ({ isVisible, location, onClose }: BidetModalProps) => {
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
        {/* Close Button */}
        <View style={{ width: '100%' }}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: activeTheme.colors.accent }]}
            accessibilityLabel="Close Modal"
            >
            <FontAwesome6 name="xmark" size={18} color={activeTheme.colors.text.primary} solid />
          </TouchableOpacity>
        </View>

        {/* Location Info */}
        <View style={styles.textContainer}>
          <Text style={[styles.locationText, { color: activeTheme.colors.text.primary }]}>
            {location?.building}
          </Text>
          <Text style={[styles.distanceText, { color: activeTheme.colors.text.secondary }]}>
            {location?.address}, Singapore {location?.postal}
          </Text>
        </View>

        {/* Facility Info */}
        <View style={styles.infoContainer}>
          <InfoRow label="Male" value={location?.male || 'No'} />
          <InfoRow label="Female" value={location?.female || 'No'} />
          <InfoRow label="Handicap" value={location?.handicap || 'No'} />
        </View>

        {/* Open in Maps Button */}
        <TouchableOpacity
          onPress={openMaps}
          style={[styles.googleMapsButton, { backgroundColor: activeTheme.colors.accent }]}
          accessibilityLabel="Open Location in Google Maps"
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
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
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
    marginVertical: 10,
    alignItems: 'center',
  },
  locationText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 20,
    textAlign: 'center',
  },
  distanceText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    width: '100%',
  },
  infoColumn: {
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    marginBottom: 5,
  },
  valueText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
  googleMapsButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  googleMapsButtonText: {
    fontFamily: 'Outfit_500Regular',
    fontSize: 16,
  },
});

export default BidetModal;
