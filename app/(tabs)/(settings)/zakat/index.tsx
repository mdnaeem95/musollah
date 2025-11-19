import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

type ZakatCard = {
  id: string;
  icon: string;
  title: string;
  description: string;
  route: string;
};

const ZAKAT_CARDS: ZakatCard[] = [
  {
    id: 'harta',
    icon: 'money-bill',
    title: 'Zakat Harta',
    description: 'Calculate zakat on savings, gold, insurance, and shares.',
    route: '/zakat/harta',
  },
  {
    id: 'fidyah',
    icon: 'heart-pulse',
    title: 'Zakat Fidyah',
    description: 'Learn and calculate fidyah for missed fasts.',
    route: '/zakat/fidyah',
  },
];

const ZakatIndex = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleCardPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Zakat Calculator</Text>
        <Text style={styles.headerDescription}>
          Calculate your zakat obligations easily and accurately
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {ZAKAT_CARDS.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.card}
            onPress={() => handleCardPress(card.route)}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name={card.icon as any}
              size={40}
              color={theme.colors.text.secondary}
              style={styles.icon}
            />
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription}>{card.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.primary,
    },
    header: {
      marginBottom: theme.spacing.large,
    },
    headerTitle: {
      fontSize: theme.fontSizes.xxxLarge,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xSmall,
    },
    headerDescription: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    icon: {
      marginBottom: theme.spacing.medium,
    },
    cardContainer: {
      flex: 1,
      justifyContent: 'space-evenly',
    },
    card: {
      padding: theme.spacing.large,
      borderRadius: theme.borderRadius.large,
      marginVertical: theme.spacing.small,
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      ...theme.shadows.default,
    },
    cardTitle: {
      fontSize: theme.fontSizes.xxLarge,
      fontFamily: 'Outfit_600SemiBold',
      marginBottom: theme.spacing.small,
      color: theme.colors.text.secondary,
    },
    cardDescription: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      textAlign: 'center',
      color: theme.colors.text.secondary,
    },
  });

export default ZakatIndex;