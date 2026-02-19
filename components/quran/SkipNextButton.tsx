import { FontAwesome6 } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";
import TrackPlayer from "react-native-track-player";
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Track Player');

type SkipNextButtonProps = {
    iconSize?: number;
    color?: string;
};

export const SkipNextButton = ({ iconSize = 20, color }: SkipNextButtonProps) => {
    const handleSkipNext = async () => {
        try {
            await TrackPlayer.skipToNext(); // Skip to the next track
        } catch (error) {
            logger.error('Error skipping to next track', error as Error);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSkipNext}
            style={styles.iconButton}
        >
            <FontAwesome6 name="forward" size={iconSize} color={color} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
});
