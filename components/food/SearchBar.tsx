/**
 * Search Bar Component (HIGH VISIBILITY)
 * 
 * Enhanced visibility with stronger contrast and depth.
 * 
 * @version 2.1 - Improved visibility and contrast
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { enter } from '../../utils';

const SearchBar = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/search');
  };
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        {/* Solid background with shadow for depth */}
        <View style={[styles.searchContainer, {
          backgroundColor: theme.colors.secondary,
          borderColor: isDarkMode 
            ? 'rgba(255,255,255,0.15)' 
            : 'rgba(0,0,0,0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.3 : 0.12,
          shadowRadius: 12,
          elevation: 6,
        }]}>
          
          {/* Search icon with accent color */}
          <View style={[styles.iconContainer, {
            backgroundColor: theme.colors.accent + '15',
          }]}>
            <FontAwesome6 
              name="magnifying-glass" 
              size={18} 
              color={theme.colors.accent} 
            />
          </View>
          
          {/* Placeholder text */}
          <Text style={[styles.placeholder, { 
            color: theme.colors.text.primary,
            opacity: 0.6,
          }]}>
            Search halal restaurants...
          </Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16, // Changed from 28 for more modern look
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1.5,
    position: 'relative',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
  },
});

export default SearchBar;