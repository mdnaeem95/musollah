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

interface GoldModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialUsedGold: string;
  initialUnusedGold: string;
  onSave: (usedGold: string, unusedGold: string) => void;
  currentGoldPrice: number;
  formattedTimestamp: string;
}

const GoldModal: React.FC<GoldModalProps> = ({
  isVisible,
  onClose,
  initialUsedGold,
  initialUnusedGold,
  onSave,
  currentGoldPrice,
  formattedTimestamp,
}) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const [usedGold, setUsedGold] = useState<string>(initialUsedGold);
  const [unusedGold, setUnusedGold] = useState<string>(initialUnusedGold);
  const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);

  const handleSave = () => {
    onSave(usedGold, unusedGold);
    onClose();
  };

  const calculateZakat = () => {
    const used = parseFloat(usedGold) || 0;
    const unused = parseFloat(unusedGold) || 0;
    return ((currentGoldPrice * used * 0.0025) + (currentGoldPrice * unused * 0.0025)).toFixed(2);
  };

  const styles = createStyles(activeTheme);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.modalTitle}>Zakat for Gold</Text>
            <TouchableOpacity
              onPress={() => setIsTooltipVisible(!isTooltipVisible)}
              style={styles.tooltipIcon}
            >
              <FontAwesome6 name="circle-info" size={20} color={activeTheme.colors.text.muted} />
            </TouchableOpacity>
          </View>

          {isTooltipVisible && (
            <Text style={styles.tooltipText}>
              Zakat is calculated as: (Current Rate of Gold × Weight of Gold Owned) × 2.5%.
            </Text>
          )}

          <Text style={styles.modalText}>
            Enter Total Gold for Use (in grams):
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0g"
            placeholderTextColor={activeTheme.colors.text.muted}
            value={usedGold}
            onChangeText={setUsedGold}
          />

          <Text style={styles.modalText}>
            Enter Total Gold Not for Use (in grams):
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0g"
            placeholderTextColor={activeTheme.colors.text.muted}
            value={unusedGold}
            onChangeText={setUnusedGold}
          />

          <Text style={styles.modalText}>
            Total Zakat Payable: ${calculateZakat()}
          </Text>
          <Text style={styles.footnote}>
            **Gold price as of {formattedTimestamp}: ${currentGoldPrice} per gram
          </Text>

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
      shadowColor: '#000',
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
      marginBottom: theme.spacing.small,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      padding: theme.spacing.small,
      borderRadius: theme.borderRadius.small,
      backgroundColor: theme.colors.secondary,
      color: theme.colors.text.primary,
    },
    modalText: {
      marginBottom: theme.spacing.small,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
    },
    footnote: {
      fontSize: theme.fontSizes.small,
      marginTop: theme.spacing.small,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    input: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.small,
      marginBottom: theme.spacing.medium,
      textAlign: 'right',
      borderColor: theme.colors.secondary,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.secondary,
    },
    saveButton: {
      marginTop: theme.spacing.medium,
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
      marginTop: theme.spacing.medium,
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

export default GoldModal;
