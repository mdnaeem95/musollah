import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeContext } from '../../../../context/ThemeContext';

const ZakatIndex = () => {
    const router = useRouter();
    const { theme, isDarkMode } = useContext(ThemeContext); // Access theme context
    const activeTheme = isDarkMode ? theme.dark : theme.light;

    const styles = createStyles(activeTheme);

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.cardContainer}>
                {/* Zakat Harta */}
                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => router.push('/zakat/harta')}
                >
                    <FontAwesome6 
                        name="money-bill" 
                        size={40} 
                        color={activeTheme.colors.text.secondary} 
                        style={styles.icon} 
                    />
                    <Text style={styles.cardTitle}>Zakat Harta</Text>
                    <Text style={styles.cardDescription}>
                        Calculate zakat on savings, gold, insurance, and shares.
                    </Text>
                </TouchableOpacity>

                {/* Zakat Fidyah */}
                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => router.push('/zakat/fidyah')}
                >
                    <FontAwesome6 
                        name="heart-pulse" 
                        size={40} 
                        color={activeTheme.colors.text.secondary} 
                        style={styles.icon} 
                    />
                    <Text style={styles.cardTitle}>Zakat Fidyah</Text>
                    <Text style={styles.cardDescription}>
                        Learn and calculate fidyah for missed fasts.
                    </Text>
                </TouchableOpacity>
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
