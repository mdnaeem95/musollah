import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  backgroundColor: string;
}

const PrayerHeader: React.FC<HeaderProps> = ({ title, backgroundColor }) => {
  const router = useRouter();

  return (
    <View style={[styles.headerContainer, { backgroundColor: backgroundColor }]}>
      <TouchableOpacity onPress={() => router.back()}>
        <FontAwesome6 name="arrow-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 24, height: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 20,
  },
  title: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default PrayerHeader;
