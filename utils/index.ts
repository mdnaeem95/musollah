import { format, parse } from 'date-fns';
import { ayahList } from './constants';
import { Animated, Dimensions } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const getFormattedDate = (date: Date) => {
    return format(date, "EEEE, do MMMM yyyy");
}

export const getShortFormattedDate = (date: Date): string => {
    return format(date, "dd-MM-yyyy");
}

export const formatIslamicDate = (hijriDate: string): string => {
    const [day, month, year] = hijriDate.split('-');
    const monthNames = [
        'Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jamadilawal', 'JamadilAkhir',
        'Rejab', 'Syaaban', 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'
    ];
    const monthName = monthNames[parseInt(month, 10) - 1];
    return `${day} ${monthName}, ${year} AH`
}

export const getPrayerTimesInfo = (
  prayerTimes: Record<string, string>,
  currentTime: Date
): { currentPrayer: string; nextPrayer: string; timeUntilNextPrayer: string } => {
  
  const timeInMinutes = (date: Date): number => date.getHours() * 60 + date.getMinutes();
  const prayerNames = ["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"];

  // Convert prayer times to minutes
  const prayerTimesInMinutes = prayerNames.map((prayer) => {
    const [hours, minutes] = prayerTimes[prayer].split(":").map(Number);
    return hours * 60 + minutes;
  });

  const currentMinutes = timeInMinutes(currentTime);
  let currentPrayer = "";
  let nextPrayer = "";
  let timeUntilNextPrayer = "";

  for (let i = 0; i < prayerTimesInMinutes.length; i++) {
    if (currentMinutes < prayerTimesInMinutes[i]) {
      currentPrayer = i === 0 ? "Isyak" : prayerNames[i - 1]; // Handles midnight case correctly
      nextPrayer = prayerNames[i];

      const minutesUntilNextPrayer = prayerTimesInMinutes[i] - currentMinutes;
      const hours = Math.floor(minutesUntilNextPrayer / 60);
      const minutes = minutesUntilNextPrayer % 60;
      timeUntilNextPrayer = `${hours} hr ${minutes} min`;

      return { currentPrayer, nextPrayer, timeUntilNextPrayer };
    }
  }

  // If current time is after Isyak, next prayer is Subuh
  currentPrayer = "Isyak";
  nextPrayer = "Subuh";
  const minutesUntilNextPrayer = 24 * 60 - currentMinutes + prayerTimesInMinutes[0]; // Wraparound to next day
  const hours = Math.floor(minutesUntilNextPrayer / 60);
  const minutes = minutesUntilNextPrayer % 60;
  timeUntilNextPrayer = `${hours} hr ${minutes} min`;

  return { currentPrayer, nextPrayer, timeUntilNextPrayer };
};

export const formatDateForAPI = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
};

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

export const formatSecondsToMinutes = (seconds: number) => {
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = Math.floor(seconds % 60)

	const formattedMinutes = String(minutes).padStart(2, '0')
	const formattedSeconds = String(remainingSeconds).padStart(2, '0')

	return `${formattedMinutes}:${formattedSeconds}`
}

export const generateTracksListId = (trackListName: string, search?: string) => {
	return `${trackListName}${`-${search}` || ''}`
}

export const extractNextDaysPrayerTimes = (
  monthlyPrayerTimes: any[],
  numDays: number
): Record<string, any> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight

  const endDate = new Date(today);
  endDate.setDate(today.getDate() + numDays);

  const result: Record<string, any> = {};

  monthlyPrayerTimes.forEach((item) => {
    try {
      console.log("Processing Prayer Data Item:", item);

      // ✅ Correctly format the stored Firebase date format (d/M/yyyy)
      const itemDateStr = `${item.date}/3/2025`; // Ensure it has the full year
      const itemDate = parse(itemDateStr, "d/M/yyyy", new Date());

      itemDate.setHours(0, 0, 0, 0);

      // ✅ Ensure the date is within range
      if (itemDate >= today && itemDate <= endDate) {
        const dateKey = format(itemDate, "d/M/yyyy"); // Ensure it matches Firebase format

        console.log("✅ Valid Date Added:", dateKey, item);

        result[dateKey] = {
          Subuh: item.subuh,
          Syuruk: item.syuruk,
          Zohor: item.zohor,
          Asar: item.asar,
          Maghrib: item.maghrib,
          Isyak: item.isyak,
        };
      } else {
        console.warn("⏩ Skipping out-of-range date:", itemDate.toISOString());
      }
    } catch (error) {
      console.error("❌ Error processing item:", item, error);
    }
  });

  console.log("🔍 Final Extracted Prayer Times:", result);
  return result;
};

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