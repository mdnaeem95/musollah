import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { usePlan } from './context';

export default function UnitScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  //@ts-ignore
  const { setPlan } = usePlan();

  const handleSelect = (planType: 'ayahs' | 'surahs' | 'juz') => {
    setPlan({ planType });
    router.push('/recitationPlan/review'); // or /commitment if you add that step
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        How would you like to break up your reading?
      </Text>

      {[
        { label: 'By Ayahs', value: 'ayahs' },
        { label: 'By Surahs', value: 'surahs' },
        { label: 'By Juz', value: 'juz' },
      ].map(({ label, value }) => (
        <TouchableOpacity
          key={value}
          onPress={() => handleSelect(value as any)}
          style={[styles.option, { backgroundColor: theme.colors.secondary }]}
        >
          <Text style={[styles.optionText, { color: theme.colors.text.primary }]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    marginBottom: 30,
  },
  option: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
  },
});