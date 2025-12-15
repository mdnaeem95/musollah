/**
 * Address Card Component
 * 
 * Displays address with copy functionality and directions button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { enter } from '../../utils';

interface AddressCardProps {
  address: string;
  distance?: string;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, distance }) => {
  const { theme } = useTheme();
  
  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(address);
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Copied!', 'Address copied to clipboard');
  };
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <View style={[styles.card, {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.muted,
      }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, {
            backgroundColor: theme.colors.accent + '15',
          }]}>
            <FontAwesome6 name="location-dot" size={16} color={theme.colors.accent} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Location
          </Text>
          {distance && (
            <View style={[styles.distanceBadge, {
              backgroundColor: theme.colors.accent + '15',
            }]}>
              <Text style={[styles.distanceText, { color: theme.colors.accent }]}>
                {distance}
              </Text>
            </View>
          )}
        </View>
        
        {/* Address */}
        <Text style={[styles.address, { color: theme.colors.text.secondary }]}>
          {address}
        </Text>
        
        {/* Copy Button */}
        <TouchableOpacity
          style={[styles.copyButton, {
            backgroundColor: theme.colors.primary,
          }]}
          onPress={handleCopyAddress}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="copy" size={14} color={theme.colors.accent} />
          <Text style={[styles.copyText, { color: theme.colors.accent }]}>
            Copy Address
          </Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  address: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 22,
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  copyText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default AddressCard;