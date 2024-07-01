export const fetchPrayerTimes = async () => {
    try {
        const response = await fetch(`http://api.aladhan.com/v1/timingsByCity?city=Singapore&country=Singapore&method=11`)

        if (!response.ok) {
            throw new Error('Failed to fetch prayer times');
        }

        const data = await response.json();
        //console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching prayer times: ', error);
        throw error;
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