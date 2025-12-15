/**
 * Eligibility Modal - Modern Design
 * 
 * Check eligibility for each wealth category
 * 
 * @version 2.0
 */

import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Switch,
    ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { enter } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

interface EligibilityModalProps {
    isVisible: boolean;
    onClose: () => void;
    initialEligibility: {
        savings: string;
        goldNotForUse: string;
        goldForUse: string;
        insurance: string;
        shares: string;
    };
    initialHaulStates: {
        savingsHaul: boolean;
        goldNotWearingHaul: boolean;
        goldWearingHaul: boolean;
    };
    onCalculate: (eligibility: {
        savings: { eligible: boolean; amount: string };
        gold: { eligible: boolean; notForUse: string; forUse: string };
        insurance: { eligible: boolean; amount: string };
        shares: { eligible: boolean; amount: string };
    }) => void;
    nisabAmount: number;
    nisabAmountNotWearing: number;
    urufAmountWearing: number;
}

// ============================================================================
// DATA
// ============================================================================

const CATEGORIES = [
    {
        id: 'savings',
        title: 'Savings',
        icon: 'piggy-bank',
        color: '#4CAF50',
        unit: '$',
        hasHaul: true,
    },
    {
        id: 'goldNotForUse',
        title: 'Gold - Not for Use',
        icon: 'gem',
        color: '#FFD700',
        unit: 'g',
        hasHaul: true,
        haulKey: 'goldNotWearingHaul',
    },
    {
        id: 'goldForUse',
        title: 'Gold - For Use',
        icon: 'ring',
        color: '#FFD700',
        unit: 'g',
        hasHaul: true,
        haulKey: 'goldWearingHaul',
    },
    {
        id: 'insurance',
        title: 'Insurance',
        icon: 'shield-halved',
        color: '#2196F3',
        unit: '$',
        hasHaul: false,
    },
    {
        id: 'shares',
        title: 'Shares',
        icon: 'chart-line',
        color: '#9C27B0',
        unit: '$',
        hasHaul: false,
    },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EligibilityModal: React.FC<EligibilityModalProps> = ({
    isVisible,
    onClose,
    initialEligibility,
    initialHaulStates,
    onCalculate,
    nisabAmount,
    nisabAmountNotWearing,
    urufAmountWearing,
}) => {
    const { theme, isDarkMode } = useTheme();

    const [eligibilitySavings, setEligibilitySavings] = useState(initialEligibility.savings);
    const [eligibilityGoldNotForUse, setEligibilityGoldNotForUse] = useState(initialEligibility.goldNotForUse);
    const [eligibilityGoldForUse, setEligibilityGoldForUse] = useState(initialEligibility.goldForUse);
    const [eligibilityInsurance, setEligibilityInsurance] = useState(initialEligibility.insurance);
    const [eligibilityShares, setEligibilityShares] = useState(initialEligibility.shares);

    const [savingsHaul, setSavingsHaul] = useState(initialHaulStates.savingsHaul);
    const [goldNotWearingHaul, setGoldNotWearingHaul] = useState(initialHaulStates.goldNotWearingHaul);
    const [goldWearingHaul, setGoldWearingHaul] = useState(initialHaulStates.goldWearingHaul);

    const getSetterForId = (id: string) => {
        switch (id) {
            case 'savings': return setEligibilitySavings;
            case 'goldNotForUse': return setEligibilityGoldNotForUse;
            case 'goldForUse': return setEligibilityGoldForUse;
            case 'insurance': return setEligibilityInsurance;
            case 'shares': return setEligibilityShares;
            default: return () => {};
        }
    };

    const getValueForId = (id: string) => {
        switch (id) {
            case 'savings': return eligibilitySavings;
            case 'goldNotForUse': return eligibilityGoldNotForUse;
            case 'goldForUse': return eligibilityGoldForUse;
            case 'insurance': return eligibilityInsurance;
            case 'shares': return eligibilityShares;
            default: return '';
        }
    };

    const getHaulState = (haulKey?: string) => {
        if (!haulKey) return undefined;
        switch (haulKey) {
            case 'savingsHaul': return { value: savingsHaul, setter: setSavingsHaul };
            case 'goldNotWearingHaul': return { value: goldNotWearingHaul, setter: setGoldNotWearingHaul };
            case 'goldWearingHaul': return { value: goldWearingHaul, setter: setGoldWearingHaul };
            default: return undefined;
        }
    };

    const handleCalculate = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        const savingsEligible = parseFloat(eligibilitySavings) >= nisabAmount && savingsHaul;
        const goldNotWearingEligible =
            parseFloat(eligibilityGoldNotForUse) >= nisabAmountNotWearing && goldNotWearingHaul;
        const goldWearingEligible = parseFloat(eligibilityGoldForUse) >= urufAmountWearing && goldWearingHaul;
        const goldEligible = goldNotWearingEligible || goldWearingEligible;
        const insuranceEligible = parseFloat(eligibilityInsurance) >= nisabAmount;
        const sharesEligible = parseFloat(eligibilityShares) >= nisabAmount;

        onCalculate({
            savings: { eligible: savingsEligible, amount: eligibilitySavings },
            gold: {
                eligible: goldEligible,
                notForUse: eligibilityGoldNotForUse,
                forUse: eligibilityGoldForUse,
            },
            insurance: {
                eligible: insuranceEligible,
                amount: insuranceEligible ? (parseFloat(eligibilityInsurance) * 0.025).toFixed(2) : '0',
            },
            shares: {
                eligible: sharesEligible,
                amount: sharesEligible ? (parseFloat(eligibilityShares) * 0.025).toFixed(2) : '0',
            },
        });

        onClose();
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={[styles.modalBackground, { backgroundColor: theme.colors.modalBackground }]}>
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={enter(0)}
                    style={styles.modalWrapper}
                >
                    <BlurView
                        intensity={30}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={[styles.modalContainer, { backgroundColor: theme.colors.primary }]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                                <FontAwesome6 name="clipboard-check" size={24} color={theme.colors.accent} />
                            </View>
                            <View style={styles.headerContent}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                    Eligibility Check
                                </Text>
                                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                                    Assess your zakat requirements
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={[styles.closeButton, { backgroundColor: theme.colors.secondary }]}
                            >
                                <FontAwesome6 name="xmark" size={18} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {CATEGORIES.map((category, index) => {
                                const haulState = category.hasHaul ? getHaulState(category.haulKey || 'savingsHaul') : undefined;

                                return (
                                    <MotiView
                                        key={category.id}
                                        from={{ opacity: 0, translateX: -20 }}
                                        animate={{ opacity: 1, translateX: 0 }}
                                        transition={enter(0)}
                                    >
                                        <BlurView
                                            intensity={20}
                                            tint={isDarkMode ? 'dark' : 'light'}
                                            style={[styles.categoryCard, { backgroundColor: theme.colors.secondary }]}
                                        >
                                            {/* Category Header */}
                                            <View style={styles.categoryHeader}>
                                                <View style={[styles.categoryIconBadge, { backgroundColor: category.color + '15' }]}>
                                                    <FontAwesome6 name={category.icon as any} size={18} color={category.color} />
                                                </View>
                                                <Text style={[styles.categoryTitle, { color: theme.colors.text.primary }]}>
                                                    {category.title}
                                                </Text>
                                            </View>

                                            {/* Amount Input */}
                                            <View style={styles.inputWrapper}>
                                                <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                                                    Amount ({category.unit})
                                                </Text>
                                                <TextInput
                                                    style={[
                                                        styles.input,
                                                        {
                                                            backgroundColor: theme.colors.primary,
                                                            color: theme.colors.text.primary,
                                                            borderColor: theme.colors.accent + '30',
                                                        },
                                                    ]}
                                                    keyboardType="numeric"
                                                    placeholder={`0 ${category.unit}`}
                                                    placeholderTextColor={theme.colors.text.muted}
                                                    value={getValueForId(category.id)}
                                                    onChangeText={getSetterForId(category.id)}
                                                />
                                            </View>

                                            {/* Haul Toggle */}
                                            {category.hasHaul && haulState && (
                                                <View style={styles.haulRow}>
                                                    <View style={styles.haulLabel}>
                                                        <FontAwesome6 name="calendar-check" size={14} color={theme.colors.text.secondary} />
                                                        <Text style={[styles.haulText, { color: theme.colors.text.secondary }]}>
                                                            Haul Completed (1 Year)
                                                        </Text>
                                                    </View>
                                                    <Switch
                                                        value={haulState.value}
                                                        onValueChange={(value) => {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                            haulState.setter(value);
                                                        }}
                                                        trackColor={{
                                                            false: theme.colors.secondary,
                                                            true: theme.colors.text.success || '#4CAF50',
                                                        }}
                                                        thumbColor={haulState.value ? '#fff' : theme.colors.text.muted}
                                                    />
                                                </View>
                                            )}
                                        </BlurView>
                                    </MotiView>
                                );
                            })}
                        </ScrollView>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.calculateButton, { backgroundColor: theme.colors.accent }]}
                                onPress={handleCalculate}
                                activeOpacity={0.8}
                            >
                                <FontAwesome6 name="calculator" size={16} color="#fff" />
                                <Text style={styles.calculateButtonText}>Calculate Eligibility</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.cancelButton,
                                    {
                                        backgroundColor: theme.colors.secondary,
                                        borderColor: theme.colors.text.error || '#ff6b6b',
                                    },
                                ]}
                                onPress={handleClose}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.cancelButtonText, { color: theme.colors.text.error || '#ff6b6b' }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </MotiView>
            </View>
        </Modal>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalWrapper: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
    },
    modalContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 12,
    },
    headerIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        gap: 2,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
    },
    modalSubtitle: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Content
    scrollView: {
        maxHeight: 500,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
        gap: 16,
    },

    // Category Card
    categoryCard: {
        padding: 16,
        borderRadius: 14,
        gap: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    categoryIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },

    // Input
    inputWrapper: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        borderWidth: 1.5,
    },

    // Haul Toggle
    haulRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
    },
    haulLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    haulText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
    },

    // Action Buttons
    actionButtons: {
        padding: 20,
        gap: 12,
    },
    calculateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
    cancelButton: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    cancelButtonText: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },
});

export default EligibilityModal;