import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

const FidyahCalculator = () => {
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
                        <FontAwesome6 name="droplet" size={24} color="#ECDFCC" />
                        <Text style={styles.cardTitle}>Haid or Other Reason</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter number of days"
                        placeholderTextColor="#ECDFCC"
                        value={daysHaidOther}
                        onChangeText={setDaysHaidOther}
                        keyboardType="numeric"
                    />
                    <Text style={styles.resultText}>Total Amount: ${totalHaidOther.toFixed(2)}</Text>
                </View>

                {/* Category 2: Illness or Old-age */}
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <FontAwesome6 name="heart-pulse" size={24} color="#ECDFCC" />
                        <Text style={styles.cardTitle}>Illness or Old-age</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter number of days"
                        placeholderTextColor="#ECDFCC"
                        value={daysIllnessOldAge}
                        onChangeText={setDaysIllnessOldAge}
                        keyboardType="numeric"
                    />
                    <Text style={styles.resultText}>Total Amount: ${totalIllnessOldAge.toFixed(2)}</Text>
                </View>

                {/* Category 3: Pregnancy or Feeding */}
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <FontAwesome6 name="person-pregnant" size={24} color="#ECDFCC" />
                        <Text style={styles.cardTitle}>Pregnancy or Feeding</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter number of days"
                        placeholderTextColor="#ECDFCC"
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

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#2E3D3A',
        padding: 16,
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#3D4F4C',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#ECDFCC',
        marginLeft: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#4D6561',
        padding: 10,
        textAlign: 'left',
        borderRadius: 5,
        color: '#ECDFCC',
        backgroundColor: '#3A504C',
        marginVertical: 10
    },
    resultText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#ECDFCC',
    },
    rateContainer: {
        marginBottom: 20,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#3D4F4C',
        borderRadius: 15,
    },
    rateText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#ECDFCC',
    },
    totalContainer: {
        padding: 15,
        backgroundColor: '#3D4F4C',
        borderRadius: 15,
        alignItems: 'center',
    },
    totalText: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#ECDFCC',
        marginBottom: 5,
    },
    totalAmount: {
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
        color: '#ECDFCC',
    },
});

export default FidyahCalculator;
