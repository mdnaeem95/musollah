import { SafeAreaView, FlatList, ActivityIndicator } from 'react-native'
import React, { useCallback, useContext } from 'react'
import SurahItem from '../../../components/SurahItem';
import { useRouter } from 'expo-router';
import { QuranDataContext } from '../../../providers/QuranDataProvider';
import { Surah } from '../../../hooks/useLoadQuranData'

const QuranTab = () => {
  const { surahs, loading } = useContext(QuranDataContext);
  const router = useRouter();

  const handleSurahPress = useCallback((surah: Surah) => {
    router.push(`/surahs/${surah.number}`)
  }, [router]);

  const renderSurahItem = useCallback(({ item }: { item: Surah }) => (
    <SurahItem key={item.number} surah={item} onPress={handleSurahPress} />
  ), [handleSurahPress]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4D6561' }}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList data={surahs} renderItem={renderSurahItem} keyExtractor={(item) => item.number.toString()} contentContainerStyle={{ right: 20  }} />
      )}
    </SafeAreaView>
  )
}

export default QuranTab