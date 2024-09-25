import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { BidetLocation } from './Map';
import Modal from 'react-native-modal';
import { FontAwesome6 } from '@expo/vector-icons';

interface BidetModalProps {
  isVisible: boolean;
  location: BidetLocation | null;
  onClose: () => void;
}

const InfoRow = ({ label, value }: { label: string, value: string }) => {
  let iconName;
  let iconColor;

  switch (value.toLowerCase()) {
    case 'yes':
      iconName = 'check';
      iconColor = 'green';
      break;
    case 'no':
      iconName = 'xmark';
      iconColor = 'red';
      break;
    case 'unknown':
      iconName = 'question';
      iconColor = 'black';
      break;
    default:
      iconName = null;
  }

  return (
    <View style={styles.infoColumn}>
      <Text style={styles.label}>{label}</Text>
      {iconName ? (
        <FontAwesome6 name={iconName} size={20} color={iconColor} />
      ) : (
        <Text style={styles.valueText}>{value}</Text>
      )}
    </View>
  );
};

const BidetModal = ({ isVisible, location, onClose }: BidetModalProps) => {
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
      <View style={styles.contentContainer}>
        <View style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome6 name="xmark" size={18} color="white" solid />
          </TouchableOpacity>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.locationText}>{location?.building}</Text>
          <Text style={styles.distanceText}>
            {location?.address}, Singapore {location?.postal}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <InfoRow label="Male" value={location?.male || 'No'} />
          <InfoRow label="Female" value={location?.female || 'No'} />
          <InfoRow label="Handicap" value={location?.handicap || 'No'} />
        </View>

        <TouchableOpacity onPress={openMaps} style={styles.googleMapsButton}>
          <Text style={styles.googleMapsButtonText}>Open in Maps</Text>
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
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  // Close button positioning
  closeButton: {           // Distance from the left
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: '#A3C0BB',
    alignItems: 'center',
    justifyContent: 'center',
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
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20,
    width: '100%',
  },
  infoColumn: {
    alignItems: 'center',
  },
  label: {
    marginBottom: 5,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  valueText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: 'black',
  },
  googleMapsButton: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  googleMapsButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default BidetModal;
