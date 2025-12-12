/**
 * Guide Modal - Modern Design
 * 
 * Instructions for using the Zakat calculator
 * 
 * @version 2.0
 */

import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// TYPES
// ============================================================================

interface GuideModalProps {
    isVisible: boolean;
    onClose: () => void;
}

// ============================================================================
// DATA
// ============================================================================

const GUIDE_STEPS = [
    {
        icon: 'clipboard-check',
        color: '#4CAF50',
        title: 'Check Eligibility',
        description: 'Tap "Check Eligibility" to assess your eligibility for the 4 wealth categories.',
    },
    {
        icon: 'pen-to-square',
        color: '#2196F3',
        title: 'Input Values',
        description: 'If any category is eligible, tap on it and enter the appropriate values.',
    },
    {
        icon: 'calculator',
        color: '#9C27B0',
        title: 'View Total',
        description: 'The total zakat required to pay will be displayed at the bottom of the table.',
    },
    {
        icon: 'hand-holding-dollar',
        color: '#FF9800',
        title: 'Pay Zakat',
        description: 'Use the calculated amount to fulfill your zakat obligation through trusted channels.',
    },
];

const INFO_ITEMS = [
    {
        icon: 'scale-balanced',
        label: 'Nisab',
        value: 'Minimum threshold',
        color: '#4CAF50',
    },
    {
        icon: 'percent',
        label: 'Rate',
        value: '2.5% of wealth',
        color: '#2196F3',
    },
    {
        icon: 'calendar-days',
        label: 'Haul',
        value: 'One lunar year',
        color: '#9C27B0',
    },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GuideModal: React.FC<GuideModalProps> = ({ isVisible, onClose }) => {
    const { theme, isDarkMode } = useTheme();

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
                            <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                                <FontAwesome6 name="book-open" size={24} color={theme.colors.accent} />
                            </View>
                            <View style={styles.headerContent}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                    Calculator Guide
                                </Text>
                                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                                    How to use this calculator
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
                        >
                            {/* Steps */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                                    Quick Start
                                </Text>
                                {GUIDE_STEPS.map((step, index) => (
                                    <MotiView
                                        key={index}
                                        from={{ opacity: 0, translateX: -20 }}
                                        animate={{ opacity: 1, translateX: 0 }}
                                        transition={{
                                            type: 'spring',
                                            delay: index * 100,
                                            damping: 20,
                                        }}
                                    >
                                        <BlurView
                                            intensity={20}
                                            tint={isDarkMode ? 'dark' : 'light'}
                                            style={[styles.stepCard, { backgroundColor: theme.colors.secondary }]}
                                        >
                                            <View style={styles.stepHeader}>
                                                <View style={[styles.stepNumber, { backgroundColor: step.color + '15' }]}>
                                                    <Text style={[styles.stepNumberText, { color: step.color }]}>
                                                        {index + 1}
                                                    </Text>
                                                </View>
                                                <View style={[styles.stepIcon, { backgroundColor: step.color + '15' }]}>
                                                    <FontAwesome6 name={step.icon as any} size={18} color={step.color} />
                                                </View>
                                            </View>
                                            <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
                                                {step.title}
                                            </Text>
                                            <Text style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
                                                {step.description}
                                            </Text>
                                        </BlurView>
                                    </MotiView>
                                ))}
                            </View>

                            {/* Important Info */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                                    Key Information
                                </Text>
                                {INFO_ITEMS.map((item, index) => (
                                    <MotiView
                                        key={index}
                                        from={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            type: 'spring',
                                            delay: (GUIDE_STEPS.length * 100) + (index * 80),
                                            damping: 20,
                                        }}
                                    >
                                        <View style={[styles.infoCard, { backgroundColor: theme.colors.secondary }]}>
                                            <View style={[styles.infoIcon, { backgroundColor: item.color + '15' }]}>
                                                <FontAwesome6 name={item.icon as any} size={18} color={item.color} />
                                            </View>
                                            <View style={styles.infoContent}>
                                                <Text style={[styles.infoLabel, { color: theme.colors.text.primary }]}>
                                                    {item.label}
                                                </Text>
                                                <Text style={[styles.infoValue, { color: theme.colors.text.secondary }]}>
                                                    {item.value}
                                                </Text>
                                            </View>
                                        </View>
                                    </MotiView>
                                ))}
                            </View>

                            {/* Note */}
                            <MotiView
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{
                                    type: 'spring',
                                    delay: (GUIDE_STEPS.length * 100) + (INFO_ITEMS.length * 80) + 100,
                                    damping: 20,
                                }}
                            >
                                <View style={[styles.noteCard, { backgroundColor: theme.colors.accent + '10' }]}>
                                    <FontAwesome6 name="lightbulb" size={16} color={theme.colors.accent} />
                                    <Text style={[styles.noteText, { color: theme.colors.text.primary }]}>
                                        Zakat purifies wealth and helps those in need. Consult with a scholar if you have specific questions about your obligations.
                                    </Text>
                                </View>
                            </MotiView>
                        </ScrollView>

                        {/* Action Button */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.closeActionButton, { backgroundColor: theme.colors.accent }]}
                                onPress={handleClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.closeActionButtonText}>Got It</Text>
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
        gap: 24,
    },

    // Section
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 4,
    },

    // Step Card
    stepCard: {
        padding: 16,
        borderRadius: 14,
        gap: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: 14,
        fontFamily: 'Outfit_700Bold',
    },
    stepIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
    stepDescription: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 20,
    },

    // Info Card
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
        gap: 2,
    },
    infoLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },
    infoValue: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },

    // Note Card
    noteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderRadius: 14,
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 19,
    },

    // Action Buttons
    actionButtons: {
        padding: 20,
    },
    closeActionButton: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    closeActionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
});

export default GuideModal;