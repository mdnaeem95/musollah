import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Modal from 'react-native-modal';
import { FontAwesome6 } from '@expo/vector-icons';
import { ListItem } from '@rneui/themed';
import { MusollahLocation } from './Map';
import { ThemeContext } from '../context/ThemeContext';

interface MosqueModalProps {
  isVisible: boolean;
  location: MusollahLocation | null;
  onClose: () => void;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>{label}</Text>
      <FontAwesome6
        name={value.toLowerCase() === 'yes' ? 'check' : 'xmark'}
        size={20}
        color={value.toLowerCase() === 'yes' ? activeTheme.colors.text.success : activeTheme.colors.text.error}
      />
    </View>
  );
};

const MusollahModal = ({ isVisible, location, onClose }: MosqueModalProps) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const directions = location?.directions
    ?.split('. ')
    .filter((sentence) => sentence.trim().length > 0);
  const [expanded, setExpanded] = useState<boolean>(false);

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
              <ListItem.Content style={{ backgroundColor: activeTheme.colors.primary }}>
                <ListItem.Title
                  style={[
                    styles.directionsTitle,
                    { color: activeTheme.colors.text.primary, backgroundColor: activeTheme.colors.primary },
                  ]}
                >
                  Directions
                </ListItem.Title>
              </ListItem.Content>
            </>
          }
          isExpanded={expanded}
          onPress={() => setExpanded(!expanded)}
          containerStyle={{ backgroundColor: activeTheme.colors.primary }}
        >
          <View style={[styles.directionsContainer, { backgroundColor: activeTheme.colors.primary }]}>
            {directions?.map((step, index) => (
              <Text
                key={index}
                style={[
                  styles.directionStep,
                  { color: activeTheme.colors.text.secondary },
                ]}
              >
                {`${index + 1}. ${step}`}
              </Text>
            ))}
          </View>
        </ListItem.Accordion>

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
    gap: 5,
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  googleMapsButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
});

export default MusollahModal;
