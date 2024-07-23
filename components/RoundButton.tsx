import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import React from 'react'
import { FontAwesome6 } from '@expo/vector-icons'

interface CustomButtonProps {
    iconName: React.ComponentProps<typeof FontAwesome6>['name'];
    onPress: () => void;
    size?: number;
    style?: object;
}

const RoundButton = ({ iconName, onPress, size, style }: CustomButtonProps) => {
    const scaledSize = scaleSize(size!);

    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            <FontAwesome6 name={iconName} size={scaledSize} /> 
        </TouchableOpacity>
    )
}

// Get screen width for scaling
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

function scaleSize(size: number) {
    const scaleFactor = screenWidth / 375; // Base screen width (iPhone standard)
    return size * scaleFactor;
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DFF3E3',
        borderRadius: 25,
        padding: 10,
        marginBottom: -30
    }
})

export default RoundButton