/**
 * FloatingPlayer - Modern Design
 * 
 * Audio player with glassmorphism and smooth controls
 * 
 * @version 2.0
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useActiveTrack } from 'react-native-track-player';
import { useLastActiveTrack } from '../../hooks/quran/useLastActiveTrack';
import { PlayPauseButton } from './AyahPlayPauseButton';
import { MovingText } from './MovingText';
import { SkipNextButton } from './SkipNextButton';
import { SkipPreviousButton } from './SkipPreviousButton';
import { useTheme } from '../../context/ThemeContext';

export const FloatingPlayer = ({ style }: ViewProps) => {
  const { theme, isDarkMode } = useTheme();
  const activeTrack = useActiveTrack();
  const lastActiveTrack = useLastActiveTrack();
  const [displayedTrack, setDisplayedTrack] = useState(activeTrack ?? lastActiveTrack);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const track = activeTrack ?? lastActiveTrack;
    setDisplayedTrack(track);
    setIsVisible(!!track);
  }, [activeTrack, lastActiveTrack]);

  if (!displayedTrack || !isVisible) return null;

  const iconColor = theme.colors.text.primary;
  const titleColor = theme.colors.text.primary;
  const reciterColor = theme.colors.text.secondary;

  return (
    <MotiView
      from={{ translateY: 100, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      exit={{ translateY: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      style={styles.wrapper}
    >
      <BlurView
        intensity={30}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[
          styles.container,
          { backgroundColor: theme.colors.secondary },
          style,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={styles.content}
        >
          {/* Track Info */}
          <View style={styles.trackInfo}>
            <MovingText
              style={[styles.trackTitle, { color: titleColor }]}
              text={displayedTrack.title ?? ''}
              animationThreshold={25}
            />
            <Text style={[styles.reciterName, { color: reciterColor }]}>
              {displayedTrack.artist ?? 'Unknown Reciter'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <SkipPreviousButton iconSize={22} color={iconColor} />
            <View style={[styles.playButton, { backgroundColor: theme.colors.accent }]}>
              <PlayPauseButton
                iconSize={20}
                color="#fff"
                isActiveAyah={!!activeTrack}
              />
            </View>
            <SkipNextButton iconSize={22} color={iconColor} />
          </View>
        </TouchableOpacity>
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  trackInfo: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  reciterName: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});