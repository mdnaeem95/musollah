import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import React from 'react'
import { BidetLocation } from './Map';
import Modal from 'react-native-modal'
import { FontAwesome6 } from '@expo/vector-icons';

interface BidetModalProps {
    isVisible: boolean;
    location: BidetLocation | null;
    onClose: () => void;
}

const BidetModal = ({ isVisible, location, onClose }: BidetModalProps) => {

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
            <Text style={styles.distanceText}>{location?.address}, Singapore {location?.postal}</Text>
          </View>

          <View style={styles.infoContainer}>
              <View style={styles.genderContainer}>
                <FontAwesome6 name="person" size={24} />
                <Text style={styles.statusText}>{location?.male}</Text>
              </View>
              <View style={styles.genderContainer}>
                <FontAwesome6 name="person-dress" size={24} />
                <Text style={styles.statusText}>{location?.female}</Text>
              </View>
              <View style={styles.genderContainer}>
                <FontAwesome6 name="accessible-icon" size={24} />
                <Text style={styles.statusText}>{location?.handicap}</Text>
              </View>
          </View>

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
        alignItems: 'center', 
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
      infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly', 
        gap: 20, 
        marginTop: 20,
        width: '100%'
      },
      genderContainer: {
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 10
      },
      statusText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
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
      }
})

export default BidetModal