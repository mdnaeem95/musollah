import { FontAwesome6 } from "@expo/vector-icons"
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native"
import TrackPlayer, { useIsPlaying } from "react-native-track-player"

type PlayerButtonProps = {
	iconSize?: number
    color?: string
    isActiveAyah?: boolean
}

export const PlayPauseButton = ({ iconSize = 20, color, isActiveAyah }: PlayerButtonProps) => {
	const { playing } = useIsPlaying()
	return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={playing ? TrackPlayer.pause : TrackPlayer.play}
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