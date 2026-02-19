import { TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'

interface CustomButtonProps {
    iconName: React.ComponentProps<typeof FontAwesome6>['name'];
    onPress: () => void;
    size?: number;
    style?: object;
}

const RoundButton = ({ iconName, onPress, size, style }: CustomButtonProps) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            <FontAwesome6 name={iconName} size={size} color={theme.colors.text.primary} />
        </TouchableOpacity>
    )
}

const createStyles = (theme: any) => StyleSheet.create({
    button: {
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.secondary,
        borderRadius: 22,
        padding: 10,
        marginBottom: -30
    }
})

export default RoundButton
