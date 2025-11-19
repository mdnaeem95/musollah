import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { MosqueLocation } from '../../../api/services/musollah';

interface MosqueSheetProps {
  location: MosqueLocation | null;
  visible: boolean;
  onClose: () => void;
}

export default function MosqueSheet({ location, onClose, visible }: MosqueSheetProps) {
  const { theme } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '80%'], []);

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
          {location.address}
        </Text>

        {location.shia?.toLowerCase() === 'yes' && (
          <Text style={[styles.disclaimer, { color: theme.colors.text.muted }]}>Note: This is a Shia mosque.</Text>
        )}

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
  disclaimer: {
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginTop: 12,
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