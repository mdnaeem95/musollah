import { FlatList, ActivityIndicator, View, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { FontAwesome6 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DoaItem from '../../../../components/DoaItem';
import { RootState } from '../../../../redux/store/store';
import { Doa } from '../../../../utils/types';
import { ThemeContext } from '../../../../context/ThemeContext';
import { darkTheme, lightTheme } from '../../../../utils/theme';

const Doas = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { doas, loading } = useSelector((state: RootState) => state.doas);
  const router = useRouter();
  const styles = isDarkMode ? darkTheme : lightTheme;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  const handleDoaPress = useCallback((doa: Doa) => {
    router.push(`/doas/${doa.number}`);
  }, [router]);

  const renderDoaItem = useCallback(
    ({ item }: { item: Doa }) => <DoaItem key={item.number} doa={item} onPress={handleDoaPress} />,
    [handleDoaPress]
  );

  const filteredDoas = useMemo(() => {
    return doas.filter(
      (doa) =>
        doa.title.toLowerCase().includes(debounceQuery.toLowerCase()) || (doa.number && doa.number.toString().includes(debounceQuery))
    );
  }, [doas, debounceQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#1E1E1E' : '#4D6561'} />
      <View style={styles.headerContainer}>
        {isSearchExpanded && (
          <View style={styles.searchBarContainer}>
            <TextInput
              placeholder="Search Dua"
              placeholderTextColor="#B0B0B0"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
        <TouchableOpacity onPress={toggleSearch} style={styles.searchIconContainer}>
          <FontAwesome6 name={isSearchExpanded ? 'xmark' : 'magnifying-glass'} size={24} color={isDarkMode ? '#ECDFCC' : '#FFFFFF'} />
        </TouchableOpacity>

        <TouchableOpacity style={{ paddingHorizontal: 10 }} onPress={() => router.push('/bookmarks')}>
          <FontAwesome6 name="bookmark" size={24} solid color={isDarkMode ? '#ECDFCC' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filteredDoas}
          renderItem={renderDoaItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          keyExtractor={(item) => item.number.toString()}
          showsVerticalScrollIndicator={false}
          style={{ paddingHorizontal: 30 }}
        />
      )}
    </SafeAreaView>
  );
};

export default Doas;
