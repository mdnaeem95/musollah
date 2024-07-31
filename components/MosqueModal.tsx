import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import React from 'react'
import { MosqueLocation } from './Map';
import Modal from 'react-native-modal'
import { FontAwesome6 } from '@expo/vector-icons';

interface MosqueModalProps {
    isVisible: boolean;
    location: MosqueLocation | null;
    onClose: () => void;
}

const MosqueModal = ({ isVisible, location, onClose}: MosqueModalProps) => {
  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location?.building}, ${location?.address}`
    Linking.openURL(url);
  }

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
        <View style={{ width: '100%' }}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome6 name='xmark' size={18} color='white' solid />
          </TouchableOpacity>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.locationText}>{location?.building}</Text>
          <Text style={styles.distanceText}>{location?.address}</Text>
        </View>

        {location?.shia && (
          <Text style={styles.disclaimerText}>Note: This is a Shia mosque.</Text>
        )}

        <TouchableOpacity onPress={openMaps} style={styles.googleMapsButton}>
          <Text style={styles.googleMapsButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </Modal>      
  )
}

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
    backgroundColor: '#A3C0BB', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 10, 
  },
  textContainer: {
    width: '100%', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 10
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
    textAlign: 'center'
  },
  googleMapsButton: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10
  },
  googleMapsButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFFFFF'
  },
  disclaimerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    fontStyle: 'italic',
    color: 'gray',
    marginTop: 10,
    textAlign: 'center'
  },
})

export default MosqueModal