import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

const SearchBar = () => {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.secondary }]}
      onPress={() => router.push('/search')}
    >
      <Text style={[styles.text, { color: theme.colors.text.muted }]}>
        Find Halal food near you...
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
  },
});

export default SearchBar;