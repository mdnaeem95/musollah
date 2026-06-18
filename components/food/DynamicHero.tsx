/**
 * Dynamic Hero Section
 *
 * Time-aware gradient hero with rich atmospheric colours.
 * No BlurView overlay — text sits directly on gradient with text-shadow.
 *
 * @version 2.0
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';

import { useHeroContent } from '../../hooks/food/useHeroContent';
import StatPill from './StatPill';
import { enter } from '../../utils';

const DynamicHero = memo(() => {
  const {
    greeting,
    nextPrayer,
    timeUntil,
    backgroundGradient,
    restaurantCount,
    verifiedCount,
  } = useHeroContent();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
    >
      <LinearGradient
        colors={backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Subtle noise overlay */}
        <View style={styles.noiseOverlay} />

        {/* Content */}
        <View style={styles.content}>
          {/* Top */}
          <View style={styles.top}>
            <MotiText
              from={{ opacity: 0, translateY: -14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 80, type: 'timing', duration: 500 }}
              style={styles.greeting}
            >
              {greeting}
            </MotiText>
            <MotiText
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 180, type: 'timing', duration: 500 }}
              style={styles.subtitle}
            >
              Discover halal dining near you
            </MotiText>

            {/* Prayer badge */}
            {nextPrayer && (
              <MotiView
                from={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 280, type: 'timing', duration: 400 }}
                style={styles.prayerBadge}
              >
                <FontAwesome6 name="mosque" size={12} color="rgba(255,255,255,0.90)" />
                <Text style={styles.prayerText}>
                  {nextPrayer} in {timeUntil}
                </Text>
              </MotiView>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatPill icon="store"       label={`${restaurantCount}+`}  delay={400} />
            <StatPill icon="certificate" label="MUIS Verified"           delay={480} />
          </View>
        </View>
      </LinearGradient>
    </MotiView>
  );
});

DynamicHero.displayName = 'DynamicHero';

const styles = StyleSheet.create({
  hero: {
    minHeight: 220,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  content: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
    gap: 20,
  },
  top: {
    gap: 6,
  },
  greeting: {
    fontSize: 26,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.30)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255,255,255,0.72)',
    textShadowColor: 'rgba(0,0,0,0.20)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  prayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    marginTop: 6,
  },
  prayerText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default DynamicHero;
