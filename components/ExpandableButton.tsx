import { View, StyleSheet } from 'react-native'
import React, { useState } from 'react'
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
                onPress={() => setExpanded(!expanded)}
                size={22} 
                />
            )}
            {expanded && (
                <View style={styles.expandedButtonsContainer}>
                    <RoundButton
                        iconName="xmark"
                        onPress={() => setExpanded(false)}
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
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 20,
        bottom: 50
    },
    expandedButtonsContainer: {
        flexDirection: "row-reverse",
        alignItems: 'center',
        gap: 15,
      },

})

export default ExpandableButton