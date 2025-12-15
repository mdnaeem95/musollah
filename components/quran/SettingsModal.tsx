/**
 * SettingsModal - Modern Design
 * 
 * Quran reading settings with glassmorphism and smooth animations
 * 
 * @version 2.0
 */

import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { reciterOptions } from '../../utils/constants';
import { enter } from '../../utils';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  textSize: number;
  onTextSizeChange: (value: number) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toggleDarkModeAnimated?: () => void;
  reciter: string;
  onReciterChange: (value: string) => void;
  activeTheme: any;
  showReciter?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  onClose,
  textSize,
  onTextSizeChange,
  isDarkMode,
  toggleDarkMode,
  toggleDarkModeAnimated,
  reciter,
  onReciterChange,
  activeTheme,
  showReciter = true,
}) => {
  const styles = createStyles(activeTheme);
  const handleToggleDarkMode = toggleDarkModeAnimated ?? toggleDarkMode;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleReciterSelect = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReciterChange(value);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isVisible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop with Blur */}
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />

        {/* Modal Content */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={enter(0)}
          style={styles.modalWrapper}
        >
          <BlurView
            intensity={30}
            tint={activeTheme.isDarkMode ? 'dark' : 'light'}
            style={[styles.modalContainer, { backgroundColor: activeTheme.colors.secondary }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: activeTheme.colors.accent + '15' }]}>
                <FontAwesome6 name="gear" size={20} color={activeTheme.colors.accent} />
              </View>
              <Text style={styles.headerTitle}>Quran Settings</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <FontAwesome6 name="xmark" size={20} color={activeTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
              {/* Text Size Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FontAwesome6 name="text-height" size={16} color={activeTheme.colors.accent} />
                  <Text style={styles.sectionTitle}>Text Size</Text>
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Aa</Text>
                  <Slider
                    value={textSize}
                    onValueChange={onTextSizeChange}
                    minimumValue={26}
                    maximumValue={36}
                    step={2}
                    thumbTintColor={activeTheme.colors.accent}
                    minimumTrackTintColor={activeTheme.colors.accent}
                    maximumTrackTintColor={activeTheme.colors.muted}
                    style={styles.slider}
                  />
                  <Text style={[styles.sliderLabel, { fontSize: 20 }]}>Aa</Text>
                </View>
                <Text style={styles.sliderValue}>Size: {textSize}pt</Text>
              </View>

              {/* Appearance Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FontAwesome6 name="circle-half-stroke" size={16} color={activeTheme.colors.accent} />
                  <Text style={styles.sectionTitle}>Appearance</Text>
                </View>
                <View style={styles.appearanceToggle}>
                  <TouchableOpacity
                    style={[
                      styles.appearanceOption,
                      !isDarkMode && [styles.appearanceOptionActive, { backgroundColor: activeTheme.colors.accent }]
                    ]}
                    onPress={() => {
                      if (isDarkMode) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleToggleDarkMode();
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome6 
                      name="sun" 
                      size={18} 
                      color={!isDarkMode ? '#fff' : activeTheme.colors.text.secondary} 
                    />
                    <Text style={[
                      styles.appearanceText,
                      { color: !isDarkMode ? '#fff' : activeTheme.colors.text.secondary }
                    ]}>
                      Light
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.appearanceOption,
                      isDarkMode && [styles.appearanceOptionActive, { backgroundColor: activeTheme.colors.accent }]
                    ]}
                    onPress={() => {
                      if (!isDarkMode) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleToggleDarkMode();
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome6 
                      name="moon" 
                      size={18} 
                      color={isDarkMode ? '#fff' : activeTheme.colors.text.secondary} 
                    />
                    <Text style={[
                      styles.appearanceText,
                      { color: isDarkMode ? '#fff' : activeTheme.colors.text.secondary }
                    ]}>
                      Dark
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reciter Section */}
              {showReciter && (
                <View style={[styles.section, styles.reciterSection]}>
                  <View style={styles.sectionHeader}>
                    <FontAwesome6 name="microphone" size={16} color={activeTheme.colors.accent} />
                    <Text style={styles.sectionTitle}>Reciter</Text>
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.reciterScroll}
                    contentContainerStyle={styles.reciterScrollContent}
                  >
                    {reciterOptions.map((option: any, index: number) => (
                      <MotiView
                        key={option.value}
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={enter(0)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.reciterCard,
                            reciter === option.value && [
                              styles.reciterCardActive,
                              { backgroundColor: activeTheme.colors.accent }
                            ]
                          ]}
                          onPress={() => handleReciterSelect(option.value)}
                          activeOpacity={0.7}
                        >
                          <FontAwesome6 
                            name="user-tie" 
                            size={20} 
                            color={reciter === option.value ? '#fff' : activeTheme.colors.text.secondary} 
                          />
                          <Text style={[
                            styles.reciterName,
                            { color: reciter === option.value ? '#fff' : activeTheme.colors.text.primary }
                          ]}>
                            {option.label}
                          </Text>
                          {reciter === option.value && (
                            <View style={styles.checkmark}>
                              <FontAwesome6 name="circle-check" size={16} color="#fff" solid />
                            </View>
                          )}
                        </TouchableOpacity>
                      </MotiView>
                    ))}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          </BlurView>
        </MotiView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalOverlay: {
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
      borderRadius: 24,
      overflow: 'hidden',
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.muted + '30',
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.text.primary,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.muted,
    },

    // Content
    content: {
      padding: 20,
    },

    // Section
    section: {
      marginBottom: 24,
    },
    reciterSection: {
      marginBottom: 32, // ✅ More margin below reciter section
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
    },

    // Text Size Slider
    sliderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    slider: {
      flex: 1,
      height: 40,
    },
    sliderLabel: {
      fontSize: 14,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.secondary,
    },
    sliderValue: {
      fontSize: 13,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },

    // Appearance Toggle
    appearanceToggle: {
      flexDirection: 'row',
      gap: 12,
    },
    appearanceOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.muted,
    },
    appearanceOptionActive: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    appearanceText: {
      fontSize: 15,
      fontFamily: 'Outfit_600SemiBold',
    },

    // Reciter Cards
    reciterScroll: {
      marginBottom: 20
    },
    reciterScrollContent: {
      paddingRight: 12, // ✅ Right padding for scrollview
    },
    reciterCard: {
      minWidth: 150,
      padding: 16,
      borderRadius: 16,
      marginRight: 12,
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.muted,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    reciterCardActive: {
      borderColor: theme.colors.accent,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    reciterName: {
      fontSize: 14,
      fontFamily: 'Outfit_600SemiBold',
      textAlign: 'center',
    },
    checkmark: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
  });

export default SettingsModal;