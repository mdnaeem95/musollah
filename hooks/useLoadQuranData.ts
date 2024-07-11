import { useState, useEffect } from 'react';
import { fetchSurahs, fetchSurahText } from '../api/surahs';

export type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type SurahDetails = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: Ayah[];
};

export type TranslationDetails = {
  number: number;
  ayahs: TranslationAyah[];
};

export type Ayah = {
    number: number;
    text: string;
    audio: string;
}

export type TranslationAyah = {
    number: number,
    text: string,
}

const useLoadQuranData = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [surahDetails, setSurahDetails] = useState<{ [key: number]: SurahDetails }>({});
  const [translationDetails, setTranslationDetails] = useState<{ [key: number]: TranslationDetails }>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadQuranData = async () => {
      try {
        const surahData = await fetchSurahs();
        setSurahs(surahData.data);

        const fetchDetailsPromises = surahData.data.map(async (surah: Surah) => {
          try {
            const surahText = await fetchSurahText(surah.number, 'ar.alafasy');
            const translationText = await fetchSurahText(surah.number, 'en.asad');

            setSurahDetails(prev => ({
              ...prev,
              [surah.number]: surahText.data,
            }));

            setTranslationDetails(prev => ({
              ...prev,
              [surah.number]: translationText.data,
            }));
          } catch (error) {
            console.error(`Failed to fetch surah ${surah.number} text or translation: `, error);
          }
        });

        await Promise.all(fetchDetailsPromises);
      } catch (error) {
        console.error('Failed to load Quran data: ', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuranData();
  }, []);

  return { surahs, surahDetails, translationDetails, loading };
};

export default useLoadQuranData;
