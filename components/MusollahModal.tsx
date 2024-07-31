import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import React, { useState } from 'react'
import { MusollahLocation } from './Map';
import Modal from 'react-native-modal'
import { FontAwesome6 } from '@expo/vector-icons';
import { ListItem } from '@rneui/themed';

interface MosqueModalProps {
    isVisible: boolean;
    location: MusollahLocation | null;
    onClose: () => void;
}

const InfoRow = ({ label, value }: { label: string, value: string }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <FontAwesome6
        name={value.toLowerCase() === 'yes' ? 'check' : 'xmark'}
        size={20}
        color={value.toLowerCase() === 'yes' ? 'green' : 'red'}
      />
    </View>
  )
}

const MusollahModal = ({ isVisible, location, onClose }: MosqueModalProps) => {
  const directions = location?.directions.split('. ').filter(sentence => sentence.trim().length > 0);
  const [expanded, setExpanded] = useState<boolean>(false);

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

        <View style={styles.infoContainer}>
          <InfoRow label="Segregated" value={location?.segregated || 'No'} />
          <InfoRow label="Air Conditioned" value={location?.airConditioned || 'No'} />
          <InfoRow label="Ablution Area" value={location?.ablutionArea || 'No'} />
          <InfoRow label="Slippers" value={location?.slippers || 'No'} />
          <InfoRow label="Prayer Mats" value={location?.prayerMats || 'No'} />
          <InfoRow label="Telekung" value={location?.telekung || 'No'} />
        </View>
        
        <ListItem.Accordion
          content={
            <>
              <ListItem.Content>
                <ListItem.Title style={styles.directionsTitle}>Directions</ListItem.Title>
              </ListItem.Content>
            </>
          }
          isExpanded={expanded}
          onPress={() => setExpanded(!expanded)}
        >
          <View style={styles.directionsContainer}>
            {directions?.map((step, index) => (
              <Text key={index} style={styles.directionStep}>{`${index + 1}. ${step}`}</Text>
            ))}
          </View>
        </ListItem.Accordion>

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
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  infoRow: {
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    gap: 5
  },
  label: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  directionsTitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    lineHeight: 20,
    marginTop: 10,
  },
  directionsContainer: {
    width: '100%',
    marginTop: 10,
  },
  directionStep: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
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

export default MusollahModal