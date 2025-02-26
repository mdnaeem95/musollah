import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface ZakatTableProps {
  savings: string;
  setSavings: (value: string) => void;
  gold: string;
  setGold: (value: string) => void;
  insurance: string;
  setInsurance: (value: string) => void;
  shares: string;
  setShares: (value: string) => void;
  eligibility: {
    savings: { eligible: boolean; amount: string };
    gold: { eligible: boolean; notForUse: string; forUse: string };
    insurance: { eligible: boolean; amount: string };
    shares: { eligible: boolean; amount: string };
  };
  totalZakat: number;
  renderEligibilityIcon: (isEligible: boolean) => React.ReactNode;
  openModalHandlers: {
    savings: () => void;
    gold: () => void;
    insurance: () => void;
    shares: () => void;
  };
}

const ZakatTable = ({
  savings,
  setSavings,
  gold,
  setGold,
  insurance,
  setInsurance,
  shares,
  setShares,
  eligibility,
  totalZakat,
  renderEligibilityIcon,
  openModalHandlers,
}: ZakatTableProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.tableContainer}>
      {/* Table Header */}
      <View style={styles.tableHeaderRow}>
        <Text style={styles.columnType}>Type of Zakat</Text>
        <Text style={styles.columnAmount}>Amount</Text>
        <Text style={styles.columnEligibility}>Eligibility</Text>
      </View>

      {/* Zakat Rows */}
      {[
        {
          type: 'Savings',
          icon: 'money-bill',
          value: savings,
          setValue: setSavings,
          eligibility: eligibility.savings,
          openModal: openModalHandlers.savings,
        },
        {
          type: 'Gold',
          icon: 'ring',
          value: gold,
          setValue: setGold,
          eligibility: eligibility.gold,
          openModal: openModalHandlers.gold,
        },
        {
          type: 'Insurance',
          icon: 'shield',
          value: insurance,
          setValue: setInsurance,
          eligibility: eligibility.insurance,
          openModal: openModalHandlers.insurance,
        },
        {
          type: 'Shares',
          icon: 'chart-line',
          value: shares,
          setValue: setShares,
          eligibility: eligibility.shares,
          openModal: openModalHandlers.shares,
        },
      ].map(({ type, icon, value, setValue, eligibility, openModal }) => (
        <View key={type} style={[styles.tableRow, !eligibility && styles.disabledRow]}>
          <TouchableOpacity
            style={styles.zakatType}
            disabled={!eligibility}
            onPress={openModal}
          >
            <FontAwesome6 name={icon} size={24} color={eligibility ? theme.colors.text.primary : theme.colors.text.muted} />
            <Text style={[styles.zakatLabel, { color: eligibility ? theme.colors.text.primary : theme.colors.text.muted }]}>
              {type}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="$0"
            placeholderTextColor={theme.colors.text.muted}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            editable={eligibility.eligible}
          />
          <View style={styles.columnEligibility}>
            {renderEligibilityIcon(eligibility.eligible)}
          </View>
        </View>
      ))}

      {/* Total Zakat Row */}
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Total Zakat Payable:</Text>
        <Text style={styles.totalAmount}>${totalZakat > 0 ? totalZakat.toFixed(2) : 0}</Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    tableContainer: {
      borderWidth: 1,
      borderColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.primary,
      marginBottom: theme.spacing.large,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: theme.spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.accent,
    },
    columnType: {
      width: '40%',  // Matches header
      paddingLeft: theme.spacing.small,
    },
    columnAmount: {
      width: '30%',  // Matches header
      alignItems: 'center',
      marginLeft: 10
    },
    columnEligibility: {
      width: '30%',  // Matches header
      alignItems: 'center',
      marginLeft: 20
    },
    tableHeader: {
      flex: 1,
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.small,
    },
    disabledRow: {
      backgroundColor: theme.colors.secondary,
    },
    zakatType: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    zakatLabel: {
      marginLeft: theme.spacing.small,
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.text.muted,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.small,
      padding: theme.spacing.small,
      color: theme.colors.text.primary,
      textAlign: 'right',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.primary,
    },
    totalText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
    },
    totalAmount: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
    },
});

export default ZakatTable;
