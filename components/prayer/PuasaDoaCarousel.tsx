import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { useTheme } from '../../context/ThemeContext';
import { scaleSize } from '../../utils';

const { width } = Dimensions.get('window');

const doas = [
  {
    title: "Niat Puasa",
    arabic: "وَبِصَوْمِ غَدٍ نَوَيْتُ مِنْ شَهْرِ رَمَضَانَ",
    transliteration: "Wa bisawmi ghadin nawaitu min shahri Ramadan",
    meaning: "I intend to fast tomorrow in the month of Ramadan.",
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
  const carouselRef = useRef<Carousel<any>>(null);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.arabic}>{item.arabic}</Text>
      <Text style={styles.transliteration}>{item.transliteration}</Text>
      <Text style={styles.meaning}>{item.meaning}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Puasa-Related Doas</Text>
      
      <Carousel
        ref={carouselRef}
        data={doas}
        renderItem={renderItem}
        sliderWidth={width}
        itemWidth={width * 0.85}
        layout="default"
        inactiveSlideScale={0.9}
        inactiveSlideOpacity={0.6}
      />
    </View>
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
      marginBottom: theme.spacing.small,
      textAlign: 'center',
    },
    card: {
      width: width * 0.85,
      backgroundColor: theme.colors.secondary,
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
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.accent,
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
