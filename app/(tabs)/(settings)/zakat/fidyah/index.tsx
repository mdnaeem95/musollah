import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeContext } from '../../../../../context/ThemeContext';

const FidyahCalculator = () => {
    const { theme } = useContext(ThemeContext);
    const styles = createStyles(theme);

    const [daysHaidOther, setDaysHaidOther] = useState<string>(''); // Category 1: Haid or Other Reason
    const [daysIllnessOldAge, setDaysIllnessOldAge] = useState<string>(''); // Category 2: Illness or Old-age
    const [daysPregnancyFeeding, setDaysPregnancyFeeding] = useState<string>(''); // Category 3: Pregnancy or Feeding

    const ratePerDay = 1.4; // Fixed rate per day

    // Calculate total amounts
    const totalHaidOther = parseFloat(daysHaidOther) * ratePerDay || 0;
    const totalIllnessOldAge = parseFloat(daysIllnessOldAge) * ratePerDay || 0;
    const totalPregnancyFeeding = parseFloat(daysPregnancyFeeding) * ratePerDay || 0;

    // Calculate the grand total for all categories
    const grandTotal = totalHaidOther + totalIllnessOldAge + totalPregnancyFeeding;

    return (
        <View style={styles.mainContainer}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Fixed rate display */}
                <View style={styles.rateContainer}>
                    <Text style={styles.rateText}>Daily Rate: ${ratePerDay.toFixed(2)}</Text>
                </View>
                
                {/* Category 1: Haid or Other Reason */}
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <FontAwesome6 name="droplet" size={24} color={theme.colors.text.secondary} />
                        <Text style={styles.cardTitle}>Haid or Other Reason</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter number of days"
                        placeholderTextColor={theme.colors.text.muted}
                        value={daysHaidOther}
                        onChangeText={setDaysHaidOther}
                        keyboardType="numeric"
                    />
                    <Text style={styles.resultText}>Total Amount: ${totalHaidOther.toFixed(2)}</Text>
                </View>

                {/* Category 2: Illness or Old-age */}
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <FontAwesome6 name="heart-pulse" size={24} color={theme.colors.text.secondary} />
                        <Text style={styles.cardTitle}>Illness or Old-age</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter number of days"
                        placeholderTextColor={theme.colors.text.muted}
                        value={daysIllnessOldAge}
                        onChangeText={setDaysIllnessOldAge}
                        keyboardType="numeric"
                    />
                    <Text style={styles.resultText}>Total Amount: ${totalIllnessOldAge.toFixed(2)}</Text>
                </View>

                {/* Category 3: Pregnancy or Feeding */}
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <FontAwesome6 name="person-pregnant" size={24} color={theme.colors.text.secondary} />
                        <Text style={styles.cardTitle}>Pregnancy or Feeding</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter number of days"
                        placeholderTextColor={theme.colors.text.muted}
                        value={daysPregnancyFeeding}
                        onChangeText={setDaysPregnancyFeeding}
                        keyboardType="numeric"
                    />
                    <Text style={styles.resultText}>Total Amount: ${totalPregnancyFeeding.toFixed(2)}</Text>
                </View>

                {/* Display grand total at the bottom */}
                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Total Fidyah Payable:</Text>
                    <Text style={styles.totalAmount}>${grandTotal.toFixed(2)}</Text>
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
            padding: 16,
        },
        scrollContainer: {
            paddingBottom: 20,
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
            marginBottom: theme.spacing.small,
        },
        cardTitle: {
            fontSize: theme.fontSizes.large,
            fontFamily: 'Outfit_600SemiBold',
            color: theme.colors.text.secondary,
            marginLeft: theme.spacing.small,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.colors.secondary,
            padding: theme.spacing.small,
            textAlign: 'left',
            borderRadius: theme.borderRadius.small,
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.primary,
            marginVertical: theme.spacing.small,
        },
        resultText: {
            fontSize: theme.fontSizes.medium,
            fontFamily: 'Outfit_500Medium',
            color: theme.colors.text.secondary,
        },
        rateContainer: {
            marginBottom: theme.spacing.medium,
            alignItems: 'center',
            padding: theme.spacing.small,
            backgroundColor: theme.colors.secondary,
            borderRadius: theme.borderRadius.medium,
        },
        rateText: {
            fontSize: theme.fontSizes.medium,
            fontFamily: 'Outfit_500Medium',
            color: theme.colors.text.secondary,
        },
        totalContainer: {
            padding: theme.spacing.medium,
            backgroundColor: theme.colors.secondary,
            borderRadius: theme.borderRadius.medium,
            alignItems: 'center',
        },
        totalText: {
            fontSize: theme.fontSizes.large,
            fontFamily: 'Outfit_600SemiBold',
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.small,
        },
        totalAmount: {
            fontSize: theme.fontSizes.xLarge,
            fontFamily: 'Outfit_600SemiBold',
            color: theme.colors.text.secondary,
        },
    });

export default FidyahCalculator;
