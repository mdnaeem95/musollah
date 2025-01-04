import React, { useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';

interface GuideModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ isVisible, onClose }) => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

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
          <Text style={styles.modalTitle}>Guide</Text>
          <Text style={styles.modalText}>
            1) Click on "Check Eligibility" to see your eligibility for the 4 categories.
          </Text>
          <Text style={styles.modalText}>
            2) If any category is eligible, click on the category and input the appropriate values.
          </Text>
          <Text style={styles.modalText}>
            3) The total zakat required to pay will be displayed at the bottom of the table.
          </Text>
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
    modalTitle: {
      marginBottom: theme.spacing.small,
      fontFamily: 'Outfit_600SemiBold',
      fontSize: theme.fontSizes.xLarge,
      color: theme.colors.text.primary,
    },
    modalText: {
      marginBottom: theme.spacing.small,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
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

export default GuideModal;
