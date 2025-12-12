/**
 * Savings Modal - Modern Design
 * 
 * Calculate zakat on savings after deducting interest
 * 
 * @version 2.0
 */

import React, { useState, useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// TYPES
// ============================================================================

interface SavingsModalProps {
    isVisible: boolean;
    onClose: () => void;
    initialSavings: string;
    initialInterest: string;
    onSave: (savings: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SavingsModal: React.FC<SavingsModalProps> = ({
    isVisible,
    onClose,
    initialSavings,
    initialInterest,
    onSave,
}) => {
    const { theme, isDarkMode } = useTheme();

    const [savings, setSavings] = useState<string>(initialSavings);
    const [interest, setInterest] = useState<string>(initialInterest);
    const [showInfo, setShowInfo] = useState<boolean>(false);

    const zakatable = useMemo(() => {
        const savingsAmount = parseFloat(savings) || 0;
        const interestAmount = parseFloat(interest) || 0;
        return Math.max(0, savingsAmount - interestAmount);
    }, [savings, interest]);

    const calculatedZakat = useMemo(() => {
        return (zakatable * 0.025).toFixed(2);
    }, [zakatable]);

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSave(calculatedZakat);
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
                    transition={{ type: 'spring', damping: 20 }}
                    style={styles.modalWrapper}
                >
                    <BlurView
                        intensity={30}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={[styles.modalContainer, { backgroundColor: theme.colors.primary }]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.headerIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                                <FontAwesome6 name="piggy-bank" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.headerContent}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                    Savings Zakat
                                </Text>
                                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                                    Lowest amount in the year
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowInfo(!showInfo);
                                }}
                                style={[styles.infoButton, { backgroundColor: theme.colors.secondary }]}
                            >
                                <FontAwesome6 name="circle-info" size={16} color={theme.colors.accent} />
                            </TouchableOpacity>
                        </View>

                        {/* Info Box */}
                        {showInfo && (
                            <MotiView
                                from={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ type: 'timing', duration: 200 }}
                            >
                                <View style={[styles.infoBox, { backgroundColor: theme.colors.accent + '15' }]}>
                                    <FontAwesome6 name="lightbulb" size={16} color={theme.colors.accent} />
                                    <Text style={[styles.infoText, { color: theme.colors.text.primary }]}>
                                        Zakat = (Lowest Amount - Interest) × 2.5%
                                        {'\n'}Use the lowest balance maintained throughout the year
                                    </Text>
                                </View>
                            </MotiView>
                        )}

                        {/* Content */}
                        <View style={styles.content}>
                            {/* Savings Input */}
                            <MotiView
                                from={{ opacity: 0, translateX: -20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ type: 'spring', delay: 100, damping: 20 }}
                            >
                                <BlurView
                                    intensity={20}
                                    tint={isDarkMode ? 'dark' : 'light'}
                                    style={[styles.inputCard, { backgroundColor: theme.colors.secondary }]}
                                >
                                    <View style={styles.inputHeader}>
                                        <View style={[styles.inputIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                                            <FontAwesome6 name="wallet" size={18} color="#4CAF50" />
                                        </View>
                                        <View style={styles.inputLabelWrapper}>
                                            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
                                                Lowest Amount
                                            </Text>
                                            <Text style={[styles.inputHint, { color: theme.colors.text.muted }]}>
                                                Minimum balance in the year
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={[styles.currencySymbol, { color: theme.colors.text.secondary }]}>
                                            $
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
                                            placeholder="0.00"
                                            placeholderTextColor={theme.colors.text.muted}
                                            value={savings}
                                            onChangeText={setSavings}
                                        />
                                    </View>
                                </BlurView>
                            </MotiView>

                            {/* Interest Input */}
                            <MotiView
                                from={{ opacity: 0, translateX: -20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ type: 'spring', delay: 200, damping: 20 }}
                            >
                                <BlurView
                                    intensity={20}
                                    tint={isDarkMode ? 'dark' : 'light'}
                                    style={[styles.inputCard, { backgroundColor: theme.colors.secondary }]}
                                >
                                    <View style={styles.inputHeader}>
                                        <View style={[styles.inputIcon, { backgroundColor: '#ff6b6b' + '15' }]}>
                                            <FontAwesome6 name="ban" size={18} color="#ff6b6b" />
                                        </View>
                                        <View style={styles.inputLabelWrapper}>
                                            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
                                                Interest Earned
                                            </Text>
                                            <Text style={[styles.inputHint, { color: theme.colors.text.muted }]}>
                                                To be deducted (haram)
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.inputRow}>
                                        <Text style={[styles.currencySymbol, { color: theme.colors.text.secondary }]}>
                                            $
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: theme.colors.primary,
                                                    color: theme.colors.text.primary,
                                                    borderColor: '#ff6b6b' + '30',
                                                },
                                            ]}
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                            placeholderTextColor={theme.colors.text.muted}
                                            value={interest}
                                            onChangeText={setInterest}
                                        />
                                    </View>
                                </BlurView>
                            </MotiView>

                            {/* Calculation Summary */}
                            <MotiView
                                from={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', delay: 300, damping: 20 }}
                            >
                                <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' + '15' }]}>
                                    {/* Zakatable Amount */}
                                    <View style={styles.summaryRow}>
                                        <View style={styles.summaryLabelRow}>
                                            <FontAwesome6 name="calculator" size={14} color={theme.colors.text.secondary} />
                                            <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                                                Zakatable Amount
                                            </Text>
                                        </View>
                                        <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                                            ${zakatable.toFixed(2)}
                                        </Text>
                                    </View>

                                    <View style={[styles.divider, { backgroundColor: theme.colors.text.muted + '30' }]} />

                                    {/* Zakat Payable */}
                                    <View style={styles.summaryRow}>
                                        <View style={styles.summaryLabelRow}>
                                            <FontAwesome6 name="hand-holding-dollar" size={14} color="#4CAF50" />
                                            <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>
                                                Zakat Payable
                                            </Text>
                                        </View>
                                        <Text style={[styles.zakatAmount, { color: '#4CAF50' }]}>
                                            ${calculatedZakat}
                                        </Text>
                                    </View>
                                </View>
                            </MotiView>

                            {/* Note */}
                            <View style={[styles.noteCard, { backgroundColor: theme.colors.accent + '10' }]}>
                                <FontAwesome6 name="info-circle" size={12} color={theme.colors.accent} />
                                <Text style={[styles.noteText, { color: theme.colors.text.secondary }]}>
                                    Interest earned must be given to charity separately, not as zakat
                                </Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.colors.text.success || '#4CAF50' }]}
                                onPress={handleSave}
                                activeOpacity={0.8}
                            >
                                <FontAwesome6 name="check" size={16} color="#fff" />
                                <Text style={styles.saveButtonText}>Save & Close</Text>
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
    infoButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Info Box
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 12,
        borderRadius: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        lineHeight: 17,
    },

    // Content
    content: {
        padding: 20,
        paddingTop: 0,
        gap: 16,
    },

    // Input Card
    inputCard: {
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
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputLabelWrapper: {
        flex: 1,
        gap: 2,
    },
    inputLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },
    inputHint: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    currencySymbol: {
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
    },
    input: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
        textAlign: 'right',
        borderWidth: 1.5,
    },

    // Summary
    summaryCard: {
        padding: 16,
        borderRadius: 14,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    summaryValue: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
    zakatAmount: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
    },
    divider: {
        height: 1,
    },

    // Note
    noteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: 10,
    },
    noteText: {
        flex: 1,
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 16,
    },

    // Action Buttons
    actionButtons: {
        padding: 20,
        gap: 12,
    },
    saveButton: {
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
    saveButtonText: {
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

export default SavingsModal;