import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import Modal from 'react-native-modal';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const screenHeight = Dimensions.get('window').height;

interface PrayerAction {
  icon: any;
  label: string;
  onPress: () => void;
}

interface PrayerActionsModalProps {
  visible: boolean;
  onClose: () => void;
  actions: PrayerAction[];
}

const PrayerActionsModal = ({ visible, onClose, actions }: PrayerActionsModalProps) => {
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme, isDarkMode);
  
  // ✅ Track pending action to execute after modal hides
  const pendingAction = useRef<(() => void) | null>(null);

  const numRows = Math.ceil(actions.length / 3);
  const estimatedHeight = 100 + numRows * 100;

  // ✅ Handle action press - store action and close modal
  const handleActionPress = useCallback((action: PrayerAction) => {
    return () => {
      // Store the action to execute after modal animation completes
      pendingAction.current = action.onPress;
      onClose();
    };
  }, [onClose]);

  // ✅ Execute pending action after modal is fully hidden
  const handleModalHide = useCallback(() => {
    if (pendingAction.current) {
      const action = pendingAction.current;
      pendingAction.current = null;
      // Small delay to ensure state is settled
      setTimeout(action, 50);
    }
  }, []);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      onModalHide={handleModalHide}  // ✅ Execute action after animation
      swipeDirection="down"
      backdropOpacity={0.3}
      style={styles.modal}
      useNativeDriver
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
      animationOutTiming={250}
    >
      <View style={[styles.container, { height: Math.min(estimatedHeight, screenHeight * 0.5) }]}>
        <View style={styles.handle} />
        <FlatList
          data={actions}
          keyExtractor={(item) => item.label}
          numColumns={3}
          contentContainerStyle={styles.grid}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={handleActionPress(item)} 
              style={styles.card}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <FontAwesome6 name={item.icon} size={20} color={theme.colors.accent} />
              </View>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    modal: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    container: {
      backgroundColor: isDarkMode ? 'rgba(10,14,30,0.97)' : 'rgba(248,250,255,0.97)',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.12)',
      padding: 20,
    },
    handle: {
      width: 40,
      height: 5,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
      borderRadius: 3,
      alignSelf: 'center',
      marginBottom: 16,
    },
    grid: {
      justifyContent: 'space-between',
      gap: 20,
    },
    card: {
      flex: 1,
      margin: 8,
      alignItems: 'center',
    },
    iconContainer: {
      width: 58,
      height: 58,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      backgroundColor: theme.colors.accent + '18',
      borderWidth: 1,
      borderColor: theme.colors.accent + '30',
    },
    label: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      textAlign: 'center',
    },
  });

export default PrayerActionsModal;