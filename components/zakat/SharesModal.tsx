import React, { useContext, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';

interface SharesModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialSharesAmount: string;
  onSave: (sharesAmount: string) => void;
}

const SharesModal: React.FC<SharesModalProps> = ({
  isVisible,
  onClose,
  initialSharesAmount,
  onSave,
}) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const [sharesAmount, setSharesAmount] = useState<string>(initialSharesAmount);
  const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);

  const handleSave = () => {
    onSave(sharesAmount);
    onClose();
  };

  const styles = createStyles(activeTheme);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackground]}>
        <View style={styles.modalContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.modalTitle}>Zakat for Shares</Text>
            <TouchableOpacity
              onPress={() => setIsTooltipVisible(!isTooltipVisible)}
              style={styles.tooltipIcon}
            >
              <FontAwesome6 name="circle-info" size={20} color={activeTheme.colors.text.muted} />
            </TouchableOpacity>
          </View>

          {isTooltipVisible && (
            <Text style={styles.tooltipText}>
              Zakat is calculated as 2.5% of the total market value of your shares.
            </Text>
          )}

          <Text style={styles.modalText}>Enter the market value of your shares:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="$0"
            placeholderTextColor={activeTheme.colors.text.muted}
            value={sharesAmount}
            onChangeText={setSharesAmount}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save and Close</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.modalBackground,
    },
    modalContainer: {
      width: '90%',
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.text.muted,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.small,
    },
    modalTitle: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: theme.fontSizes.xLarge,
      color: theme.colors.text.primary,
    },
    tooltipIcon: {
      marginLeft: theme.spacing.small,
    },
    tooltipText: {
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.small,
      backgroundColor: theme.colors.secondary,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.small,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.small,
    },
    modalText: {
      marginBottom: theme.spacing.small,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
    },
    input: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.small,
      backgroundColor: theme.colors.secondary,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      textAlign: 'right',
      marginBottom: theme.spacing.medium,
    },
    saveButton: {
      marginTop: theme.spacing.small,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.text.success,
      borderRadius: theme.borderRadius.medium,
    },
    saveButtonText: {
      textAlign: 'center',
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
    },
    closeButton: {
      marginTop: theme.spacing.small,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.text.error,
      borderRadius: theme.borderRadius.medium,
    },
    closeButtonText: {
      textAlign: 'center',
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
    },
  });

export default SharesModal;
