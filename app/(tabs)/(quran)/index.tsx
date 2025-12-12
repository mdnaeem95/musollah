/**
 * Quran Dashboard (MODERN REDESIGN v2.0)
 * 
 * Features:
 * - Prayer-aware hero section with Islamic greeting
 * - Glassmorphism cards with BlurView
 * - Staggered entrance animations (50ms delay)
 * - Haptic feedback on interactions
 * - Better visual hierarchy and spacing
 * - Enhanced Last Read/Listened cards
 * - Quick stats and progress indicators
 * 
 * @version 2.0
 * @lastUpdated December 2025
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import DailyAyah from '../../../components/quran/DailyAyah';
import RecitationProgress from '../../../components/quran/RecitationProgress';
import { useTheme } from '../../../context/ThemeContext';
import { getLastReadAyah, getLastListenedAyah } from '../../../utils/quran/storage';
import { useQuranStore } from '../../../stores/useQuranStore';

const { width } = Dimensions.get('window');

const QuranDashboard = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  
  const [lastReadAyah, setLastReadAyah] = useState({ ayahNumber: 0, surahNumber: 0 });
  const [lastListenedAyah, setLastListenedAyah] = useState({ ayahIndex: 0, surahNumber: 0 });
  
  // Get bookmarks count from store
  const bookmarks = useQuranStore((state) => state.bookmarks);

  // Load last read/listened on focus
  useFocusEffect(
    useCallback(() => {
      const lastListened = getLastListenedAyah();
      const lastRead = getLastReadAyah();

      if (lastListened) {
        setLastListenedAyah(lastListened);
      }

      if (lastRead) {
        setLastReadAyah(lastRead);
      }
    }, [])
  );

  // Prayer-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    if (hour >= 18 && hour < 21) return 'Good Evening';
    return 'Good Night';
  }, []);

  // Hero gradient colors based on time
  const heroGradient = useMemo<readonly [string, string]>(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return ['#FFE5B4', '#FFA500'] as const; // Morning
    }
    if (hour >= 12 && hour < 18) {
      return ['#87CEEB', '#4682B4'] as const; // Afternoon
    }
    if (hour >= 18 && hour < 20) {
      return ['#FF6B6B', '#8B4513'] as const; // Evening
    }
    return ['#2C3E50', '#34495E'] as const; // Night
  }, []);

  // Main navigation items (2x2 grid, larger cards)
  const mainActions = [
    {
      label: 'Read Quran',
      icon: 'book-quran',
      route: '/surahs',
      description: '114 Surahs',
    },
    {
      label: 'Listen',
      icon: 'headphones',
      route: '/surahs',
      description: 'Audio recitation',
    },
    {
      label: 'Bookmarks',
      icon: 'bookmark',
      route: '/bookmarks',
      description: `${bookmarks.length} saved`,
    },
    {
      label: 'Duas',
      icon: 'hands-praying',
      route: '/doas',
      description: 'Supplications',
    },
  ];

  // Handle navigation with haptics
  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 0 }}
        >
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroContent}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.heroTitle}>Assalamu Alaikum</Text>
              <Text style={styles.heroSubtitle}>
                "And We have certainly made the Qur'an easy for remembrance" - 54:17
              </Text>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Main Actions Grid (2x2) */}
        <View style={styles.mainActionsContainer}>
          {mainActions.map((action, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateY: 20, scale: 0.9 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{
                type: 'spring',
                damping: 20,
                delay: (index + 1) * 50,
              }}
              style={styles.mainActionWrapper}
            >
              <TouchableOpacity
                onPress={() => handleNavigate(action.route)}
                activeOpacity={0.8}
              >
                <BlurView
                  intensity={20}
                  tint={isDarkMode ? 'dark' : 'light'}
                  style={[
                    styles.mainActionCard,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                >
                  <View
                    style={[
                      styles.mainActionIcon,
                      { backgroundColor: theme.colors.accent + '15' },
                    ]}
                  >
                    <FontAwesome6
                      name={action.icon}
                      size={28}
                      color={theme.colors.accent}
                      solid
                    />
                  </View>
                  <Text style={[styles.mainActionLabel, { color: theme.colors.text.primary }]}>
                    {action.label}
                  </Text>
                  <Text style={[styles.mainActionDescription, { color: theme.colors.text.secondary }]}>
                    {action.description}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {/* Daily Ayah Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'spring',
            damping: 20,
            delay: 250,
          }}
        >
          <View style={styles.sectionHeader}>
            <FontAwesome6
              name="star-and-crescent"
              size={16}
              color={theme.colors.accent}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Daily Ayah
            </Text>
          </View>
          <DailyAyah />
        </MotiView>

        {/* Recitation Progress */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'spring',
            damping: 20,
            delay: 300,
          }}
        >
          <View style={styles.sectionHeader}>
            <FontAwesome6
              name="chart-line"
              size={16}
              color={theme.colors.accent}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Your Progress
            </Text>
          </View>
          <RecitationProgress />
        </MotiView>

        {/* Last Listened */}
        {lastListenedAyah.surahNumber > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              damping: 20,
              delay: 350,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: `/surahs/${lastListenedAyah.surahNumber}`,
                  params: { ayahIndex: lastListenedAyah.ayahIndex },
                });
              }}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={20}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                  styles.continueCard,
                  { backgroundColor: theme.colors.secondary },
                ]}
              >
                <View style={styles.continueCardHeader}>
                  <View
                    style={[
                      styles.continueIcon,
                      { backgroundColor: theme.colors.accent + '15' },
                    ]}
                  >
                    <FontAwesome6
                      name="headphones"
                      size={20}
                      color={theme.colors.accent}
                    />
                  </View>
                  <View style={styles.continueTextContainer}>
                    <Text style={[styles.continueLabel, { color: theme.colors.text.secondary }]}>
                      Continue Listening
                    </Text>
                    <Text style={[styles.continueText, { color: theme.colors.text.primary }]}>
                      Surah {lastListenedAyah.surahNumber}, Ayah {lastListenedAyah.ayahIndex}
                    </Text>
                  </View>
                  <FontAwesome6
                    name="chevron-right"
                    size={16}
                    color={theme.colors.text.muted}
                  />
                </View>
              </BlurView>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Last Read */}
        {lastReadAyah.surahNumber > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              damping: 20,
              delay: 400,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: `/surahs/${lastReadAyah.surahNumber}`,
                  params: { ayahIndex: lastReadAyah.ayahNumber },
                });
              }}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={20}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                  styles.continueCard,
                  { backgroundColor: theme.colors.secondary },
                ]}
              >
                <View style={styles.continueCardHeader}>
                  <View
                    style={[
                      styles.continueIcon,
                      { backgroundColor: theme.colors.accent + '15' },
                    ]}
                  >
                    <FontAwesome6
                      name="book-open"
                      size={20}
                      color={theme.colors.accent}
                    />
                  </View>
                  <View style={styles.continueTextContainer}>
                    <Text style={[styles.continueLabel, { color: theme.colors.text.secondary }]}>
                      Continue Reading
                    </Text>
                    <Text style={[styles.continueText, { color: theme.colors.text.primary }]}>
                      Surah {lastReadAyah.surahNumber}, Ayah {lastReadAyah.ayahNumber}
                    </Text>
                  </View>
                  <FontAwesome6
                    name="chevron-right"
                    size={16}
                    color={theme.colors.text.muted}
                  />
                </View>
              </BlurView>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Recitation Plan Quick Access */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'spring',
            damping: 20,
            delay: 450,
          }}
        >
          <TouchableOpacity
            onPress={() => handleNavigate('/recitationPlan')}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={20}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[
                styles.recitationPlanCard,
                { backgroundColor: theme.colors.secondary },
              ]}
            >
              <View style={styles.recitationPlanContent}>
                <View
                  style={[
                    styles.recitationPlanIcon,
                    { backgroundColor: theme.colors.accent + '15' },
                  ]}
                >
                  <FontAwesome6
                    name="calendar-check"
                    size={24}
                    color={theme.colors.accent}
                  />
                </View>
                <View style={styles.recitationPlanText}>
                  <Text style={[styles.recitationPlanTitle, { color: theme.colors.text.primary }]}>
                    Recitation Plan
                  </Text>
                  <Text style={[styles.recitationPlanSubtitle, { color: theme.colors.text.secondary }]}>
                    Set your Quran completion goal
                  </Text>
                </View>
                <FontAwesome6
                  name="chevron-right"
                  size={20}
                  color={theme.colors.accent}
                />
              </View>
            </BlurView>
          </TouchableOpacity>
        </MotiView>

        {/* Bottom Padding */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Hero Section
  hero: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    minHeight: 140,
  },
  heroContent: {
    gap: 6,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#fff',
    opacity: 0.85,
    lineHeight: 19,
  },

  // Main Actions Grid
  mainActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  mainActionWrapper: {
    width: (width - 52) / 2, // 20px padding on each side + 12px gap
  },
  mainActionCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mainActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainActionLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  mainActionDescription: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Continue Cards (Last Read/Listened)
  continueCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  continueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  continueIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueTextContainer: {
    flex: 1,
    gap: 4,
  },
  continueLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  continueText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Recitation Plan Card
  recitationPlanCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  recitationPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recitationPlanIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recitationPlanText: {
    flex: 1,
    gap: 4,
  },
  recitationPlanTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
  },
  recitationPlanSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
});

export default QuranDashboard;