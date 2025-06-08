import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { FontAwesome6 } from '@expo/vector-icons';
import { ListItem } from '@rneui/themed';
import { useTheme } from '../../../context/ThemeContext';
import { MusollahLocation } from '../../../utils/types';
import firestore from '@react-native-firebase/firestore';

interface MusollahSheetProps {
  locationId: string | null;
  visible: boolean;
  onClose: () => void;
}

export default function MusollahSheet({ locationId, visible, onClose }: MusollahSheetProps) {
  const { theme } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%', '80%'], []);
  const [expanded, setExpanded] = useState(false);
  const [location, setLocation] = useState<MusollahLocation | null>(null);

  useEffect(() => {
    if (!locationId || !visible) return;
  
    const unsubscribe = firestore()
      .collection('Musollahs') // lowercase unless your Firestore collection is named differently
      .doc(locationId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (!data) return;
          const normalized: MusollahLocation = {
            id: doc.id,
            building: data.Building || '',
            address: data.Address || '',
            segregated: data.Segregated || 'No',
            airConditioned: data.AirConditioned || 'No',
            ablutionArea: data.AblutionArea || 'No',
            slippers: data.Slippers || 'No',
            prayerMats: data.PrayerMats || 'No',
            telekung: data.Telekung || 'No',
            directions: data.Directions || '',
            coordinates: data.Coordinates || { latitude: 0, longitude: 0 },
            status: data.status || 'Unknown',
            lastUpdated: data.lastUpdated || null,
          };
          setLocation(normalized);
        } else {
          setLocation(null);
        }
      });
  
    return () => unsubscribe();
  }, [locationId, visible]);  

  useEffect(() => {
    if (!sheetRef.current) return;

    if (visible && location) {
      sheetRef.current.snapToIndex(0);
    } else {
      sheetRef.current.close();
    }
  }, [visible, location]);

  const openMaps = () => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location.building}, ${location.address}`
    )}`;
    Linking.openURL(url);
  };

  if (!location) return null;

  const directions = location.directions?.split('. ').filter(step => step.trim().length > 0);

  const renderInfo = (label: string, value: string) => {
    const isYes = value.toLowerCase() === 'yes';
    return (
      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>{label}</Text>
        <FontAwesome6
          name={isYes ? 'check' : 'xmark'}
          size={20}
          color={isYes ? theme.colors.text.success : theme.colors.text.error}
        />
      </View>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible && location ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={() => {
        console.log('[BidetSheet] onClose triggered');
        onClose(); // only fires if user swipes it down
      }}
      backgroundStyle={{ backgroundColor: theme.colors.primary }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.text.secondary }}
    >
      <BottomSheetView style={styles.contentContainer}>
        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.colors.secondary }]}>
          <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary} solid />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.colors.text.primary }]}>{location.building}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>{location.address}</Text>

        <View style={styles.infoContainer}>
          {renderInfo('Segregated', location.segregated || 'No')}
          {renderInfo('Air Conditioned', location.airConditioned || 'No')}
          {renderInfo('Ablution Area', location.ablutionArea || 'No')}
          {renderInfo('Slippers', location.slippers || 'No')}
          {renderInfo('Prayer Mats', location.prayerMats || 'No')}
          {renderInfo('Telekung', location.telekung || 'No')}
        </View>

        <ListItem.Accordion
          content={
            <ListItem.Content>
              <ListItem.Title style={[styles.directionsTitle, { color: theme.colors.text.primary }]}>Directions</ListItem.Title>
            </ListItem.Content>
          }
          isExpanded={expanded}
          onPress={() => setExpanded(!expanded)}
          containerStyle={{ backgroundColor: theme.colors.primary }}
        >
          <View style={styles.directionsContainer}>
            {directions?.map((step, i) => (
              <Text
                key={i}
                style={[styles.directionStep, { color: theme.colors.text.secondary }]}
              >
                {`${i + 1}. ${step}`}
              </Text>
            ))}
          </View>
        </ListItem.Accordion>

        <TouchableOpacity
          onPress={openMaps}
          style={[styles.mapButton, { backgroundColor: theme.colors.secondary }]}
        >
          <Text style={[styles.mapButtonText, { color: theme.colors.text.primary }]}>Open in Maps</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexGrow: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    borderRadius: 18,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  infoRow: {
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  directionsTitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    lineHeight: 20,
    marginTop: 10,
  },
  directionsContainer: {
    marginTop: 10,
  },
  directionStep: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  mapButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
});