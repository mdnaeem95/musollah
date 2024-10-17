import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import PrayerHeader from '../../../../components/PrayerHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Switch } from '@rneui/base';
import { getGoldPrice } from '../../../../api/gold/index'
import { format } from 'date-fns';

const nisabAmountNotWearing = 86;  // 86 grams for gold not meant for wearing
const urufAmountWearing = 860;  // 860 grams for gold meant for wearing

const ZakatHarta = () => {
    const [savings, setSavings] = useState<string>(''); // savings state for the main page
    const [gold, setGold] = useState<string>(''); // gold state for the main page
    const [insurance, setInsurance] = useState<string>(''); // insurance state for the main page
    const [shares, setShares] = useState<string>(''); // shares state for the main page
    const [totalZakat, setTotalZakat] = useState<number>(0); // total zakat for the main page
    const [nisabAmount, setNisabAmount] = useState(9378);

    const [currentGoldPrice, setCurrentGoldPrice] = useState<number>(0)
    const [goldPriceTimeStamp, setGoldPriceTimeStamp] = useState('');

    // states for the eligibility modal
    const [isEligibilityModalVisible, setIsEligibilityModalVisible] = useState(false);
    const [eligibilitySavingsAmount, setEligibilitySavingsAmount] = useState<string>('');
    const [eligibilityGoldWearingAmount, setEligibilityGoldWearingAmount] = useState<string>('');
    const [eligibilityGoldNotWearingAmount, setEligibilityGoldNotWearingAmount] = useState<string>('');
    const [eligibilityInsuranceAmount, setEligibilityInsuranceAmount] = useState<string>('');
    const [eligibilitySharesAmount, setEligibilitySharesAmount] = useState<string>('');
    const [savingsHaul, setSavingsHaul] = useState<boolean>(false);
    const [goldWearingHaul, setGoldWearingHaul] = useState(false);
    const [goldNotWearingHaul, setGoldNotWearingHaul] = useState(false);

    // Eligibility states for each category
    const [eligibility, setEligibility] = useState({
        savings: false,
        gold: false,
        insurance: false,
        shares: false,
    });

    // States to manage savings modal
    const [isSavingsModalVisible, setIsSavingsModalVisible] = useState<boolean>(false); // for savings modal
    const [isSavingsTooltipVisible, setIsSavingsTooltipVisible] = useState(false);
    const [savingsModalSavings, setSavingsModalSavings] = useState('0');
    const [savingsModalInterest, setSavingsModalInterest] = useState('0')

    // States to manage gold modal
    const [isGoldModalVisible, setIsGoldModalVisible] = useState(false);
    const [isGoldTooltipVisible, setIsGoldTooltipVisible] = useState(false);
    const [usedGoldModalValue, setUsedGoldModalValue] = useState('');
    const [unusedGoldModalValue, setUnusedGoldModalValue] = useState('');

    // States to manage insurance modal
    const [isInsuranceModalVisible, setIsInsuranceModalVisible] = useState<boolean>(false); // for savings modal
    const [isInsuranceTooltipVisible, setIsInsuranceTooltipVisible] = useState(false);
    const [insuranceModalAmount, setInsuranceModalAmount] = useState('0');

    // States to manage insurance modal
    const [isSharesModalVisible, setIsSharesModalVisible] = useState<boolean>(false); // for savings modal
    const [isSharesTooltipVisible, setIsSharesTooltipVisible] = useState(false);
    const [sharesModalAmount, setSharesModalAmount] = useState('0');

    const parseDate = (timestamp: any) => {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'dd MMM yyyy, hh:mm a');
    };

    const formattedTimestamp = parseDate(goldPriceTimeStamp);

    useEffect(() => {
        const fetchGoldPrice = async () => {
          try {
            const { pricePerGram, timestamp } = await getGoldPrice();
            console.log(`Gold Price: ${pricePerGram}, Timestamp: ${timestamp}`);
            setCurrentGoldPrice(pricePerGram);
            setGoldPriceTimeStamp(timestamp);
          } catch (error) {
            console.error('Error fetching gold price:', error);
          }
        };
      
        fetchGoldPrice();
      }, []);

    // Helper to render check/cross icon based on eligibility
    const renderEligibilityIcon = (isEligible: boolean) => {
        return isEligible ? (
        <FontAwesome6 name="check" size={24} color="green" />
        ) : (
        <FontAwesome6 name="xmark" size={24} color="red" />
        );
    };

    const openEligibilityModal = () => {
        setIsEligibilityModalVisible(true);
    };

    // Function to assess eligibility for all categories
    const assessEligibility = () => {
        // Check eligibility for Savings
        const savingsAmount = parseFloat(eligibilitySavingsAmount) || 0;
        if (savingsAmount >= nisabAmount && savingsHaul) {
            eligibility.savings = true;
        }

        // Check eligibility for Gold (either type)
        const goldNotWearingAmount = parseFloat(eligibilityGoldNotWearingAmount) || 0;
        const goldWearingAmount = parseFloat(eligibilityGoldWearingAmount) || 0;

        const isEligibleForGoldNotWearing = (goldNotWearingAmount >= nisabAmountNotWearing) && goldNotWearingHaul;
        const isEligibleForGoldWearing = (goldWearingAmount >= urufAmountWearing) && goldWearingHaul;
        
        const goldEligible = isEligibleForGoldNotWearing || isEligibleForGoldWearing;

        eligibility.gold = goldEligible

        // Check eligibility for Insurance
        const insuranceAmount = parseFloat(eligibilityInsuranceAmount) || 0;
        if (insuranceAmount >= nisabAmount) {
            eligibility.insurance = true;
        }

        // Check eligibility for Shares
        const sharesAmount = parseFloat(eligibilitySharesAmount) || 0;
        if (sharesAmount >= nisabAmount) {
            eligibility.shares = true;
        }
        setIsEligibilityModalVisible(false); // Close modal
    };

    // Recalculate the zakat whenever one of the input values changes
    useEffect(() => {
        calculateZakat();
    }, [savings, gold, insurance, shares]);

    // Function to calculate Zakat payable (2.5% of total assets)
    const calculateZakat = () => {
        const totalAssets = parseFloat(savings) + parseFloat(gold) + parseFloat(insurance) + parseFloat(shares);
        setTotalZakat(totalAssets);
    };

  return (
    <SafeAreaView style={styles.container}>
      <PrayerHeader title="Zakat Harta" backgroundColor='#4D6561' />

    <ScrollView>    
        <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.tableHeader, styles.columnLabel]}>Type of Zakat</Text>
                <Text style={[styles.tableHeader, styles.columnAmount]}>Amount</Text>
                <Text style={[styles.tableHeader, styles.columnEligibility]}>Eligibility</Text>
            </View>

            {/* Zakat Rows */}
            <View style={[styles.tableRow, !eligibility.savings ? styles.disabledRow : {}]}>
                <TouchableOpacity 
                    style={[styles.zakatType, styles.columnLabel]} 
                    onPress={() => setIsSavingsModalVisible(true)}
                    disabled={!eligibility.savings}
                >
                    <FontAwesome6 name="money-bill" size={24} color="#4D6561" />
                    <Text style={styles.zakatLabel}>Savings</Text>
                </TouchableOpacity>
                <TextInput
                    style={[styles.input, styles.columnAmount]}
                    placeholder='$0'
                    value={savings}
                    onChangeText={setSavings}
                    keyboardType="numeric"
                    editable={eligibility.savings}
                />
                <View style={styles.columnEligibility}>
                    {renderEligibilityIcon(eligibility.savings)}
                </View>
            </View>

            <View style={[styles.tableRow, !eligibility.gold ? styles.disabledRow : {}]}>
                <TouchableOpacity 
                    style={[styles.zakatType, styles.columnLabel]}
                    disabled={!eligibility.gold}
                    onPress={() => setIsGoldModalVisible(true)}
                >
                    <FontAwesome6 name="ring" size={24} color="#4D6561" />
                    <Text style={styles.zakatLabel}>Gold</Text>
                </TouchableOpacity>
                <TextInput
                    style={[styles.input, styles.columnAmount]}
                    value={gold}
                    placeholder='$0'
                    onChangeText={setGold}
                    keyboardType="numeric"
                    editable={eligibility.gold}
                />
                <View style={styles.columnEligibility}>
                {renderEligibilityIcon(eligibility.gold)}
                </View>
            </View>

            <View style={[styles.tableRow, !eligibility.insurance ? styles.disabledRow : {}]}>
                <TouchableOpacity 
                    style={[styles.zakatType, styles.columnLabel]}
                    disabled={!eligibility.insurance}
                    onPress={() => setIsInsuranceModalVisible(true)}
                >
                    <FontAwesome6 name="shield" size={24} color="#4D6561" />
                    <Text style={styles.zakatLabel}>Insurance</Text>
                </TouchableOpacity>
                <TextInput
                    style={[styles.input, styles.columnAmount]}
                    value={insurance}
                    placeholder='$0'
                    onChangeText={setInsurance}
                    keyboardType="numeric"
                    editable={eligibility.insurance}
                />
                <View style={styles.columnEligibility}>
                {renderEligibilityIcon(eligibility.insurance)}
                </View>
            </View>

            <View style={[styles.tableRow, !eligibility.shares ? styles.disabledRow : {}]}>
                <TouchableOpacity 
                    style={[styles.zakatType, styles.columnLabel]}
                    disabled={!eligibility.shares}
                    onPress={() => setIsSharesModalVisible(true)}
                >
                    <FontAwesome6 name="chart-line" size={24} color="#4D6561" />
                    <Text style={styles.zakatLabel}>Shares</Text>
                </TouchableOpacity>
                <TextInput
                    style={[styles.input, styles.columnAmount]}
                    value={shares}
                    placeholder='$0'
                    onChangeText={setShares}
                    keyboardType="numeric"
                    editable={eligibility.shares}
                />
                <View style={styles.columnEligibility}>
                {renderEligibilityIcon(eligibility.shares)}
                </View>
            </View>

            <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={styles.totalText}>Total Zakat Payable:</Text>
                <Text style={styles.totalAmount}>
                    ${totalZakat.toFixed(2)}
                </Text>
            </View>
        </View>
    
        {/* Button to launch eligibility modal */}
        <TouchableOpacity
            style={styles.eligibilityButton}
            onPress={openEligibilityModal}>
            <Text style={styles.eligibilityButtonText}>Check Eligibility</Text>
        </TouchableOpacity>

        {/* Eligibility Modal */}
        <Modal
            visible={isEligibilityModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsEligibilityModalVisible(false)}
        >
            <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Zakat Eligibility Assessment</Text>

                {/* Savings Section */}
                <Text style={styles.modalSubTitle}>Savings ($)</Text>
                    <TextInput
                        style={[styles.input, { width: 100 }]}
                        placeholder="Savings Amount"
                        value={eligibilitySavingsAmount}
                        onChangeText={setEligibilitySavingsAmount}
                        keyboardType="numeric"
                    />
                    <View style={styles.switchRow}>
                    <Text>Haul Completed?</Text>
                    <Switch
                        value={savingsHaul}
                        onValueChange={setSavingsHaul}
                    />
                </View>

                {/* Gold (Not Meant for Wearing) Section */}
                <Text style={styles.modalSubTitle}>Gold (g) (Not for Use)</Text>
                <TextInput
                    style={[styles.input, { width: 100 }]}
                    placeholder="Gold Weight (g)"
                    value={eligibilityGoldNotWearingAmount}
                    onChangeText={setEligibilityGoldNotWearingAmount}
                    keyboardType="numeric"
                />
                <View style={styles.switchRow}>
                    <Text>Haul Completed?</Text>
                    <Switch
                    value={goldNotWearingHaul}
                    onValueChange={setGoldNotWearingHaul}
                    />
                </View>

                {/* Gold (Meant for Wearing) Section */}
                <Text style={styles.modalSubTitle}>Gold (g) (For Use)</Text>
                <TextInput
                    style={[styles.input, { width: 100 }]}
                    placeholder="Gold Weight (g)"
                    value={eligibilityGoldWearingAmount}
                    onChangeText={setEligibilityGoldWearingAmount}
                    keyboardType="numeric"
                />
                <View style={styles.switchRow}>
                    <Text>Haul Completed?</Text>
                    <Switch
                    value={goldWearingHaul}
                    onValueChange={setGoldWearingHaul}
                    />
                </View>

                {/* Insurance Section */}
                <Text style={styles.modalSubTitle}>Insurance (Surrender/Premium for Contventional/Takaful)</Text>
                <TextInput
                    style={[styles.input, { width: 100 }]}
                    placeholder="Insurance Value"
                    value={eligibilityInsuranceAmount}
                    onChangeText={setEligibilityInsuranceAmount}
                    keyboardType="numeric"
                />

                {/* Shares Section */}
                <Text style={styles.modalSubTitle}>Shares (Market Value)</Text>
                <TextInput
                    style={[styles.input, { width: 100 }]}
                    placeholder="Shares Value"
                    value={eligibilitySharesAmount}
                    onChangeText={setEligibilitySharesAmount}
                    keyboardType="numeric"
                />

                {/* Button to assess eligibility */}
                <TouchableOpacity style={styles.assessButton} onPress={assessEligibility}>
                <Text style={styles.assessButtonText}>Check Eligibility</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsEligibilityModalVisible(false)}
                >
                <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
            </View>
        </Modal>

        {/* Modal Component for Zakat Calculation for Savings */}
        <Modal
        visible={isSavingsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSavingsModalVisible(false)}
        >
        <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { gap: 10 }]}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Text style={styles.modalTitle}>Zakat for Savings</Text>
                <TouchableOpacity onPress={() => setIsSavingsTooltipVisible(!isSavingsTooltipVisible)} style={{ top: -5 }}>
                    <FontAwesome6  name="circle-info" size={20} color="#ccc"  />
                </TouchableOpacity>
            </View>

            {/* Tooltip for Zakat Calculation */}
            {isSavingsTooltipVisible && (
                <Text style={styles.tooltipText}>
                    Zakat Payable is calculated as: (Lowest Amount in Year - Interest Earned) × 2.5%
                </Text>
            )}
            {/* Input fields for calculating Zakat */}
            <Text style={styles.modalNormalText}>Enter Lowest Amount in Year</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="$0"
                value={savingsModalSavings}
                onChangeText={setSavingsModalSavings}
            />
            <Text style={styles.modalNormalText}>Interest Earned</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="$0"
                value={savingsModalInterest}
                onChangeText={setSavingsModalInterest}
            />

            {/* Display Zakat Payable */}
            <Text style={styles.modalNormalText}>Total Zakat Payable for Savings: 
                ${((parseFloat(savingsModalSavings) - parseFloat(savingsModalInterest)) * (2.5 / 100)).toFixed(2)}
            </Text>

            {/* Close Modal Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                    setSavings(((parseFloat(savingsModalSavings) - parseFloat(savingsModalInterest)) * (2.5 / 100)).toFixed(2))
                    setIsSavingsModalVisible(false)
                }}
            >
                <Text style={styles.closeButtonText}>Save and Close</Text>
            </TouchableOpacity>
            </View>
        </View>
        </Modal>

        {/* Modal Component for Zakat Calculation for Gold */}
        <Modal
        visible={isGoldModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsGoldModalVisible(false)}
        >
        <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { gap: 10 }]}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Text style={styles.modalTitle}>Zakat for Gold</Text>
                <TouchableOpacity onPress={() => setIsGoldTooltipVisible(!isGoldTooltipVisible)} style={{ top: -5 }}>
                <FontAwesome6 name="circle-info" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Tooltip for Zakat Calculation */}
            {isGoldTooltipVisible && (
                <Text style={styles.tooltipText}>
                Zakat Payable is calculated as: (Current Rate of Gold x Weight of Gold Owned) × 2.5%
                </Text>
            )}

            {/* Input fields for calculating Zakat */}
            <Text style={styles.modalNormalText}>Enter Total Gold for Use (in g)</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0g"
                value={usedGoldModalValue}
                onChangeText={setUsedGoldModalValue}
            />

            <Text style={styles.modalNormalText}>Enter Total Gold Not for Use (in g)</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0g"
                value={unusedGoldModalValue}
                onChangeText={setUnusedGoldModalValue}
            />

            {/* Display Zakat Payable */}
            <Text style={styles.modalNormalText}>
                Total Zakat Payable for Gold: 
                ${((currentGoldPrice * parseFloat(usedGoldModalValue) * 0.0025) + (currentGoldPrice * parseFloat(unusedGoldModalValue) * 0.0025)).toFixed(2)}
            </Text>

            {/* Footnote for price and timestamp */}
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12 }}>
                **Gold price as of {formattedTimestamp}: ${currentGoldPrice} per gram
            </Text>

            {/* Close Modal Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                setGold(((currentGoldPrice * parseFloat(usedGoldModalValue) * 0.0025) + (currentGoldPrice * parseFloat(unusedGoldModalValue) * 0.0025)).toFixed(2));
                setIsGoldModalVisible(false);
                }}
            >
                <Text style={styles.closeButtonText}>Save and Close</Text>
            </TouchableOpacity>
            </View>
        </View>
        </Modal>

        {/* Modal Component for Zakat Calculation for Insurance */}
        <Modal
        visible={isInsuranceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsInsuranceModalVisible(false)}
        >
        <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { gap: 10 }]}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Text style={styles.modalTitle}>Zakat for Insurance</Text>
                <TouchableOpacity onPress={() => setIsInsuranceTooltipVisible(!isInsuranceTooltipVisible)} style={{ top: -5 }}>
                <FontAwesome6 name="circle-info" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Tooltip for Zakat Calculation */}
            {isInsuranceTooltipVisible && (
                <Text style={styles.tooltipText}>
                Zakat Payable is calculated as: (Value of Surrender/Premium for Conventional/Takaful Endowment Plan × 2.5%)
                </Text>
            )}

            {/* Input fields for calculating Zakat */}
            <Text style={styles.modalNormalText}>Enter Insurance Value</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="$0"
                value={insuranceModalAmount}
                onChangeText={setInsuranceModalAmount}
            />

            {/* Display Zakat Payable */}
            <Text style={styles.modalNormalText}>Total Zakat Payable for Insurance: 
                ${(parseFloat(insuranceModalAmount) * (2.5 / 100)).toFixed(2)}
            </Text>

            {/* Close Modal Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                setInsurance((parseFloat(insuranceModalAmount) * (2.5 / 100)).toFixed(2))
                setIsInsuranceModalVisible(false)
                }}
            >
                <Text style={styles.closeButtonText}>Save and Close</Text>
            </TouchableOpacity>
            </View>
        </View>
        </Modal>

        {/* Modal Component for Zakat Calculation for Shares */}
        <Modal
        visible={isSharesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSharesModalVisible(false)}
        >
        <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { gap: 10 }]}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Text style={styles.modalTitle}>Zakat for Shares</Text>
                <TouchableOpacity onPress={() => setIsSharesTooltipVisible(!isSharesTooltipVisible)} style={{ top: -5 }}>
                <FontAwesome6 name="circle-info" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Tooltip for Zakat Calculation */}
            {isSharesTooltipVisible && (
                <Text style={styles.tooltipText}>
                Zakat Payable is calculated as: (Market Value of Shares × 2.5%)
                </Text>
            )}

            {/* Input fields for calculating Zakat */}
            <Text style={styles.modalNormalText}>Enter Market Value of Shares</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="$0"
                value={sharesModalAmount}
                onChangeText={setSharesModalAmount}
            />

            {/* Display Zakat Payable */}
            <Text style={styles.modalNormalText}>Total Zakat Payable for Shares: 
                ${(parseFloat(sharesModalAmount) * (2.5 / 100)).toFixed(2)}
            </Text>

            {/* Close Modal Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                setShares((parseFloat(sharesModalAmount) * (2.5 / 100)).toFixed(2))
                setIsSharesModalVisible(false)
                }}
            >
                <Text style={styles.closeButtonText}>Save and Close</Text>
            </TouchableOpacity>
            </View>
        </View>
        </Modal>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#4D6561',
  },
  tableContainer: {
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  disabledRow: {
    backgroundColor: '#CCC',  // Greyed out row background
    width: '100%',
    borderRadius: 10
  },
  tableHeaderRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#D9D9D9',
  },
  columnLabel: {
    flex: 2, // Flex value for label column
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnAmount: {
    flex: 1, // Flex value for amount input column
    justifyContent: 'center',
  },
  columnEligibility: {
    flex: 1, // Flex value for eligibility icon column
    justifyContent: 'center',
    alignItems: 'center',
  },
  zakatType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  zakatLabel: {
    fontFamily: 'Outfit_400Regular',
    marginLeft: 10,
    fontSize: 14,
    color: '#4D6561',
    width: '45%'
  },
  tableHeader: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#4D6561',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: 10,
    width: 60,
    textAlign: 'right',
    borderRadius: 5,
    color: '#4D6561',
    marginRight: 20
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#D9D9D9',
  },
  totalText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#A83A3A',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#A83A3A',
  },
  eligibilityButton: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  eligibilityButtonText: {
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#4D6561',
    marginBottom: 10,
  },
  modalSubTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    marginVertical: 10,
    color: '#4D6561',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  assessButton: {
    marginTop: 20,
    backgroundColor: '#4D6561',
    padding: 10,
    borderRadius: 8,
  },
  assessButtonText: {
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#A83A3A',
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  modalNormalText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16
  },
  tooltipText: {
    backgroundColor: '#FFF1E6',
    padding: 10,
    borderRadius: 8,
    fontFamily: 'Outfit_400Regular',
    color: '#4D6561',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ZakatHarta;
