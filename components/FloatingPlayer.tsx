import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewProps } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveTrack } from 'react-native-track-player';
import { useLastActiveTrack } from '../hooks/useLastActiveTrack';
import { PlayPauseButton } from '../components/AyahPlayPauseButton';
import { MovingText } from './MovingText';

export const FloatingPlayer = ({ style }: ViewProps) => {
    const router = useRouter();

    const activeTrack = useActiveTrack(); // Hook to get the current active track
    const lastActiveTrack = useLastActiveTrack(); // Hook to retrieve the last played track
    const displayedTrack = activeTrack ?? lastActiveTrack; // Show the last track if no active track

    const handlePress = () => {
        router.navigate('/player'); // Navigate to the full player screen
    };

    if (!displayedTrack) return null; // Hide the floating player if no track to display

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.9}
            style={[styles.container, style]}
        >
            <>
                {/* Track Title */}
                <View style={styles.trackTitleContainer}>
                    <MovingText
                        style={styles.trackTitle}
                        text={displayedTrack.title ?? ''}
                        animationThreshold={25} // Scroll text if too long
                    />
                </View>

                {/* Play/Pause Button */}
                <View style={styles.trackControlsContainer}>
                    <PlayPauseButton
                        iconSize={24}
                        color="#FFFFFF"
                        isActiveAyah={!!activeTrack} // Highlight if actively playing
                    />
                </View>
            </>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252525',
        padding: 10,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    trackTitleContainer: {
        flex: 1,
        overflow: 'hidden',
        marginLeft: 10,
    },
    trackTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    trackControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 20,
        marginRight: 16,
    },
});
