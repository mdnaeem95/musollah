// components/musollah/BidetModal.tsx
import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BidetLocation } from './Map';

interface BidetModalProps {
  isVisible: boolean;
  location: BidetLocation | null;
  onClose: () => void;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  const { theme } = useTheme();

  const { iconName, iconColor } =
    value.toLowerCase() === 'yes'
      ? { iconName: 'check', iconColor: theme.colors.text.success }
      : value.toLowerCase() === 'no'
      ? { iconName: 'xmark', iconColor: theme.colors.text.error }
      : { iconName: 'question', iconColor: theme.colors.text.muted };

  return (
    <View style={styles.infoColumn}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>{label}</Text>
      <FontAwesome6 name={iconName} size={20} color={iconColor} />
    </View>
  );
};

const BidetModal = ({ isVisible, location, onClose }: BidetModalProps) => {
  const { theme } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['40%', '80%'], []);

  useEffect(() => {
    if (isVisible && sheetRef.current) {
      sheetRef.current.snapToIndex(0);
    } else if (!isVisible && sheetRef.current) {
      sheetRef.current.close();
    }
  }, [isVisible]);

  const openMaps = useCallback(() => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location.building}, ${location.address}`
    )}`;
    Linking.openURL(url);
  }, [location]);

  if (!location) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: theme.colors.primary }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.text.secondary }}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}
            accessibilityLabel="Close Modal"
          >
            <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary} solid />
          </TouchableOpacity>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.locationText, { color: theme.colors.text.primary }]}>{location.building}</Text>
          <Text style={[styles.distanceText, { color: theme.colors.text.secondary }]}> {location.address}, Singapore {location.postal}</Text>
        </View>

        <View style={styles.infoContainer}>
          <InfoRow label="Male" value={location.male || 'No'} />
          <InfoRow label="Female" value={location.female || 'No'} />
          <InfoRow label="Handicap" value={location.handicap || 'No'} />
        </View>

        <TouchableOpacity
          onPress={openMaps}
          style={[styles.googleMapsButton, { backgroundColor: theme.colors.muted }]}
          accessibilityLabel="Open Location in Google Maps"
        >
          <Text style={[styles.googleMapsButtonText, { color: theme.colors.text.primary }]}>Open in Maps</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    height: 38,
    width: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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