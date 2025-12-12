/**
 * Insurance Modal - Modern Design
 * 
 * Calculate zakat on insurance/takaful plans
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

interface InsuranceModalProps {
    isVisible: boolean;
    onClose: () => void;
    initialInsuranceAmount: string;
    onSave: (insuranceAmount: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const InsuranceModal: React.FC<InsuranceModalProps> = ({
    isVisible,
    onClose,
    initialInsuranceAmount,
    onSave,
}) => {
    const { theme, isDarkMode } = useTheme();

    const [insuranceAmount, setInsuranceAmount] = useState<string>(initialInsuranceAmount);
    const [showInfo, setShowInfo] = useState<boolean>(false);

    const calculatedZakat = useMemo(() => {
        const amount = parseFloat(insuranceAmount) || 0;
        return (amount * 0.025).toFixed(2);
    }, [insuranceAmount]);

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSave(insuranceAmount);
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
                            <View style={[styles.headerIcon, { backgroundColor: '#2196F3' + '15' }]}>
                                <FontAwesome6 name="shield-halved" size={24} color="#2196F3" />
                            </View>
                            <View style={styles.headerContent}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                    Insurance Zakat
                                </Text>
                                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                                    Conventional or Takaful
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
                                        Calculate 2.5% on surrender value (conventional) or premium (takaful endowment plans)
                                    </Text>
                                </View>
                            </MotiView>
                        )}

                        {/* Content */}
                        <View style={styles.content}>
                            <MotiView
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'spring', delay: 100, damping: 20 }}
                            >
                                <BlurView
                                    intensity={20}
                                    tint={isDarkMode ? 'dark' : 'light'}
                                    style={[styles.inputCard, { backgroundColor: theme.colors.secondary }]}
                                >
                                    <View style={styles.inputHeader}>
                                        <View style={[styles.inputIcon, { backgroundColor: '#2196F3' + '15' }]}>
                                            <FontAwesome6 name="file-contract" size={18} color="#2196F3" />
                                        </View>
                                        <View style={styles.inputLabelWrapper}>
                                            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
                                                Insurance Value
                                            </Text>
                                            <Text style={[styles.inputHint, { color: theme.colors.text.muted }]}>
                                                Surrender value or premium
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
                                            value={insuranceAmount}
                                            onChangeText={setInsuranceAmount}
                                        />
                                    </View>
                                </BlurView>
                            </MotiView>

                            {/* Result */}
                            <MotiView
                                from={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', delay: 200, damping: 20 }}
                            >
                                <View style={[styles.resultCard, { backgroundColor: '#2196F3' + '15' }]}>
                                    <View style={styles.resultHeader}>
                                        <FontAwesome6 name="calculator" size={16} color="#2196F3" />
                                        <Text style={[styles.resultLabel, { color: theme.colors.text.secondary }]}>
                                            Zakat Payable
                                        </Text>
                                    </View>
                                    <Text style={[styles.resultAmount, { color: '#2196F3' }]}>
                                        ${calculatedZakat}
                                    </Text>
                                </View>
                            </MotiView>
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
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        lineHeight: 18,
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

    // Result
    resultCard: {
        padding: 16,
        borderRadius: 14,
        gap: 10,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resultLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    resultAmount: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
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

export default InsuranceModal;