import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useTheme } from '../../context/ThemeContext';
import { scaleSize } from '../../utils';

const { width } = Dimensions.get('window');

const doas = [
  {
    title: "Niat Puasa",
    arabic: "نَوَيْتُ صَوْمَ غَدٍ أَنْ أَدَاءِ فَرْضِ رَمَضَانَ هَذِهِ السَّنَةِ لِلَّهِ تَعَالَى",
    transliteration: "Nawaitu sauma ghodin an'adaai fardhi syahir romadhona haadzihis sanati lillahi ta'ala",
    meaning: "I intend to fast tomorrow in the month of Ramadan this year because of Allah.",
  },
  {
    title: "Doa Berbuka Puasa",
    arabic: "اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَىٰ رِزْقِكَ أَفْطَرْتُ",
    transliteration: "Allahumma laka sumtu wa bika aamantu wa 'alayka tawakkaltu wa 'ala rizqika aftartu.",
    meaning: "O Allah! For You, I have fasted, in You, I have believed, upon You, I have relied, and with Your sustenance, I break my fast.",
  },
  {
    title: "Doa Lailatul Qadr",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allahumma innaka ‘Afuwwun Kareem, tuhibbul ‘afwa, fa‘fu ‘anni.",
    meaning: "O Allah, indeed You are Pardoning, Generous, and You love to pardon, so pardon me.",
  }
];

const PuasaDoaCarousel = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <>
      <Text style={styles.title}>Puasa-Related Doas</Text>
      <View style={styles.container}>
        <Carousel
          width={width}
          height={300}
          data={doas}
          scrollAnimationDuration={500}
          loop={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.arabic}>{item.arabic}</Text>
              <Text style={styles.transliteration}>{item.transliteration}</Text>
              <Text style={styles.meaning}>{item.meaning}</Text>
            </View>
          )}
        />
      </View>
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginTop: theme.spacing.medium,
      alignItems: 'center',
    },
    title: {
      fontSize: scaleSize(18),
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginLeft: theme.spacing.medium,
      marginTop: theme.spacing.medium,
      textAlign: 'left',
    },
    card: {
      width: width * 0.9,
      backgroundColor: theme.colors.secondary,
      marginLeft: 20,
      padding: theme.spacing.large,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.default,
    },
    cardTitle: {
      fontSize: scaleSize(16),
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.small,
    },
    arabic: {
      fontSize: scaleSize(22),
      fontFamily: 'Amiri_400Regular',
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.medium,
    },
    transliteration: {
      fontSize: scaleSize(14),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    meaning: {
      fontSize: scaleSize(14),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginTop: theme.spacing.small,
    },
  });

export default PuasaDoaCarousel;
