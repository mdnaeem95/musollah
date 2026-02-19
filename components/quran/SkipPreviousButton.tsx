import { FontAwesome6 } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";
import TrackPlayer from "react-native-track-player";
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Track Player');

type SkipPreviousButtonProps = {
    iconSize?: number;
    color?: string;
};

export const SkipPreviousButton = ({ iconSize = 20, color }: SkipPreviousButtonProps) => {
    const handleSkipPrevious = async () => {
        try {
            await TrackPlayer.skipToPrevious(); // Skip to the previous track
        } catch (error) {
            logger.error('Error skipping to previous track', error as Error);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSkipPrevious}
            style={styles.iconButton}
        >
            <FontAwesome6 name="backward" size={iconSize} color={color} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
});
