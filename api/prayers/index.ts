import axios from 'axios';
import { formatDateForAPI } from '../../utils';

export const fetchPrayerTimes = async () => {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Singapore&country=Singapore&method=11`)

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
        console.log(formattedDate)
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

export const fetchIslamicDate = async (date: string) => {
    try {
        const response = await fetch(`http://api.aladhan.com/v1/gToH/${date}`)

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