import React, { useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';

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
    savings: boolean;
    gold: boolean;
    insurance: boolean;
    shares: boolean;
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
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const styles = createStyles(activeTheme);

  return (
    <View style={styles.tableContainer}>
      {/* Table Header */}
      <View style={styles.tableHeaderRow}>
        <Text style={styles.tableHeader}>Type of Zakat</Text>
        <Text style={styles.tableHeader}>Amount</Text>
        <Text style={styles.tableHeader}>Eligibility</Text>
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
            <FontAwesome6 name={icon} size={24} color={eligibility ? activeTheme.colors.text.primary : activeTheme.colors.text.muted} />
            <Text style={[styles.zakatLabel, { color: eligibility ? activeTheme.colors.text.primary : activeTheme.colors.text.muted }]}>
              {type}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="$0"
            placeholderTextColor={activeTheme.colors.text.muted}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            editable={eligibility}
          />
          <View style={styles.columnEligibility}>
            {renderEligibilityIcon(eligibility)}
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
    columnEligibility: {
      flex: 1,
      alignItems: 'center',
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
