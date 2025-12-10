/**
 * Quick Action Button
 * 
 * Small circular button for quick actions in restaurant cards.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

import { useTheme } from '../../context/ThemeContext';

interface QuickActionButtonProps {
  icon: string;
  onPress: () => void;
  active?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  icon, 
  onPress,
  active = false,
}) => {
  const { theme } = useTheme();
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  
  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <MotiView
        animate={{
          backgroundColor: active 
            ? theme.colors.accent 
            : theme.colors.secondary + '80',
        }}
        transition={{ type: 'spring', damping: 20 }}
        style={styles.button}
      >
        <FontAwesome6 
          name={icon} 
          size={14} 
          color={active ? '#fff' : theme.colors.text.secondary}
        />
      </MotiView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    width: '100%',
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuickActionButton;