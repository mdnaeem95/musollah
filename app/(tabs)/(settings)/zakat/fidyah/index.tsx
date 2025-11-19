import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../../../context/ThemeContext';
import { useFidyahCalculator } from '../../../../../hooks/zakat/useFidyahCalculator';

type FidyahCategoryConfig = {
  icon: string;
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  total: number;
};

const FidyahCalculator = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    daysHaidOther,
    daysIllnessOldAge,
    daysPregnancyFeeding,
    ratePerDay,
    calculation,
    setDaysHaidOther,
    setDaysIllnessOldAge,
    setDaysPregnancyFeeding,
  } = useFidyahCalculator();

  const categories: FidyahCategoryConfig[] = [
    {
      icon: 'droplet',
      title: 'Haid or Other Reason',
      placeholder: 'Enter number of days',
      value: daysHaidOther,
      onChangeText: setDaysHaidOther,
      total: calculation.haidOther,
    },
    {
      icon: 'heart-pulse',
      title: 'Illness or Old-age',
      placeholder: 'Enter number of days',
      value: daysIllnessOldAge,
      onChangeText: setDaysIllnessOldAge,
      total: calculation.illnessOldAge,
    },
    {
      icon: 'person-pregnant',
      title: 'Pregnancy or Feeding',
      placeholder: 'Enter number of days',
      value: daysPregnancyFeeding,
      onChangeText: setDaysPregnancyFeeding,
      total: calculation.pregnancyFeeding,
    },
  ];

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fidyah Calculator</Text>
          <Text style={styles.headerDescription}>
            Calculate compensation for missed fasts
          </Text>
        </View>

        {/* Fixed rate display */}
        <View style={styles.rateContainer}>
          <FontAwesome6 name="coins" size={20} color={theme.colors.accent} />
          <Text style={styles.rateText}>Daily Rate: ${ratePerDay.toFixed(2)}</Text>
        </View>

        {/* Categories */}
        {categories.map((category, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.iconContainer}>
              <FontAwesome6
                name={category.icon as any}
                size={24}
                color={theme.colors.accent}
              />
              <Text style={styles.cardTitle}>{category.title}</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder={category.placeholder}
              placeholderTextColor={theme.colors.text.muted}
              value={category.value}
              onChangeText={category.onChangeText}
              keyboardType="numeric"
            />

            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Amount:</Text>
              <Text style={styles.resultValue}>${category.total.toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* Grand Total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Fidyah Payable</Text>
          <Text style={styles.totalAmount}>${calculation.grandTotal.toFixed(2)}</Text>

          {calculation.grandTotal > 0 && (
            <Text style={styles.totalDescription}>
              Total days: {
                (parseFloat(daysHaidOther) || 0) +
                (parseFloat(daysIllnessOldAge) || 0) +
                (parseFloat(daysPregnancyFeeding) || 0)
              }
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    scrollContainer: {
      paddingBottom: theme.spacing.large,
    },
    header: {
      marginBottom: theme.spacing.medium,
    },
    headerTitle: {
      fontSize: theme.fontSizes.xxLarge,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xSmall,
    },
    headerDescription: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    rateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.small,
      marginBottom: theme.spacing.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      ...theme.shadows.default,
    },
    rateText: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.secondary,
    },
    card: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.medium,
      ...theme.shadows.default,
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small,
      marginBottom: theme.spacing.medium,
    },
    cardTitle: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.text.muted,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.small,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.primary,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      marginBottom: theme.spacing.small,
    },
    resultContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: theme.spacing.small,
      borderTopWidth: 1,
      borderTopColor: theme.colors.text.muted,
    },
    resultLabel: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    resultValue: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.accent,
    },
    totalContainer: {
      padding: theme.spacing.large,
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      gap: theme.spacing.small,
      ...theme.shadows.default,
    },
    totalLabel: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
    },
    totalAmount: {
      fontSize: theme.fontSizes.xxxLarge,
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.accent,
    },
    totalDescription: {
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
  });

export default FidyahCalculator;