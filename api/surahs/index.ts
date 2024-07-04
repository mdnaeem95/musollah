const BASE_URL = 'http://api.alquran.cloud/v1/surah';

export const fetchSurahs = async () => {
    try {
        const response = await fetch(`${BASE_URL}`)

        if (!response.ok) {
            throw new Error('Failed to fetch surahs');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch surahs: ', error);
        throw error;
    }
}

export const fetchSurahText = async (surahNumber: number, language: string = 'ar.alafasy') => {
    try {
        const response = await fetch(`${BASE_URL}/${surahNumber}/${language}`)

        if (!response.ok) {
            throw new Error('Failed to fetch surah text');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch surah: ', error);
        throw error;
    }
}