import { useQuery } from 'react-query';
import { fetchSurahs, fetchSurahText } from '../api/surahs';

export type Surah = {
  id: string;
  number: number;
  arabicName: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType?: string;
  arabicText: string;
  audioLinks: string;
  englishTranslation: string;
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
};

export type TranslationAyah = {
  number: number;
  text: string;
};

const useLoadQuranData = () => {
  const fetchQuranData = async () => {
    const surahData = await fetchSurahs();

    const fetchDetailsPromises = surahData.data.map(async (surah: Surah) => {
      const surahText = await fetchSurahText(surah.number, 'ar.alafasy');
      const translationText = await fetchSurahText(surah.number, 'en.asad');

      return {
        surahNumber: surah.number,
        surahDetails: surahText.data,
        translationDetails: translationText.data,
      };
    });

    const detailsData = await Promise.all(fetchDetailsPromises);
    const surahDetails: { [key: number]: SurahDetails } = {};
    const translationDetails: { [key: number]: TranslationDetails } = {};

    detailsData.forEach((data) => {
      surahDetails[data.surahNumber] = data.surahDetails;
      translationDetails[data.surahNumber] = data.translationDetails;
    });

    return { surahs: surahData.data, surahDetails, translationDetails };
  };

  const { data, error, isLoading } = useQuery('quranData', fetchQuranData);

  return {
    surahs: data?.surahs ?? [],
    surahDetails: data?.surahDetails ?? {},
    translationDetails: data?.translationDetails ?? {},
    isLoading,
    error,
  };
};

export default useLoadQuranData;
