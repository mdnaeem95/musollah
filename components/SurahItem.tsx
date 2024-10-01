import React, { useContext } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surah } from '../utils/types';
import { ThemeContext } from '../context/ThemeContext';

interface SurahProps {
    surah: Surah,
    onPress: (surah: Surah) => void,
}

const SurahItem = ({ surah, onPress }: SurahProps) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <TouchableOpacity onPress={() => onPress(surah)}>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.surahNumber, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>{surah.number}</Text>
            <View>
                <Text style={[styles.surahInfo, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>{surah.englishName}</Text>
                <Text style={[styles.surahInfo, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>({surah.englishNameTranslation})</Text>
            </View>
          </View>
            
            <View style={{ top: 5 }}>
                <Text style={[styles.surahName, { color: isDarkMode ? '#ECDFCC' : '#FFFFFF'}]}>{surah.arabicName}</Text>
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    width: '100%',
  },
  contentContainer: {
    height: 55, 
    gap: 10, 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexDirection: 'row', 
  },
  textContainer: {
    flexDirection: 'row', 
    gap: 10, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  surahNumber: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 30,
    lineHeight: 45,
  },
  surahInfo: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    lineHeight: 18,
  },
  surahName: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 24,
    textAlign: 'right',
  }
});

export default SurahItem;
