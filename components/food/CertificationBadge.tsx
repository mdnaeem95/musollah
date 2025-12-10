/**
 * Certification Badge Component
 * 
 * Prominent MUIS certification display with verification details.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useTheme } from '../../context/ThemeContext';

interface CertificationBadgeProps {
  certified: boolean;
  certificationBody?: string;
  expiryDate?: string;
}

const CertificationBadge: React.FC<CertificationBadgeProps> = ({ 
  certified,
  certificationBody = 'MUIS',
  expiryDate,
}) => {
  const { theme } = useTheme();
  
  if (!certified) return null;
  
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, delay: 300 }}
    >
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <BlurView intensity={20} tint="light" style={styles.content}>
          <View style={styles.iconContainer}>
            <FontAwesome6 name="certificate" size={24} color="#fff" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Halal Certified</Text>
            <Text style={styles.subtitle}>{certificationBody} Verified</Text>
          </View>
          
          <FontAwesome6 name="shield-halved" size={20} color="#fff" opacity={0.7} />
        </BlurView>
      </LinearGradient>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#fff',
    opacity: 0.9,
  },
});

export default CertificationBadge;