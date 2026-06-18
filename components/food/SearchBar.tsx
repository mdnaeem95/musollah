import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { useAccent } from '../../hooks/useAccent';
import { enter } from '../../utils';

const SearchBar = () => {
  const { theme, isDarkMode } = useTheme();
  const { accent } = useAccent();
  const router = useRouter();

  const handlePress = () => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/search');
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <BlurView
          intensity={isDarkMode ? 20 : 25}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            styles.bar,
            {
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.90)',
              borderColor: isDarkMode
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.07)',
            },
          ]}
        >
          <BlurView
            intensity={0}
            style={[styles.iconWrap, { backgroundColor: accent + '20' }]}
          >
            <FontAwesome6 name="magnifying-glass" size={16} color={accent} />
          </BlurView>

          <Text style={[styles.placeholder, {
            color: isDarkMode ? 'rgba(255,255,255,0.45)' : theme.colors.text.secondary,
          }]}>
            Search halal restaurants...
          </Text>

          <FontAwesome6
            name="sliders"
            size={14}
            color={isDarkMode ? 'rgba(255,255,255,0.30)' : theme.colors.text.muted}
          />
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
  },
});

export default SearchBar;
