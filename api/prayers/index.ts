import { formatDateForAPI } from '../../utils';

export const fetchPrayerTimes = async () => {
    try {
        console.log('Fetching prayer times...')
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Singapore&country=Singapore&method=12`)

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
        const response = await fetch(`https://api.aladhan.com/v1/timings/${formattedDate}?latitude=1.290270&longitude=103.851959&method=11`)

        if (!response.ok) {
            throw new Error(`Failed to fetch prayer times for date ${date}`)
        }

        const data = await response.json();
        return data
    } catch (error) {
        console.error (`Error fetching prayer times for ${date}: `, error)
    }
}

export const fetchPrayerTimesByLocation = async (latitude: number, longitude: number, date: string = 'today') => {
    try {
        const endpoint = `https://api.aladhan.com/v1/timings/${date}`;
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