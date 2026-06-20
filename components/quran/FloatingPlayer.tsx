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
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';
import { useRouter } from 'expo-router';
import { useLastActiveTrack } from '../../hooks/quran/useLastActiveTrack';
import { PlayPauseButton } from './AyahPlayPauseButton';
import { MovingText } from './MovingText';
import { SkipNextButton } from './SkipNextButton';
import { SkipPreviousButton } from './SkipPreviousButton';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { enter } from '../../utils';

export const FloatingPlayer = ({ style }: ViewProps) => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const activeTrack = useActiveTrack();
  const lastActiveTrack = useLastActiveTrack();
  const [displayedTrack, setDisplayedTrack] = useState(activeTrack ?? lastActiveTrack);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const track = activeTrack ?? lastActiveTrack;
    setDisplayedTrack(track);
    setIsVisible(!!track);
  }, [activeTrack, lastActiveTrack]);

  // Track ids are `${surahNumber}-${ayahIndex}` — open the full Listen player.
  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const surahNumber = displayedTrack?.id?.split('-')[0];
    if (surahNumber) router.push(`/listen/${surahNumber}`);
  };

  const handleStop = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVisible(false);
    await TrackPlayer.reset();
  };

  if (!displayedTrack || !isVisible) return null;

  const iconColor = isDarkMode ? 'rgba(255,255,255,0.88)' : theme.colors.text.primary;
  const titleColor = isDarkMode ? 'rgba(255,255,255,0.88)' : theme.colors.text.primary;
  const reciterColor = isDarkMode ? 'rgba(255,255,255,0.55)' : theme.colors.text.secondary;

  return (
    <MotiView
      from={{ translateY: 100, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      exit={{ translateY: 100, opacity: 0 }}
      transition={enter(0)}
      style={styles.wrapper}
    >
      <BlurView
        intensity={30}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[
          styles.container,
          {
            backgroundColor: isDarkMode ? 'rgba(6,11,24,0.92)' : 'rgba(238,242,255,0.92)',
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          },
          style,
        ]}
      >
        <View style={styles.content}>
          {/* Track Info — tap to open the full Listen player */}
          <TouchableOpacity activeOpacity={0.7} onPress={handleOpen} style={styles.trackInfo}>
            <MovingText
              style={[styles.trackTitle, { color: titleColor }]}
              text={displayedTrack.title ?? ''}
              animationThreshold={25}
            />
            <Text style={[styles.reciterName, { color: reciterColor }]}>
              {displayedTrack.artist ?? 'Unknown Reciter'}
            </Text>
          </TouchableOpacity>

          {/* Controls */}
          <View style={styles.controls}>
            <SkipPreviousButton iconSize={20} color={iconColor} />
            <View style={[styles.playButton, { backgroundColor: theme.colors.accent }]}>
              <PlayPauseButton
                iconSize={18}
                color="#fff"
                isActiveAyah={!!activeTrack}
              />
            </View>
            <SkipNextButton iconSize={20} color={iconColor} />
            <TouchableOpacity onPress={handleStop} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome6 name="xmark" size={18} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>
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