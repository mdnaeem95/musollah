import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewProps } from 'react-native';
import { useActiveTrack } from 'react-native-track-player';
import { useLastActiveTrack } from '../hooks/useLastActiveTrack';
import { PlayPauseButton } from '../components/AyahPlayPauseButton';
import { MovingText } from './MovingText';
import { SkipNextButton } from './SkipNextButton';

export const FloatingPlayer = ({ style }: ViewProps) => {
    const activeTrack = useActiveTrack(); // Hook to get the current active track
    const lastActiveTrack = useLastActiveTrack(); // Hook to retrieve the last played track
    const [displayedTrack, setDisplayedTrack] = useState(activeTrack ?? lastActiveTrack)

    useEffect(() => {
        setDisplayedTrack(activeTrack ?? lastActiveTrack);
    }, [activeTrack, lastActiveTrack]);

    if (!displayedTrack) return null; // Hide the floating player if no track to display

    return (
        <TouchableOpacity
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
                    <Text style={styles.reciterName}>
                        {displayedTrack.artist ?? 'Unknown Reciter'}
                    </Text>
                </View>

                {/* Play/Pause Button */}
                <View style={styles.trackControlsContainer}>
                    <PlayPauseButton
                        iconSize={24}
                        color="#FFFFFF"
                        isActiveAyah={!!activeTrack} // Highlight if actively playing
                    />
                    <SkipNextButton 
                        iconSize={24}
                        color='#FFFFFF'
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
    },
    trackTitleContainer: {
        flex: 1,
        overflow: 'hidden',
        marginLeft: 10,
    },
    trackTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    reciterName: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#A0A0A0',
        marginTop: 4,
    },
    trackControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 20,
        marginRight: 16,
    },
});
