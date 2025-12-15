/**
 * Category Pill Component (UPGRADED)
 * 
 * Enhanced category pills with icons, counts, and smooth animations.
 * 
 * @version 2.0 - Icons, counts, haptics, 3D effects
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { enter } from '../../utils';

interface CategoryPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ 
  label, 
  selected, 
  onPress,
  count,
}) => {
  const { theme } = useTheme();
  const icon = getCategoryIcon(label);
  
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <MotiView
        animate={{
          backgroundColor: selected 
            ? theme.colors.accent 
            : theme.colors.secondary,
          borderColor: selected 
            ? theme.colors.accent 
            : 'transparent',
          scale: selected ? 1.02 : 1,
        }}
        transition={enter(0)}
        style={[styles.pill, {
          shadowColor: selected ? theme.colors.accent : '#000',
          shadowOffset: { width: 0, height: selected ? 4 : 2 },
          shadowOpacity: selected ? 0.3 : 0.1,
          shadowRadius: selected ? 8 : 4,
          elevation: selected ? 4 : 2,
        }]}
      >
        {/* Icon */}
        {icon && (
          <FontAwesome6
            name={icon}
            size={16}
            color={selected ? '#fff' : theme.colors.text.primary}
          />
        )}
        
        {/* Label */}
        <Text style={[styles.label, {
          color: selected ? '#fff' : theme.colors.text.primary,
        }]}>
          {label}
        </Text>
        
        {/* Count badge */}
        {count !== undefined && count > 0 && (
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={enter(0)}
            style={[styles.countBadge, {
              backgroundColor: selected 
                ? 'rgba(255,255,255,0.3)' 
                : theme.colors.accent + '20',
            }]}
          >
            <Text style={[styles.countText, {
              color: selected ? '#fff' : theme.colors.accent,
            }]}>
              {count}
            </Text>
          </MotiView>
        )}
      </MotiView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    gap: 8,
    marginRight: 8,
    marginVertical: 2
  },
  label: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
});

export default CategoryPill;