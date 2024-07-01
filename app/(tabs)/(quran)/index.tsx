import { View, Text, SafeAreaView, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { fetchSurahs } from '../../../api/surahs';
import SurahItem from '../../../components/SurahItem';
import { useRouter } from 'expo-router';

type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberofAyahs: number;
  revelationType: string;
}

const QuranTab = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const data = await fetchSurahs();
        setSurahs(data.data);
      } catch (error) {
        return
      }
    };

    loadSurahs();
  }, [])

  const handleSurahPress = (surah: Surah) => {
    router.push(`/surahs/${surah.number}`)
  }

  return (
    <SafeAreaView style={{ backgroundColor: '#4D6561' }}>
      <ScrollView style={{ backgroundColor: '#4D6561' }}>
        <View>
          {surahs.map((surah) => {
            return (
              <SurahItem key={surah.number} surah={surah} onPress={handleSurahPress} />
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default QuranTab