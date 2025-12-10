/**
 * View Controls Component
 * 
 * Location picker and view mode toggle (map/list/grid).
 * Provides user control over browsing experience.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';

export type ViewMode = 'map' | 'list';

interface ViewControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onLocationPress?: () => void;
  location?: string;
}

const ViewControls: React.FC<ViewControlsProps> = ({
  viewMode,
  onViewModeChange,
  onLocationPress,
  location = 'Singapore',
}) => {
  const { theme } = useTheme();
  
  const handleViewChange = (mode: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onViewModeChange(mode);
  };
  
  const handleLocationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLocationPress?.();
  };
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: 200 }}
      style={{ marginBottom: 10 }}
    >
      <View style={styles.controlsContainer}>
        {/* Location pill */}
        <TouchableOpacity 
          style={[styles.locationPill, {
            backgroundColor: theme.colors.secondary,
          }]}
          onPress={handleLocationPress}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="location-dot" size={16} color={theme.colors.accent} />
          <Text style={[styles.locationText, { color: theme.colors.text.primary }]}>
            {location}
          </Text>
          <FontAwesome6 name="chevron-down" size={12} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        
        {/* View mode toggle */}
        <View style={[styles.toggleContainer, {
          backgroundColor: theme.colors.secondary,
        }]}>
          {(['map', 'list'] as const).map((mode, index) => {
            const isSelected = viewMode === mode;
            const icon = mode === 'map' ? 'map' : 'list';
            
            return (
              <MotiView
                key={mode}
                animate={{
                  backgroundColor: isSelected 
                    ? theme.colors.accent 
                    : 'transparent',
                }}
                transition={{ type: 'spring', damping: 20 }}
                style={styles.toggleButtonWrapper}
              >
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => handleViewChange(mode)}
                  activeOpacity={0.7}
                >
                  <FontAwesome6
                    name={icon}
                    size={18}
                    color={isSelected ? '#fff' : theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </View>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  toggleButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ViewControls;