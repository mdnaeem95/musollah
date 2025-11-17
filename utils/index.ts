import { format, parse } from 'date-fns';
import { ayahList } from './constants';
import { Animated, Dimensions } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";

export const formatIslamicDate = (hijriDate: string): string => {
    const [day, month, year] = hijriDate.split('-');
    const monthNames = [
        'Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jamadilawal', 'JamadilAkhir',
        'Rejab', 'Syaaban', 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'
    ];
    const monthName = monthNames[parseInt(month, 10) - 1];
    return `${day} ${monthName}, ${year} AH`
}

export const getRandomAyahByMood = (mood: string) => {
    // Filter ayahs based on mood
    const filteredAyahs = ayahList.filter(ayah => ayah.mood === mood);

    // If no ayahs match the mood, return a fallback random ayah
    if (filteredAyahs.length === 0) {
        console.warn(`No ayahs found for mood: ${mood}. Returning a random ayah.`);
        return ayahList[Math.floor(Math.random() * ayahList.length)];
    }

    // Pick a random ayah from the filtered list
    const randomIndex = Math.floor(Math.random() * filteredAyahs.length);
    return filteredAyahs[randomIndex];
};

export const generateTracksListId = (trackListName: string, search?: string) => {
	return `${trackListName}${`-${search}` || ''}`
}

export const scaleSize = (size: number) => {
    const screenWidth = Dimensions.get('window').width;
    const scaleFactor = screenWidth / 375;
    return size * scaleFactor
}

export const shakeButton = (shakeAnimation: any) => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10, // Move 10 pixels to the right
        duration: 50,
        useNativeDriver: true, // Required for performance
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10, // Move 10 pixels to the left
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0, // Return to original position
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
};

export const calculateContrastColor = (bgColor: string): string => {
  // Convert hex color to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  // Return white or black based on luminance
  return luminance > 186 ? '#000000' : '#FFFFFF';
};

export const generateReferralCode = (userId: string): string => {
    // Generate a short alphanumeric code (e.g., 8 characters) using UUID
    return `${userId.slice(0, 4)}-${uuidv4().slice(0, 8)}`.toUpperCase();
};

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 5) {
      return `${'*'.repeat(localPart.length)}@${domain}`;
  }
  return `${'*'.repeat(5)}${localPart.slice(5)}@${domain}`;
};