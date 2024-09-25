import { SafeAreaView, FlatList, ActivityIndicator } from 'react-native'
import React, { useCallback } from 'react'
import SurahItem from '../../../components/SurahItem';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store/store';
import { Surah } from '../../../utils/types';

const QuranTab = () => {
  const { surahs, isLoading } = useSelector((state: RootState) => state.quran);
  const router = useRouter();

  const handleSurahPress = useCallback((surah: Surah) => {
    router.push(`/surahs/${surah.number}`)
  }, [router]);

  const renderSurahItem = useCallback(({ item }: { item: Surah }) => (
    <SurahItem key={item.id} surah={item} onPress={handleSurahPress} />
  ), [handleSurahPress]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4D6561' }}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList 
          data={surahs} 
          renderItem={renderSurahItem} 
          keyExtractor={(item) => item.number.toString()} 
          showsVerticalScrollIndicator={false}
          style={{ padding: 30 }} 
        />
      )}
    </SafeAreaView>
  )
}

export default QuranTab