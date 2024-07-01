import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

type Surah = {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberofAyahs: number;
    revelationType: string;
}

interface SurahProps {
    surah: Surah,
    onPress: (surah: Surah) => void,
}

const SurahItem = ({ surah, onPress }: SurahProps) => {
  return (
    <TouchableOpacity onPress={() => onPress(surah)}>
      <View style={styles.container}>
        <View style={{ width: 283, height: 55, gap: 10, justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row', left: 30 }}>
            <Text style={styles.surahNumber}>{surah.number}</Text>

            <View>
                <Text style={styles.surahInfo}>{surah.englishName}</Text>
                <Text style={styles.surahInfo}>({surah.englishNameTranslation})</Text>
            </View>
            
            <View style={{ top: 5 }}>
                <Text style={styles.surahName}>{surah.name}</Text>
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
  },
  surahNumber: {
    fontFamily: 'Outfit_600SemiBold',
    fontWeight: 600,
    fontSize: 30,
    lineHeight: 45,
    color: '#FFFFFF'
  },
  surahInfo: {
    fontFamily: 'Outfit_500Medium',
    fontWeight: 500,
    fontSize: 14,
    lineHeight: 18,
    color: '#EAFFFC'
  },
  surahName: {
    fontFamily: 'Amiri_400Regular',
    fontWeight: 400,
    fontSize: 24,
    textAlign: 'right'
  }
});

export default SurahItem;
