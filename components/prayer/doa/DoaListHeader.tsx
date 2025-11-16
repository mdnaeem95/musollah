import React, { memo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import type { DoaHeaderProps } from '../../../types/doa.types';

/**
 * Header component for Doa list with info button
 * Following SRP - only responsible for header UI
 */
const DoaListHeader: React.FC<DoaHeaderProps> = ({
  onInfoPress,
  backgroundColor,
  iconColor,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={onInfoPress}
      accessibilityRole="button"
      accessibilityLabel="Show information about Duas"
      accessibilityHint="Tap to learn more about reciting Duas"
    >
      <FontAwesome6 name="circle-info" size={15} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default memo(DoaListHeader);