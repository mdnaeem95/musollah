import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  backgroundColor: string;
  textColor?: string;
}

const PrayerHeader: React.FC<HeaderProps> = ({ title, backgroundColor, textColor }) => {
  const router = useRouter();

  return (
    <View style={[styles.headerContainer, { backgroundColor: backgroundColor }]}>
      <TouchableOpacity onPress={() => router.back()}>
        <FontAwesome6 name="arrow-left" size={24} color={textColor && textColor ? textColor : '#FFFFFF'} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: textColor && textColor ? textColor : '#FFFFFF' }]}>{title}</Text>
      <View style={{ width: 24, height: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 20,
  },
  title: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default PrayerHeader;
