import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { FontAwesome6 } from '@expo/vector-icons';
import { BidetLocation } from '../../../components/musollah/Map';
import { useTheme } from '../../../context/ThemeContext';

interface BidetSheetProps {
  location: BidetLocation | null;
  visible: boolean;
  onClose: () => void;
}

export default function BidetSheet({ location, onClose, visible }: BidetSheetProps) {
  const { theme } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '80%'], []);

  useEffect(() => {
    if (!sheetRef.current) return;
  
    if (visible && location) {
      // ensure it opens on a fresh prop update
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 10);
    } else {
      sheetRef.current?.close();
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

  useEffect(() => {
    console.log('[BidetSheet] visible:', visible, 'location:', location);
  }, [visible, location]);
  
  useEffect(() => {
    console.log('[BidetSheet] mount');
    return () => {
      console.log('[BidetSheet] unmount');
    };
  }, []);  

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
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: theme.colors.secondary }]}
        >
          <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary} solid />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {location.building}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {location.address}, Singapore {location.postal}
        </Text>

        <View style={styles.infoRow}>
          <Info label="Male" value={location.male} />
          <Info label="Female" value={location.female} />
          <Info label="Handicap" value={location.handicap} />
        </View>

        <TouchableOpacity
          onPress={openMaps}
          style={[styles.mapButton, { backgroundColor: theme.colors.secondary }]}
        >
          <Text style={[styles.mapButtonText, { color: theme.colors.text.primary }]}>
            Open in Maps
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  const { theme } = useTheme();
  const icon =
    value?.toLowerCase() === 'yes'
      ? { name: 'check', color: theme.colors.text.success }
      : { name: 'xmark', color: theme.colors.text.error };

  return (
    <View style={styles.infoItem}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>{label}</Text>
      <FontAwesome6 name={icon.name} size={20} color={icon.color} />
    </View>
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20
  },
  infoItem: {
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  mapButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
});