import { format } from 'date-fns';
import { ayahList } from './constants';
import { Dimensions } from 'react-native';

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

export const getPrayerTimesInfo  = (prayerTimes: { [key: string]: string }, currentTime: Date):
 { currentPrayer: string, nextPrayer:string, timeUntilNextPrayer: string } => {
    const timeInMinutes = (date: Date): number => date.getHours() * 60 + date.getMinutes();

    const prayerNames = ['Subuh', 'Syuruk', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
    const prayerTimesInMinutes = prayerNames.map(prayer => {
        const [hours, minutes] = prayerTimes[prayer].split(':').map(Number);
        return hours * 60 + minutes;
    });

    const currentMinutes = timeInMinutes(currentTime);
    // console.log('Current Time in Minutes:', currentMinutes);
    // console.log('Prayer Times in Minutes:', prayerTimesInMinutes);

    let currentPrayer = '';
    let nextPrayer = '';
    let timeUntilNextPrayer = '';
    
    for (let i = 0; i < prayerTimesInMinutes.length; i++) {
        if (currentMinutes < prayerTimesInMinutes[i]) {
            currentPrayer = i === 0 ? prayerNames[prayerNames.length - 1] : prayerNames[i - 1];
            nextPrayer = prayerNames[i];

            const minutesUntilNextPrayer = prayerTimesInMinutes[i] - currentMinutes;
            const hours = Math.floor(minutesUntilNextPrayer / 60);
            const minutes = minutesUntilNextPrayer % 60;
            timeUntilNextPrayer = `${hours} hr ${minutes} min`;
            return { currentPrayer, nextPrayer, timeUntilNextPrayer}; 
        }
    }

    // If current time is > Isha, the next prayer is Fajr of the next day
    currentPrayer = 'Isyak'
    nextPrayer = 'Subuh'
    const minutesUntilNextPrayer = (24 * 60 - currentMinutes) + prayerTimesInMinutes[0];
    const hours = Math.floor(minutesUntilNextPrayer / 60);
    const minutes = minutesUntilNextPrayer % 60;
    timeUntilNextPrayer = `${hours} hr ${minutes} min`;

    return { currentPrayer, nextPrayer, timeUntilNextPrayer}; 
}

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
    const endDate = new Date();
    endDate.setDate(today.getDate() + numDays);
  
    return monthlyPrayerTimes.reduce((acc: Record<string, any>, item: any) => {
      const itemDate = new Date(today.getFullYear(), today.getMonth(), parseInt(item.date));
      if (itemDate >= today && itemDate <= endDate) {
        acc[itemDate.toISOString().split('T')[0]] = {
          Subuh: item.Subuh,
          Syuruk: item.Syuruk,
          Zohor: item.Zohor,
          Asar: item.Asar,
          Maghrib: item.Maghrib,
          Isyak: item.Isyak,
        };
      }
      return acc;
    }, {});
};

export const scaleSize = (size: number) => {
    const screenWidth = Dimensions.get('window').width;
    const scaleFactor = screenWidth / 375;
    return size * scaleFactor
}