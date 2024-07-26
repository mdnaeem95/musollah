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
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            <FontAwesome6 name={iconName} size={size} /> 
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DFF3E3',
        borderRadius: 22,
        padding: 10,
        marginBottom: -30
    }
})

export default RoundButton