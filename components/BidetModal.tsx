import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { BidetLocation } from './Map';
import Modal from 'react-native-modal'
import { BlurView } from 'expo-blur';

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
            <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
            <Text>{location?.building}</Text>
              <Text>{location?.address}, Singapore {location?.postal}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text>Close</Text>
              </TouchableOpacity>
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
      }
})

export default BidetModal