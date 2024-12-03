import { formatDateForAPI } from '../../utils';

export const fetchPrayerTimes = async () => {
    try {
        console.log('Fetching prayer times...')
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Singapore&country=Singapore`)

        if (!response.ok) {
            throw new Error('Failed to fetch prayer times');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching prayer times: ', error);
        throw error;
    }
}

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

// Function to fetch prayer times for the entire month
export const fetchMonthlyPrayerTimes = async (year: number, month: number) => {
    const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=1.287953&longitude=103.851784`
    try {
        console.log(`Fetching monthly prayer times for from ${apiUrl}.`)
        const response = await fetch(apiUrl)

        if (!response.ok) {
            throw new Error('Failed to fetch monthly prayer time:')
        }

        const data = await response.json();
        const formattedData = data.data.map((item: any) => ({
            date: item.date.readable.substring(0, 2),
            Subuh: item.timings.Fajr.replace(' (+08)', ''),
            Syuruk: item.timings.Sunrise.replace(' (+08)', ''),
            Zohor: item.timings.Dhuhr.replace(' (+08)', ''),
            Asar: item.timings.Asr.replace(' (+08)', ''),
            Maghrib: item.timings.Maghrib.replace(' (+08)', ''),
            Isyak: item.timings.Isha.replace(' (+08)', '')
        }))

        console.log('Formatted Data from monthly prayer fetch', formattedData[0])

        return formattedData;
    } catch (error) {
        console.error('Error fetching monthly times:', error);
        throw error;
    }
}