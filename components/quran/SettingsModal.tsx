import React from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Slider, Switch } from '@rneui/base';
import { reciterOptions } from '../../utils/constants';
import ThemedButton from '../ThemedButton';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  textSize: number;
  onTextSizeChange: (value: number) => void;
  isDarkMode: boolean;

  // old instant toggle (keep)
  toggleDarkMode: () => void;

  // ✅ new animated toggle (optional)
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
  toggleDarkModeAnimated, // ✅ new
  reciter,
  onReciterChange,
  activeTheme,
  showReciter,
}) => {
  const styles = createStyles(activeTheme);

  // ✅ use animated toggle if available
  const handleToggleDarkMode = toggleDarkModeAnimated ?? toggleDarkMode;

  return (
    <Modal transparent animationType="fade" visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Settings</Text>

          <View style={styles.modalRow}>
            <Text style={styles.modalText}>Text Size</Text>
            <Slider
              value={textSize}
              onValueChange={onTextSizeChange}
              minimumValue={26}
              maximumValue={36}
              step={2}
              thumbTintColor={activeTheme.colors.accent}
              minimumTrackTintColor={activeTheme.colors.text.success}
              maximumTrackTintColor={activeTheme.colors.text.muted}
              style={styles.slider}
            />
          </View>

          <View style={styles.modalRow}>
            <Text style={styles.modalText}>Appearance</Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>Light</Text>
              <Switch
                value={isDarkMode}
                onValueChange={handleToggleDarkMode} 
                thumbColor={activeTheme.colors.accent}
                trackColor={{
                  false: activeTheme.colors.secondary,
                  true: activeTheme.colors.primary,
                }}
              />
              <Text style={styles.toggleText}>Dark</Text>
            </View>
          </View>

          {showReciter && (
            <View style={[styles.modalRow, { flexDirection: 'column', gap: 20 }]}>
              <Text style={[styles.modalText, { alignSelf: 'flex-start' }]}>Reciter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {reciterOptions.map((reciterOption: any) => (
                  <TouchableOpacity
                    key={reciterOption.value}
                    style={[
                      styles.reciterCard,
                      reciter === reciterOption.value && styles.reciterCardActive,
                    ]}
                    onPress={() => onReciterChange(reciterOption.value)}
                  >
                    <Text
                      style={[
                        styles.reciterCardText,
                        reciter === reciterOption.value && styles.reciterCardTextActive,
                      ]}
                    >
                      {reciterOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <ThemedButton 
            text="Close"
            onPress={onClose}
            textStyle={{ color: activeTheme.colors.text.primary }}
          />
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.modalBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '80%',
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
    },
    modalHeader: {
      fontSize: theme.fontSizes.xLarge,
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.large,
      textAlign: 'center',
    },
    modalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    modalText: {
      fontFamily: 'Outfit_500Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
    },
    slider: {
      width: 160,
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleText: {
      fontFamily: 'Outfit_500Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
      marginHorizontal: theme.spacing.small,
    },
    reciterCard: {
      backgroundColor: theme.colors.secondary,
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      borderRadius: theme.borderRadius.large,
      marginHorizontal: theme.spacing.small,
    },
    reciterCardActive: {
      backgroundColor: theme.colors.accent,
    },
    reciterCardText: {
      fontFamily: 'Outfit_500Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
    },
    reciterCardTextActive: {
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.secondary,
    },
  });

export default SettingsModal;
