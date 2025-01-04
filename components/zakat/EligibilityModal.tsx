import React, { useContext, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';

interface EligibilityModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialEligibility: {
    savings: string;
    goldNotForUse: string;
    goldForUse: string;
    insurance: string;
    shares: string;
  };
  initialHaulStates: {
    savingsHaul: boolean;
    goldNotWearingHaul: boolean;
    goldWearingHaul: boolean;
  };
  onCalculate: (eligibility: {
    savings: boolean;
    gold: boolean;
    insurance: boolean;
    shares: boolean;
  }) => void;
  nisabAmount: number;
  nisabAmountNotWearing: number;
  urufAmountWearing: number;
}

const EligibilityModal: React.FC<EligibilityModalProps> = ({
  isVisible,
  onClose,
  initialEligibility,
  initialHaulStates,
  onCalculate,
  nisabAmount,
  nisabAmountNotWearing,
  urufAmountWearing,
}) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const [eligibilitySavings, setEligibilitySavings] = useState(initialEligibility.savings);
  const [eligibilityGoldNotForUse, setEligibilityGoldNotForUse] = useState(initialEligibility.goldNotForUse);
  const [eligibilityGoldForUse, setEligibilityGoldForUse] = useState(initialEligibility.goldForUse);
  const [eligibilityInsurance, setEligibilityInsurance] = useState(initialEligibility.insurance);
  const [eligibilityShares, setEligibilityShares] = useState(initialEligibility.shares);

  const [savingsHaul, setSavingsHaul] = useState(initialHaulStates.savingsHaul);
  const [goldNotWearingHaul, setGoldNotWearingHaul] = useState(initialHaulStates.goldNotWearingHaul);
  const [goldWearingHaul, setGoldWearingHaul] = useState(initialHaulStates.goldWearingHaul);

  const handleCalculate = () => {
    const savingsEligible = parseFloat(eligibilitySavings) >= nisabAmount && savingsHaul;
    const goldNotWearingEligible =
      parseFloat(eligibilityGoldNotForUse) >= nisabAmountNotWearing && goldNotWearingHaul;
    const goldWearingEligible = parseFloat(eligibilityGoldForUse) >= urufAmountWearing && goldWearingHaul;
    const goldEligible = goldNotWearingEligible || goldWearingEligible;
    const insuranceEligible = parseFloat(eligibilityInsurance) >= nisabAmount;
    const sharesEligible = parseFloat(eligibilityShares) >= nisabAmount;

    onCalculate({
      savings: savingsEligible,
      gold: goldEligible,
      insurance: insuranceEligible,
      shares: sharesEligible,
    });
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
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Zakat Eligibility Assessment</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {[
              {
                title: 'Savings ($)',
                value: eligibilitySavings,
                onChange: setEligibilitySavings,
                haulValue: savingsHaul,
                setHaulValue: setSavingsHaul,
              },
              {
                title: 'Gold (g) - Not for Use',
                value: eligibilityGoldNotForUse,
                onChange: setEligibilityGoldNotForUse,
                haulValue: goldNotWearingHaul,
                setHaulValue: setGoldNotWearingHaul,
              },
              {
                title: 'Gold (g) - For Use',
                value: eligibilityGoldForUse,
                onChange: setEligibilityGoldForUse,
                haulValue: goldWearingHaul,
                setHaulValue: setGoldWearingHaul,
              },
              {
                title: 'Insurance ($)',
                value: eligibilityInsurance,
                onChange: setEligibilityInsurance,
              },
              {
                title: 'Shares ($)',
                value: eligibilityShares,
                onChange: setEligibilityShares,
              },
            ].map((item, index) => (
              <View key={index}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder={item.title}
                  placeholderTextColor={activeTheme.colors.text.muted}
                  value={item.value}
                  onChangeText={item.onChange}
                />
                {item.haulValue !== undefined && (
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Haul Completed?</Text>
                    <Switch
                      value={item.haulValue}
                      onValueChange={item.setHaulValue}
                      trackColor={{
                        false: activeTheme.colors.secondary,
                        true: activeTheme.colors.text.success,
                      }}
                      thumbColor={item.haulValue ? activeTheme.colors.text.primary : activeTheme.colors.text.muted}
                    />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Text style={styles.calculateButtonText}>Calculate Eligibility</Text>
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
    },
    modalTitle: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: theme.fontSizes.xLarge,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.medium,
    },
    sectionTitle: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.small,
      marginBottom: theme.spacing.small,
    },
    input: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.small,
      padding: theme.spacing.small,
      marginBottom: theme.spacing.medium,
      borderColor: theme.colors.secondary,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.secondary,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    label: {
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
    calculateButton: {
      marginTop: theme.spacing.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.text.success,
      borderRadius: theme.borderRadius.medium,
    },
    calculateButtonText: {
      fontFamily: 'Outfit_400Regular',
      textAlign: 'center',
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
      fontFamily: 'Outfit_400Regular',
      textAlign: 'center',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
    },
  });

export default EligibilityModal;
