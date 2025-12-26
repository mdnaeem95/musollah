/**
 * Progressive Image Component v1.1
 * 
 * ✅ FIXED: Handles empty/invalid URIs without warnings
 * 
 * Smooth image loading with fade-in animation and error fallback.
 * 
 * @version 1.1 - Fixed empty URI handling
 */

import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, ImageStyle, StyleProp } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface ProgressiveImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  blurHash?: string;
  fallbackIcon?: string;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({ 
  uri, 
  style, 
  blurHash,
  fallbackIcon = 'image'
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // ✅ FIX: Validate URI before rendering
  const isValidUri = uri && uri.trim().length > 0 && uri !== 'undefined' && uri !== 'null';

  // ✅ FIX: Show error state immediately for invalid URIs
  if (!isValidUri) {
    return (
      <View style={[styles.container, style, { backgroundColor: theme.colors.secondary }]}>
        <FontAwesome6 
          name={fallbackIcon} 
          size={48} 
          color={theme.colors.text.muted} 
        />
      </View>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <View style={[styles.container, style, { backgroundColor: theme.colors.secondary }]}>
        <FontAwesome6 
          name={fallbackIcon} 
          size={48} 
          color={theme.colors.text.muted} 
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
        </View>
      )}

      {/* Actual image */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ type: 'timing', duration: 400 }}
        style={StyleSheet.absoluteFill}
      >
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, style]}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          resizeMode="cover"
        />
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProgressiveImage;