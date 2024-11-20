import { FontAwesome6 } from "@expo/vector-icons"
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native"
import TrackPlayer, { useIsPlaying } from "react-native-track-player"

type PlayerButtonProps = {
	iconSize?: number
    color?: string
    isActiveAyah?: boolean,
    currentAyahIndex?: number,
    trackIndex?: number,
}

export const PlayPauseButton = ({ iconSize = 20, color, isActiveAyah, currentAyahIndex, trackIndex }: PlayerButtonProps) => {
	const { playing } = useIsPlaying()

    console.log(currentAyahIndex, trackIndex)

    const handlePlayPress = async () => {
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
    }

	return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePlayPress}
            style={styles.iconButton}
        >
            <FontAwesome6 name={playing && isActiveAyah ? 'pause' : 'play'} size={iconSize} color={color} />
        </TouchableOpacity>
	)
}

const styles = StyleSheet.create({
    iconButton: {
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
})