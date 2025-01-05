import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface SavingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialSavings: string;
  initialInterest: string;
  onSave: (savings: string) => void;
}

const SavingsModal: React.FC<SavingsModalProps> = ({
  isVisible,
  onClose,
  initialSavings,
  initialInterest,
  onSave,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [savings, setSavings] = useState<string>(initialSavings);
  const [interest, setInterest] = useState<string>(initialInterest);
  const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);

  const handleSave = () => {
    const zakat = ((parseFloat(savings) - parseFloat(interest)) * 0.025).toFixed(2);
    onSave(zakat);
    onClose();
  };

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
            <Text style={styles.modalTitle}>Zakat for Savings</Text>
            <TouchableOpacity
              onPress={() => setIsTooltipVisible(!isTooltipVisible)}
              style={styles.tooltipIcon}
            >
              <FontAwesome6 name="circle-info" size={20} color={theme.colors.text.muted} />
            </TouchableOpacity>
          </View>

          {isTooltipVisible && (
            <Text style={styles.tooltipText}>
              Zakat is calculated as: (Lowest Amount in Year - Interest Earned) × 2.5%.
            </Text>
          )}

          <Text style={styles.modalText}>Enter Lowest Amount in Year:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="$0"
            placeholderTextColor={theme.colors.text.muted}
            value={savings}
            onChangeText={setSavings}
          />

          <Text style={styles.modalText}>Enter Interest Earned:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="$0"
            placeholderTextColor={theme.colors.text.muted}
            value={interest}
            onChangeText={setInterest}
          />

          <Text style={styles.modalText}>
            Total Zakat Payable: $
            {(parseFloat(savings) - parseFloat(interest) > 0
              ? ((parseFloat(savings) - parseFloat(interest)) * 0.025).toFixed(2)
              : '0')}
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
      padding: theme.spacing.small,
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

export default SavingsModal;
