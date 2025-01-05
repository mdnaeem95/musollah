import { View, StyleSheet, Dimensions, Animated } from 'react-native'
import React, { useRef, useState } from 'react'
import RoundButton from './RoundButton';

interface ExpendableButtonProps {
    onQiblatPress: () => void;
    onDoaPress: () => void;
    onCalendarPress: () => void;
    onCityPress: () => void;
    onDashboardPress: () => void;
}

const ExpandableButton = ({ onQiblatPress, onDoaPress, onCalendarPress, onCityPress, onDashboardPress }: ExpendableButtonProps) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const animationValue = useRef(new Animated.Value(0)).current;

    // Handle expand/collapse animation
    const toggleExpand = () => {
        if (expanded) {
            // Collapse animation
            Animated.timing(animationValue, {
                toValue: 0,
                duration: 300, // Animation duration in ms
                useNativeDriver: true,
            }).start(() => setExpanded(false));
        } else {
            setExpanded(true); // Set expanded first to render buttons
            Animated.timing(animationValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    // Interpolations
    const translateX = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [Dimensions.get('window').width / 2, 0], // Moves from right to full width
    });

    const opacity = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1], // Fades in
    });

    const handleQiblatPress = () => {
        setExpanded(false);
        onQiblatPress();
    }

    const handleDoaPress = () => {
        setExpanded(false);
        onDoaPress();
    }

    const handleCityPress = () => {
        setExpanded(false);
        onCityPress();
    }

    const handleDashboardPress = () => {
        setExpanded(false);
        onDashboardPress();
    }

    return (
        <View style={styles.container}>
            {!expanded && (
                <RoundButton
                iconName='plus'
                onPress={toggleExpand}
                size={22} 
                />
            )}
            {expanded && (
                <Animated.View 
                    style={[
                        styles.expandedButtonsContainer,
                        { transform: [{ translateX }], opacity }, // Apply animations
                    ]}
                >
                    <RoundButton
                        iconName="xmark"
                        onPress={toggleExpand}
                        size={22} 
                    />
                    <RoundButton
                        iconName="compass"
                        onPress={handleQiblatPress}
                        size={22} 
                    />

                    <RoundButton
                        iconName="hands-praying"
                        onPress={handleDoaPress}
                        size={22} 
                    />

                    <RoundButton 
                        iconName="calendar-alt"
                        onPress={onCalendarPress}
                        size={22}
                    />

                    <RoundButton 
                        iconName="location-dot"
                        onPress={handleCityPress}
                        size={22}
                    />

                    <RoundButton 
                        iconName="chart-simple"
                        onPress={handleDashboardPress}
                        size={22}
                    />
                </Animated.View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50,
        width: Dimensions.get('window').width, // Full screen width
        paddingHorizontal: 20, // Ensure padding from screen edges
        alignItems: 'flex-end', // Anchor the buttons to the right
    },
    expandedButtonsContainer: {
        flexDirection: 'row-reverse', // Layout buttons from right to left
        justifyContent: 'space-between', // Space buttons evenly across the width
        alignItems: 'center',
        width: '100%', // Full width for button container
    },
})

export default ExpandableButton