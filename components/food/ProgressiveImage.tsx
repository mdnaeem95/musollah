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
import { useAccent } from '../../hooks/useAccent';

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
  const { accent } = useAccent();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // ✅ FIX: Validate URI before rendering
  const isValidUri = uri && uri.trim().length > 0 && uri !== 'undefined' && uri !== 'null';

  // Branded fallback: soft accent-tinted surface + accent icon (used for
  // both invalid URIs and load errors) instead of a flat grey icon.
  if (!isValidUri || hasError) {
    return (
      <View style={[styles.container, style, { backgroundColor: accent + '14' }]}>
        <FontAwesome6
          name={fallbackIcon}
          size={32}
          color={accent + '99'}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={accent} />
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