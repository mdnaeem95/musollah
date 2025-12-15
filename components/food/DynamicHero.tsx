/**
 * Dynamic Hero Section (FIXED)
 * 
 * Fixed overflow issue with proper flex layout.
 * 
 * @version 1.2 - Fixed stats overflow
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView, MotiText } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';

import { useHeroContent } from '../../hooks/food/useHeroContent';
import StatPill from './StatPill';
import IslamicPatternOverlay from './IslamicPatternOverlay';
import { enter } from '../../utils';

const DynamicHero = () => {
  const { 
    greeting, 
    nextPrayer, 
    timeUntil, 
    backgroundGradient,
    restaurantCount,
    verifiedCount,
    reviewCount,
  } = useHeroContent();
  
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
    >
      <LinearGradient
        colors={backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroContainer}
      >
        {/* Glassmorphism overlay */}
        <BlurView intensity={20} tint="light" style={styles.heroBlur}>
          {/* Top section - Greeting + Prayer */}
          <View style={styles.topSection}>
            {/* Greeting */}
            <MotiText
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              delay={100}
              style={styles.greeting}
            >
              {greeting}
            </MotiText>
            
            {/* Prayer time badge */}
            {nextPrayer && (
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                delay={300}
                style={styles.prayerBadge}
              >
                <FontAwesome6 name="mosque" size={14} color="#fff" />
                <Text style={styles.prayerText}>
                  {nextPrayer} in {timeUntil}
                </Text>
              </MotiView>
            )}
          </View>
          
          {/* Bottom section - Stats with proper wrapping */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatPill 
                icon="store" 
                label={`${restaurantCount}+`}
                delay={400}
              />
              <StatPill 
                icon="certificate" 
                label="MUIS Verified"
                delay={500}
              />
              <StatPill 
                icon="star" 
                label={`${reviewCount}+`}
                delay={600}
              />
            </View>
          </View>
        </BlurView>
        
        {/* Islamic pattern overlay (subtle, theme-aware) */}
        <IslamicPatternOverlay opacity={0.02} />
      </LinearGradient>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    minHeight: 200, // Changed from fixed height
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroBlur: {
    flex: 1,
    padding: 20, // Reduced from 24
    justifyContent: 'space-between',
  },
  topSection: {
    gap: 10,
  },
  greeting: {
    fontSize: 24, // Back to 24
    fontFamily: 'Outfit_700Bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 32,
  },
  prayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  prayerText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  statsContainer: {
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
});

export default DynamicHero;