/**
 * Quick Action Bar Component
 * 
 * Prominent action buttons for call, directions, share.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Share, Platform } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { enter } from '../../utils';

interface QuickActionBarProps {
  restaurantId: string;
  restaurantName: string;
  address: string;
  latitude: number;
  longitude: number;
  website?: string;
}

const QuickActionBar: React.FC<QuickActionBarProps> = ({
  restaurantId,
  restaurantName,
  address,
  latitude,
  longitude,
  website,
}) => {
  const { theme } = useTheme();
  
  const handleDirections = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  };
  
  const handleShare = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: `Check out ${restaurantName} - ${address}`,
        title: restaurantName,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };
  
  const handleWebsite = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (website) Linking.openURL(website);
  };
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <View style={styles.container}>
        {/* Directions */}
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction, {
            backgroundColor: theme.colors.accent,
          }]}
          onPress={handleDirections}
          activeOpacity={0.8}
        >
          <FontAwesome6 name="location-arrow" size={18} color="#fff" />
          <Text style={styles.primaryActionText}>Directions</Text>
        </TouchableOpacity>
        
        {/* Share */}
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryAction, {
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.muted,
          }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <FontAwesome6 name="share-nodes" size={18} color={theme.colors.accent} />
        </TouchableOpacity>
        
        {/* Website */}
        {website && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction, {
              backgroundColor: theme.colors.secondary,
              borderColor: theme.colors.muted,
            }]}
            onPress={handleWebsite}
            activeOpacity={0.8}
          >
            <FontAwesome6 name="globe" size={18} color={theme.colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  primaryAction: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
  },
  secondaryAction: {
    width: 52,
    borderWidth: 1.5,
  },
});

export default QuickActionBar;