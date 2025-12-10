/**
 * Islamic Pattern Overlay (UPDATED)
 * 
 * Theme-aware geometric Islamic pattern as background decoration.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Pattern, Rect, Defs } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface IslamicPatternOverlayProps {
  opacity?: number;
}

const IslamicPatternOverlay: React.FC<IslamicPatternOverlayProps> = ({ 
  opacity = 0.08 
}) => {
  const { theme, isDarkMode } = useTheme();
  
  // Use theme-appropriate color (white for light backgrounds, lighter for dark)
  const patternColor = isDarkMode ? '#FFFFFF' : '#000000';
  
  return (
    <View style={[styles.container, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <Pattern
            id="islamicPattern"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            {/* 8-pointed star (common in Islamic art) */}
            <Path
              d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
              fill={patternColor}
            />
            {/* Connecting lines */}
            <Path
              d="M10 0 L10 20 M0 10 L20 10"
              stroke={patternColor}
              strokeWidth="0.5"
              opacity="0.3"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#islamicPattern)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default IslamicPatternOverlay;