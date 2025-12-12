/**
 * AyahPlayPauseButton - Play/Pause Control
 * 
 * @version 2.0 - Added haptic feedback
 */

import { FontAwesome6 } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";
import * as Haptics from 'expo-haptics';
import TrackPlayer, { useIsPlaying } from "react-native-track-player";

type PlayerButtonProps = {
  iconSize?: number;
  color?: string;
  isActiveAyah?: boolean;
  currentAyahIndex?: number;
  trackIndex?: number;
}

export const PlayPauseButton = ({ 
  iconSize = 20, 
  color, 
  isActiveAyah, 
  currentAyahIndex, 
  trackIndex 
}: PlayerButtonProps) => {
  const { playing } = useIsPlaying();

  const handlePlayPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentAyahIndex === trackIndex) {
      if (playing) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } else {
      await TrackPlayer.skip(trackIndex!);
      await TrackPlayer.play();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePlayPress}
      style={styles.iconButton}
    >
      <FontAwesome6 
        name={playing && isActiveAyah ? 'pause' : 'play'} 
        size={iconSize} 
        color={color} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});