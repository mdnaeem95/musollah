/**
 * Adhan Selection - Modern Design
 * 
 * Select and preview adhan audio
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { usePrayerSettings } from '../../../../hooks/settings/usePrayerSettings';
import { calculateContrastColor } from '../../../../utils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdhanSelectionScreen = () => {
  const { theme, isDarkMode } = useTheme();

  const {
    adhanOptions,
    selectedAdhan,
    isPlayingAdhan,
    handleAdhanSelect,
  } = usePrayerSettings();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {/* Description */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.descriptionCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={[styles.descriptionIcon, { backgroundColor: theme.colors.text.muted + '15' }]}>
              <FontAwesome6 name="circle-info" size={18} color={theme.colors.text.muted} />
            </View>
            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              Select the adhan audio you want to hear for prayer times. Tap to preview.
            </Text>
          </BlurView>
        </MotiView>

        {/* Adhan Options */}
        <FlatList
          data={adhanOptions}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const isSelected = item.label === selectedAdhan;
            const accentBg = theme.colors.accent;
            const accentText = calculateContrastColor(accentBg);

            return (
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'spring',
                  delay: index * 80,
                  damping: 20,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleAdhanSelect(item);
                  }}
                  activeOpacity={0.7}
                >
                  <BlurView
                    intensity={20}
                    tint={isDarkMode ? 'dark' : 'light'}
                    style={[
                      styles.adhanOption,
                      { backgroundColor: theme.colors.secondary },
                      isSelected && [styles.selectedOption, { backgroundColor: accentBg + '20' }],
                    ]}
                  >
                    {/* Icon or Checkmark */}
                    <View style={[
                      styles.optionIcon,
                      { backgroundColor: isSelected ? accentBg : theme.colors.accent + '15' },
                    ]}>
                      {isSelected ? (
                        <FontAwesome6
                          name="check"
                          size={18}
                          color={accentText}
                        />
                      ) : (
                        <FontAwesome6
                          name="music"
                          size={16}
                          color={theme.colors.accent}
                        />
                      )}
                    </View>

                    {/* Label */}
                    <Text
                      style={[
                        styles.adhanLabel,
                        { color: theme.colors.text.primary },
                        isSelected && [styles.selectedLabel, { color: theme.colors.accent }],
                      ]}
                    >
                      {item.label}
                    </Text>

                    {/* Play Icon */}
                    {item.file && (
                      <View style={[styles.playIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                        <FontAwesome6
                          name="play"
                          size={12}
                          color={theme.colors.accent}
                        />
                      </View>
                    )}
                  </BlurView>
                </TouchableOpacity>
              </MotiView>
            );
          }}
        />

        {/* Playing Indicator */}
        {isPlayingAdhan && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            style={styles.playingContainer}
          >
            <BlurView
              intensity={30}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.playingIndicator, { backgroundColor: theme.colors.secondary }]}
            >
              <View style={[styles.playingIcon, { backgroundColor: theme.colors.accent }]}>
                <FontAwesome6
                  name="volume-high"
                  size={18}
                  color={calculateContrastColor(theme.colors.accent)}
                />
              </View>
              <View style={styles.playingContent}>
                <Text style={[styles.playingLabel, { color: theme.colors.text.primary }]}>
                  Playing Preview
                </Text>
                <Text style={[styles.playingSubtext, { color: theme.colors.text.secondary }]}>
                  Listen to the adhan...
                </Text>
              </View>
            </BlurView>
          </MotiView>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // Description Card
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  descriptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  description: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
  },

  // List
  listContent: {
    gap: 12,
    paddingBottom: 100, // Space for playing indicator
  },

  // Adhan Option
  adhanOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedOption: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adhanLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  selectedLabel: {
    fontFamily: 'Outfit_700Bold',
  },
  playIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Playing Indicator
  playingContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  playingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playingContent: {
    flex: 1,
    gap: 4,
  },
  playingLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  playingSubtext: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
});

export default AdhanSelectionScreen;