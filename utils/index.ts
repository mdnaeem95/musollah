import { format } from 'date-fns';

export const getFormattedDate = (date: Date) => {
    return format(date, "EEEE, do MMMM yyyy");
}

export const getShortFormattedDate = (date: Date): string => {
    return format(date, "dd-MM-yyyy");
}

export const formatIslamicDate = (hijriDate: string): string => {
    const [day, month, year] = hijriDate.split('-');
    const monthNames = [
        'Muharram', 'Safar', 'Rabi‘ I', 'Rabi‘ II', 'Jumada I', 'Jumada II',
        'Rajab', 'Sha‘ban', 'Ramadan', 'Shawwal', 'Dhu’l-Qi‘dah', 'Dhu’l-Hijjah'
    ];
    const monthName = monthNames[parseInt(month, 10) - 1];
    return `${day} ${monthName}, ${year} AH`
}

export const getPrayerTimesInfo  = (prayerTimes: { [key: string]: string }, currentTime: Date):
 { currentPrayer: string, nextPrayer:string, timeUntilNextPrayer: string } => {
    const timeInMinutes = (date: Date): number => date.getHours() * 60 + date.getMinutes();

    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const prayerTimesInMinutes = prayerNames.map(prayer => {
        const [hours, minutes] = prayerTimes[prayer].split(':').map(Number);
        return hours * 60 + minutes;
    });

    const currentMinutes = timeInMinutes(currentTime);

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
    currentPrayer = 'Isha'
    nextPrayer = 'Fajr'
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
  