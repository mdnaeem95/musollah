import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';

interface OfflineIndicatorProps {
  usingStaleData?: boolean;
}

/**
 * Offline indicator component
 * Shows when user is offline or using cached data
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = memo(({ 
  usingStaleData = false 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -10 }}
      transition={{ type: 'timing', duration: 200 }}
      style={styles.container}
    >
      <FontAwesome6 
        name={usingStaleData ? 'clock-rotate-left' : 'wifi-slash'} 
        size={14} 
        color={theme.colors.text.muted} 
      />
      <Text style={styles.text}>
        {usingStaleData ? 'Using Cached Data' : 'Offline Mode'}
      </Text>
    </MotiView>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
    alignSelf: 'center',
  },
  text: {
    marginLeft: 6,
    fontSize: 12,
    color: theme.colors.text.primary,
    fontFamily: 'Outfit_500Medium',
  },
});