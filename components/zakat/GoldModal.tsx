/**
 * Gold Modal - Modern Design
 * 
 * Input gold amounts (worn/unworn) and calculate zakat
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
import { enter } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

interface GoldModalProps {
    isVisible: boolean;
    onClose: () => void;
    initialUsedGold: string;
    initialUnusedGold: string;
    onSave: (usedGold: string, unusedGold: string) => void;
    currentGoldPrice: number;
    formattedTimestamp: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GoldModal: React.FC<GoldModalProps> = ({
    isVisible,
    onClose,
    initialUsedGold,
    initialUnusedGold,
    onSave,
    currentGoldPrice,
    formattedTimestamp,
}) => {
    const { theme, isDarkMode } = useTheme();

    const [usedGold, setUsedGold] = useState<string>(initialUsedGold);
    const [unusedGold, setUnusedGold] = useState<string>(initialUnusedGold);
    const [showInfo, setShowInfo] = useState<boolean>(false);

    const totalZakat = useMemo(() => {
        const used = parseFloat(usedGold) || 0;
        const unused = parseFloat(unusedGold) || 0;
        return ((currentGoldPrice * used * 0.0025) + (currentGoldPrice * unused * 0.0025)).toFixed(2);
    }, [usedGold, unusedGold, currentGoldPrice]);

    const totalGrams = useMemo(() => {
        const used = parseFloat(usedGold) || 0;
        const unused = parseFloat(unusedGold) || 0;
        return (used + unused).toFixed(2);
    }, [usedGold, unusedGold]);

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSave(usedGold, unusedGold);
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
                            <View style={[styles.headerIcon, { backgroundColor: '#FFD700' + '15' }]}>
                                <FontAwesome6 name="gem" size={24} color="#FFD700" />
                            </View>
                            <View style={styles.headerContent}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                    Gold Zakat
                                </Text>
                                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                                    Calculate based on ownership
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
                                        Zakat = (Gold Price × Weight) × 2.5%
                                    </Text>
                                </View>
                            </MotiView>
                        )}

                        {/* Content */}
                        <View style={styles.content}>
                            {/* Gold For Use */}
                            <MotiView
                                from={{ opacity: 0, translateX: -20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={enter(0)}
                            >
                                <BlurView
                                    intensity={20}
                                    tint={isDarkMode ? 'dark' : 'light'}
                                    style={[styles.inputCard, { backgroundColor: theme.colors.secondary }]}
                                >
                                    <View style={styles.inputHeader}>
                                        <View style={[styles.inputIcon, { backgroundColor: '#FFD700' + '15' }]}>
                                            <FontAwesome6 name="ring" size={18} color="#FFD700" />
                                        </View>
                                        <View style={styles.inputLabelWrapper}>
                                            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
                                                Gold for Use
                                            </Text>
                                            <Text style={[styles.inputHint, { color: theme.colors.text.muted }]}>
                                                Jewelry, ornaments
                                            </Text>
                                        </View>
                                    </View>
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
                                        placeholder="0"
                                        placeholderTextColor={theme.colors.text.muted}
                                        value={usedGold}
                                        onChangeText={setUsedGold}
                                    />
                                    <Text style={[styles.unitLabel, { color: theme.colors.text.muted }]}>grams</Text>
                                </BlurView>
                            </MotiView>

                            {/* Gold Not For Use */}
                            <MotiView
                                from={{ opacity: 0, translateX: -20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={enter(0)}
                            >
                                <BlurView
                                    intensity={20}
                                    tint={isDarkMode ? 'dark' : 'light'}
                                    style={[styles.inputCard, { backgroundColor: theme.colors.secondary }]}
                                >
                                    <View style={styles.inputHeader}>
                                        <View style={[styles.inputIcon, { backgroundColor: '#FFD700' + '15' }]}>
                                            <FontAwesome6 name="coins" size={18} color="#FFD700" />
                                        </View>
                                        <View style={styles.inputLabelWrapper}>
                                            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
                                                Gold Not for Use
                                            </Text>
                                            <Text style={[styles.inputHint, { color: theme.colors.text.muted }]}>
                                                Investment, bars
                                            </Text>
                                        </View>
                                    </View>
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
                                        placeholder="0"
                                        placeholderTextColor={theme.colors.text.muted}
                                        value={unusedGold}
                                        onChangeText={setUnusedGold}
                                    />
                                    <Text style={[styles.unitLabel, { color: theme.colors.text.muted }]}>grams</Text>
                                </BlurView>
                            </MotiView>

                            {/* Summary */}
                            <MotiView
                                from={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={enter(0)}
                            >
                                <View style={[styles.summaryCard, { backgroundColor: '#FFD700' + '15' }]}>
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                                            Total Gold
                                        </Text>
                                        <Text style={[styles.summaryValue, { color: '#FFD700' }]}>
                                            {totalGrams}g
                                        </Text>
                                    </View>
                                    <View style={[styles.divider, { backgroundColor: theme.colors.text.muted + '30' }]} />
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                                            Zakat Payable
                                        </Text>
                                        <Text style={[styles.summaryValue, { color: '#FFD700' }]}>
                                            ${totalZakat}
                                        </Text>
                                    </View>
                                </View>
                            </MotiView>

                            {/* Gold Price Info */}
                            <View style={[styles.priceInfo, { backgroundColor: theme.colors.secondary }]}>
                                <FontAwesome6 name="circle-info" size={12} color={theme.colors.text.muted} />
                                <Text style={[styles.priceText, { color: theme.colors.text.muted }]}>
                                    ${currentGoldPrice.toFixed(2)}/gram • {formattedTimestamp}
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
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 12,
        borderRadius: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
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
    input: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
        textAlign: 'right',
        borderWidth: 1.5,
    },
    unitLabel: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        textAlign: 'right',
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
    summaryLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    summaryValue: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
    },
    divider: {
        height: 1,
    },

    // Price Info
    priceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 10,
    },
    priceText: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
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

export default GoldModal;