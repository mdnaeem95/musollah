/**
 * Category Pill Component v3.1
 * 
 * Enhanced category filter with:
 * - UNIFORM WIDTH (no more varying sizes)
 * - Dynamic icon from utility
 * - Restaurant count badge
 * - Selected state with accent color
 * - Haptic feedback (iOS)
 * - Staggered entrance animations
 * - 3D press effect
 * 
 * @version 3.1 - Fixed uniform width
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';

interface CategoryPillProps {
  category: string;
  count: number;
  isSelected: boolean;
  onPress: () => void;
  index?: number;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ 
  category, 
  count, 
  isSelected, 
  onPress,
  index = 0,
}) => {
  const { theme, isDarkMode } = useTheme();  
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };
  
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        delay: index * 40,
        damping: 15,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        {/* ✅ Glassmorphism Pill */}
        <BlurView
          intensity={isSelected ? 25 : 15}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            styles.pill,
            {
              backgroundColor: isSelected 
                ? theme.colors.accent + '20'
                : theme.colors.secondary,
              borderColor: isSelected 
                ? theme.colors.accent
                : 'transparent',
            }
          ]}
        >          
          {/* Category Name */}
          <Text 
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.text,
              {
                color: isSelected 
                  ? theme.colors.accent 
                  : theme.colors.text.primary,
                fontFamily: isSelected 
                  ? 'Outfit_700Bold' 
                  : 'Outfit_500Medium',
              }
            ]}
          >
            {category}
          </Text>
          
          {/* Count Badge */}
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: (index * 40) + 150 }}
            style={[
              styles.countBadge,
              {
                backgroundColor: isSelected 
                  ? theme.colors.accent 
                  : theme.colors.accent + '20',
              }
            ]}
          >
            <Text 
              style={[
                styles.countText,
                {
                  color: isSelected ? '#fff' : theme.colors.accent,
                }
              ]}
            >
              {count}
            </Text>
          </MotiView>
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginRight: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // ✅ Center content
    gap: 8,
    minWidth: 120, // ✅ Fixed minimum width for uniformity
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1, // ✅ Takes available space between edges and badge
    textAlign: 'center', // ✅ Center text
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
});

export default CategoryPill;