import React from 'react';
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
  onPress: (event: GestureResponderEvent) => void;
}

interface PrayerActionsModalProps {
  visible: boolean;
  onClose: () => void;
  actions: PrayerAction[];
}

const PrayerActionsModal = ({ visible, onClose, actions }: PrayerActionsModalProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Estimate height dynamically based on number of actions
  const numRows = Math.ceil(actions.length / 3);
  const estimatedHeight = 100 + numRows * 100; // base padding + row height estimate

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      backdropOpacity={0.3}
      style={styles.modal}
      propagateSwipe
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
            <TouchableOpacity onPress={item.onPress} style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary }]}>
                <FontAwesome6 name={item.icon} size={20} color={theme.colors.text.primary} />
              </View>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    modal: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    container: {
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    handle: {
      width: 40,
      height: 5,
      backgroundColor: theme.colors.text.muted,
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
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    label: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      textAlign: 'center',
    },
  });

export default PrayerActionsModal;