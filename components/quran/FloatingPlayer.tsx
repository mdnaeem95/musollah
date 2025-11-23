import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewProps } from 'react-native';
import { useActiveTrack } from 'react-native-track-player';
import { useLastActiveTrack } from '../../hooks/quran/useLastActiveTrack';
import { PlayPauseButton } from './AyahPlayPauseButton';
import { MovingText } from './MovingText';
import { SkipNextButton } from './SkipNextButton';
import { SkipPreviousButton } from './SkipPreviousButton';
import { useTheme } from '../../context/ThemeContext'; // ✅ add

export const FloatingPlayer = ({ style }: ViewProps) => {
  const { theme } = useTheme(); // ✅ theme aware
  const activeTrack = useActiveTrack();
  const lastActiveTrack = useLastActiveTrack();
  const [displayedTrack, setDisplayedTrack] = useState(activeTrack ?? lastActiveTrack);

  useEffect(() => {
    setDisplayedTrack(activeTrack ?? lastActiveTrack);
  }, [activeTrack, lastActiveTrack]);

  if (!displayedTrack) return null;

  const iconColor = theme.colors.text.primary;   // ✅ themed
  const titleColor = theme.colors.text.primary; // ✅ themed
  const reciterColor = theme.colors.text.muted; // ✅ themed (nice softer contrast)

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.container,
        { backgroundColor: theme.colors.secondary }, // ✅ themed bg
        style,
      ]}
    >
      <>
        {/* Track Title */}
        <View style={styles.trackTitleContainer}>
          <MovingText
            style={[styles.trackTitle, { color: titleColor }]} // ✅ themed
            text={displayedTrack.title ?? ''}
            animationThreshold={25}
          />
          <Text style={[styles.reciterName, { color: reciterColor }]}>
            {displayedTrack.artist ?? 'Unknown Reciter'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.trackControlsContainer}>
          <SkipPreviousButton iconSize={24} color={iconColor} />
          <PlayPauseButton
            iconSize={24}
            color={iconColor}
            isActiveAyah={!!activeTrack}
          />
          <SkipNextButton iconSize={24} color={iconColor} />
        </View>
      </>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525', // (kept, but overridden by themed inline style)
    padding: 10,
  },
  trackTitleContainer: {
    flex: 1,
    overflow: 'hidden',
    marginLeft: 10,
  },
  trackTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF', // (kept, but overridden)
  },
  reciterName: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#A0A0A0', // (kept, but overridden)
    marginTop: 4,
  },
  trackControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 20,
    marginRight: 16,
  },
});
