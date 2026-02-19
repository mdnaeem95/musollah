/**
 * Unit Selection - Modern Design
 * 
 * Choose how to break up reading (ayahs, surahs, juz)
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { usePlan } from '../../../../context/PlanContext';
import { calculateContrastColor, enter } from '../../../../utils';

const UNIT_OPTIONS = [
  {
    value: 'ayahs',
    label: 'By Ayahs',
    icon: 'quote-left',
    description: 'Track individual verses',
  },
  {
    value: 'surahs',
    label: 'By Surahs',
    icon: 'book',
    description: 'Complete full chapters',
  },
  {
    value: 'juz',
    label: 'By Juz',
    icon: 'layer-group',
    description: 'Follow traditional divisions',
  },
];

export default function UnitScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const { setPlan } = usePlan();

  const handleSelect = (planType: 'ayahs' | 'surahs' | 'juz') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlan({ planType });
    router.push('/recitationPlan/review');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
          style={styles.header}
        >
          <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6
              name="list-check"
              size={28}
              color={theme.colors.accent}
            />
          </View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            How would you like to break up your reading?
          </Text>
        </MotiView>

        {/* Unit Options */}
        <View style={styles.optionsContainer}>
          {UNIT_OPTIONS.map((option, index) => {
            const accentBg = theme.colors.accent;
            const accentText = calculateContrastColor(accentBg);

            return (
              <MotiView
                key={option.value}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={enter(0)}
              >
                <TouchableOpacity
                  onPress={() => handleSelect(option.value as any)}
                  activeOpacity={0.7}
                >
                  <BlurView
                    intensity={20}
                    tint={isDarkMode ? 'dark' : 'light'}
                    style={[styles.optionCard, { backgroundColor: theme.colors.secondary }]}
                  >
                    {/* Icon Badge */}
                    <View style={[styles.optionIcon, { backgroundColor: accentBg }]}>
                      <FontAwesome6
                        name={option.icon}
                        size={24}
                        color={accentText}
                      />
                    </View>

                    {/* Text Content */}
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, { color: theme.colors.text.primary }]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: theme.colors.text.secondary }]}>
                        {option.description}
                      </Text>
                    </View>

                    {/* Chevron */}
                    <FontAwesome6
                      name="chevron-right"
                      size={18}
                      color={theme.colors.text.muted}
                    />
                  </BlurView>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 20,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 16,
  },

  // Options
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});