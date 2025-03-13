import { formatDateForAPI } from '../../utils';
import firestore from '@react-native-firebase/firestore';
import { PrayerTimes2025 } from '../../utils/types';

export const fetchTimesByDate = async (date: string) => {
    try {
        const formattedDate = formatDateForAPI(date);
        console.log('Formatted Date: ', formattedDate)
        console.log('Fetfching prayer times by date for...', formattedDate)
        const response = await fetch(`https://api.aladhan.com/v1/timings/${formattedDate}?latitude=1.290270&longitude=103.851959`)

        if (!response.ok) {
            throw new Error(`Failed to fetch prayer times for date ${date}`)
        }

        const data = await response.json();
        return data
    } catch (error) {
        console.error (`Error fetching prayer times for ${date}: `, error)
    }
}

export const fetchPrayerTimesByLocation = async (latitude: number, longitude: number) => {
    try {
        console.log(latitude, longitude)
        const endpoint = `https://api.aladhan.com/v1/timings`;
        const params = `?latitude=${latitude}&longitude=${longitude}`; 

        console.log('Fetching prayer times by location...');
        const response = await fetch(`${endpoint}${params}`);

        if (!response.ok) {
            throw new Error('Failed to fetch prayer times');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching prayer times by location: ', error);
        throw error;
    }
};

export const fetchIslamicDate = async (date: string) => {
    try {
        console.log('Fetching Islamic Date for...', date);
        const response = await fetch(`https://api.aladhan.com/v1/gToH/${date}`)

        if (!response.ok) {
            throw new Error('Failed to fetch Islamic Date');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Islamic date: ', error);
        throw error
    }
}

export const fetchMonthlyPrayerTimesFromFirebase = async (year: number, month: number): Promise<PrayerTimes2025[]> => {
    try {
        console.log(`📅 Fetching monthly prayer times for: ${month}/${year}`);

        // Convert month to a string without leading zeros for consistency with Firebase
        const monthStr = month.toString();

        // Fetch all prayer times from Firebase
        const prayerTimesSnapshot = await firestore().collection('prayerTimes2025').get();

        if (prayerTimesSnapshot.empty) {
            throw new Error('No prayer times found in Firebase.');
        }

        //@ts-ignore
        const prayerTimesList: PrayerTimes2025[] = prayerTimesSnapshot.docs
            .map(doc => doc.data() as PrayerTimes2025)
            .filter(prayerTime => {
                // Extract month from stored date format (D/M/YYYY)
                const [, prayerMonth, prayerYear] = prayerTime.date.split('/');

                return prayerMonth === monthStr && prayerYear === year.toString();
            })
            .map(prayerTime => ({
                date: prayerTime.date.split('/')[0], // Extract day only
                day: parseInt(prayerTime.date.split('/')[0], 10),
                subuh: prayerTime.time.subuh,
                syuruk: prayerTime.time.syuruk,
                zohor: prayerTime.time.zohor,
                asar: prayerTime.time.asar,
                maghrib: prayerTime.time.maghrib,
                isyak: prayerTime.time.isyak
            }));

        console.log(`✅ Retrieved ${prayerTimesList.length} records for ${month}/${year}`);
        //@ts-ignore
        return prayerTimesList.sort((a, b) => a.day! - b.day!);
    } catch (error) {
        console.error('❌ Error fetching monthly prayer times from Firebase:', error);
        throw error;
    }
};