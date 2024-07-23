import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { BidetLocation } from './Map';
import Modal from 'react-native-modal'
import { BlurView } from 'expo-blur';
import { FontAwesome6 } from '@expo/vector-icons';

interface BidetModalProps {
    isVisible: boolean;
    location: BidetLocation | null;
    onClose: () => void;
}

const BidetModal = ({ isVisible, location, onClose }: BidetModalProps) => {
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
        <BlurView intensity={50} style={styles.modalBackground}>
            <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 30, borderRadius: 10 }}>
                <TouchableOpacity onPress={onClose} style={{ height: 40, width: 40, borderRadius: 20, backgroundColor: '#A3C0BB', alignItems: 'center', justifyContent: 'center', left: -110, top: -15 }}>
                  <FontAwesome6 name='xmark' size={20} color='white' solid />
                </TouchableOpacity>
                <View style={{ width: '70%', alignItems: 'center', justifyContent: 'center', marginTop: 20, top: -20 }}>
                  <Text style={styles.locationText}>{location?.building}</Text>
                  <Text style={styles.distanceText}>{location?.address}, Singapore {location?.postal}</Text>
                </View>
            </View>
        </BlurView>
    </Modal>
  )
}

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
      locationText: {
        fontFamily: 'Outfit_500Medium',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 21,
      },
      distanceText: {
        fontFamily: 'Outfit_400Regular',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 21,
        textAlign: 'center'
      }
})

export default BidetModal