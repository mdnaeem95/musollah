/**
 * Zakat Table - Modern Design
 * 
 * Display wealth categories with input and eligibility
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

import { useTheme } from '../../context/ThemeContext';
import { enter } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

interface ZakatTableProps {
    savings: string;
    setSavings: (value: string) => void;
    gold: string;
    setGold: (value: string) => void;
    insurance: string;
    setInsurance: (value: string) => void;
    shares: string;
    setShares: (value: string) => void;
    eligibility: {
        savings: { eligible: boolean; amount: string };
        gold: { eligible: boolean; notForUse: string; forUse: string };
        insurance: { eligible: boolean; amount: string };
        shares: { eligible: boolean; amount: string };
    };
    totalZakat: number;
    renderEligibilityIcon: (isEligible: boolean) => React.ReactNode;
    openModalHandlers: {
        savings: () => void;
        gold: () => void;
        insurance: () => void;
        shares: () => void;
    };
}

// ============================================================================
// DATA
// ============================================================================

const CATEGORIES = [
    { key: 'savings', icon: 'piggy-bank', label: 'Savings', color: '#4CAF50' },
    { key: 'gold', icon: 'gem', label: 'Gold', color: '#FFD700' },
    { key: 'insurance', icon: 'shield-halved', label: 'Insurance', color: '#2196F3' },
    { key: 'shares', icon: 'chart-line', label: 'Shares', color: '#9C27B0' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ZakatTable = ({
    savings,
    setSavings,
    gold,
    setGold,
    insurance,
    setInsurance,
    shares,
    setShares,
    eligibility,
    totalZakat,
    renderEligibilityIcon,
    openModalHandlers,
}: ZakatTableProps) => {
    const { theme, isDarkMode } = useTheme();

    const getValue = (key: string) => {
        switch (key) {
            case 'savings': return savings;
            case 'gold': return gold;
            case 'insurance': return insurance;
            case 'shares': return shares;
            default: return '';
        }
    };

    const setValue = (key: string) => {
        switch (key) {
            case 'savings': return setSavings;
            case 'gold': return setGold;
            case 'insurance': return setInsurance;
            case 'shares': return setShares;
            default: return () => {};
        }
    };

    const getEligibility = (key: string) => {
        return eligibility[key as keyof typeof eligibility] as any;
    };

    const getModalHandler = (key: string) => {
        return openModalHandlers[key as keyof typeof openModalHandlers];
    };

    return (
        <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.container, { backgroundColor: theme.colors.secondary }]}
        >
            {/* Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.typeCell, { color: theme.colors.text.primary }]}>
                    Category
                </Text>
                <Text style={[styles.headerCell, styles.amountCell, { color: theme.colors.text.primary }]}>
                    Amount
                </Text>
                <Text style={[styles.headerCell, styles.eligibilityCell, { color: theme.colors.text.primary }]}>
                    Status
                </Text>
            </View>

            {/* Rows */}
            {CATEGORIES.map((category, index) => {
                const isEligible = getEligibility(category.key)?.eligible;
                
                return (
                    <MotiView
                        key={category.key}
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={enter(0)}
                    >
                        <TouchableOpacity
                            style={[
                                styles.tableRow,
                                { backgroundColor: theme.colors.primary + '50' },
                                !isEligible && styles.disabledRow,
                            ]}
                            onPress={getModalHandler(category.key)}
                            disabled={!isEligible}
                            activeOpacity={0.7}
                        >
                            {/* Category */}
                            <View style={[styles.typeCell, styles.categorySection]}>
                                <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                                    <FontAwesome6
                                        name={category.icon as any}
                                        size={18}
                                        color={isEligible ? category.color : theme.colors.text.muted}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.categoryLabel,
                                        { color: isEligible ? theme.colors.text.primary : theme.colors.text.muted },
                                    ]}
                                >
                                    {category.label}
                                </Text>
                            </View>

                            {/* Amount Input */}
                            <View style={styles.amountCell}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: theme.colors.secondary,
                                            color: theme.colors.text.primary,
                                            borderColor: isEligible ? theme.colors.accent + '30' : 'transparent',
                                        },
                                    ]}
                                    placeholder="$0"
                                    placeholderTextColor={theme.colors.text.muted}
                                    value={getValue(category.key)}
                                    onChangeText={setValue(category.key)}
                                    keyboardType="numeric"
                                    editable={isEligible}
                                />
                            </View>

                            {/* Eligibility Status */}
                            <View style={styles.eligibilityCell}>
                                {renderEligibilityIcon(isEligible)}
                            </View>
                        </TouchableOpacity>
                    </MotiView>
                );
            })}

            {/* Total Row */}
            <View style={[styles.totalRow, { backgroundColor: theme.colors.accent + '15' }]}>
                <View style={styles.totalLabel}>
                    <FontAwesome6 name="calculator" size={18} color={theme.colors.accent} />
                    <Text style={[styles.totalText, { color: theme.colors.accent }]}>
                        Total Zakat Payable
                    </Text>
                </View>
                <Text style={[styles.totalAmount, { color: theme.colors.accent }]}>
                    ${totalZakat > 0 ? totalZakat.toFixed(2) : '0.00'}
                </Text>
            </View>
        </BlurView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },

    // Header
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    headerCell: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    typeCell: {
        flex: 2,
    },
    amountCell: {
        flex: 1,
        alignItems: 'center',
    },
    eligibilityCell: {
        width: 50,
        alignItems: 'center',
    },

    // Row
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    disabledRow: {
        opacity: 0.5,
    },
    categorySection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },

    // Input
    input: {
        width: '100%',
        height: 40,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        textAlign: 'right',
        borderWidth: 1,
    },

    // Total Row
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderTopWidth: 2,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    totalLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    totalText: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
    },
    totalAmount: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
    },
});

export default ZakatTable;