/**
 * DoaInfoModal - Modern Design
 * 
 * Information modal explaining how to use the duas
 * 
 * @version 2.0
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { enter } from '../../../utils';

interface DoaInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const DoaInfoModal: React.FC<DoaInfoModalProps> = ({ visible, onClose }) => {
  const { theme, isDarkMode } = useTheme();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const guidelines = [
    {
      icon: 'hands-praying',
      color: theme.colors.accent,
      title: 'After Completing Salah',
      description: 'Recite these duas immediately after finishing your prayer',
    },
    {
      icon: 'list-ol',
      color: '#4CAF50',
      title: 'Follow the Order',
      description: 'Recite the supplications in the sequence shown',
    },
    {
      icon: 'heart',
      color: '#FF6B6B',
      title: 'With Sincerity',
      description: 'Say each dua with focus and understanding of its meaning',
    },
    {
      icon: 'repeat',
      color: '#9C27B0',
      title: 'Observe Repetitions',
      description: 'Some duas should be repeated the specified number of times',
    },
  ];

  const benefits = [
    'Strengthens connection with Allah',
    'Earns reward and blessings',
    'Completes the prayer properly',
    'Follows the Sunnah of Prophet ﷺ',
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
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
                <FontAwesome6 name="circle-info" size={24} color={theme.colors.accent} />
              </View>
              <View style={styles.headerContent}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                  How to Use
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                  Guidelines for reciting duas
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: theme.colors.secondary }]}>
                <FontAwesome6 name="xmark" size={18} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Guidelines Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Guidelines
                </Text>
                <View style={styles.guidelinesList}>
                  {guidelines.map((guideline, index) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={enter(0)}
                    >
                      <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        style={[styles.guidelineCard, { backgroundColor: theme.colors.secondary }]}
                      >
                        <View style={[styles.guidelineIcon, { backgroundColor: guideline.color + '15' }]}>
                          <FontAwesome6 name={guideline.icon as any} size={18} color={guideline.color} />
                        </View>
                        <View style={styles.guidelineContent}>
                          <Text style={[styles.guidelineTitle, { color: theme.colors.text.primary }]}>
                            {guideline.title}
                          </Text>
                          <Text style={[styles.guidelineDescription, { color: theme.colors.text.secondary }]}>
                            {guideline.description}
                          </Text>
                        </View>
                      </BlurView>
                    </MotiView>
                  ))}
                </View>
              </View>

              {/* Benefits Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Benefits
                </Text>
                <View style={[styles.benefitsCard, { backgroundColor: theme.colors.text.success + '15' || '#4CAF50' + '15' }]}>
                  {benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <FontAwesome6 name="circle-check" size={14} color={theme.colors.text.success || '#4CAF50'} />
                      <Text style={[styles.benefitText, { color: theme.colors.text.primary }]}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Note */}
              <View style={[styles.noteCard, { backgroundColor: theme.colors.accent + '10' }]}>
                <FontAwesome6 name="lightbulb" size={14} color={theme.colors.accent} />
                <Text style={[styles.noteText, { color: theme.colors.text.primary }]}>
                  All duas are from authentic Islamic sources and have been verified by scholars
                </Text>
              </View>
            </ScrollView>

            {/* Action Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </MotiView>
      </View>
    </Modal>
  );
};

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
    maxHeight: '80%',
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
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 12,
  },

  // Guidelines
  guidelinesList: {
    gap: 12,
  },
  guidelineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guidelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelineContent: {
    flex: 1,
    gap: 4,
  },
  guidelineTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  guidelineDescription: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 19,
  },

  // Benefits
  benefitsCard: {
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
  },

  // Note
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    lineHeight: 17,
  },

  // Footer
  footer: {
    padding: 20,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default DoaInfoModal;