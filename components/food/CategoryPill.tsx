import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const CategoryPill: React.FC<Props> = ({ label, selected, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        { backgroundColor: selected ? theme.colors.accent : theme.colors.secondary },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? theme.colors.primary : theme.colors.text.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 10,
  },
  text: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
});

export default CategoryPill;