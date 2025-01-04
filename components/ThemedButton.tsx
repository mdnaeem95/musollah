import React, { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

interface ThemedButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle; // Optional custom styles for the button
  textStyle?: TextStyle; // Optional custom styles for the button text
  disabled?: boolean; // Option to disable the button
}

const ThemedButton: React.FC<ThemedButtonProps> = ({
  text,
  onPress,
  style,
  textStyle,
  disabled = false,
}) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;
  const styles = createStyles(activeTheme);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, textStyle]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      backgroundColor: theme.colors.accent,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      ...theme.shadows.default,
    },
    disabledButton: {
      backgroundColor: theme.colors.text.muted,
      opacity: 0.6,
    },
    buttonText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.muted,
    },
  });

export default ThemedButton;
