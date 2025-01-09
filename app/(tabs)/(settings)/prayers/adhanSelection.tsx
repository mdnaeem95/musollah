import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { FlatList } from 'react-native';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { useTheme } from '../../../../context/ThemeContext';
import { setSelectedAdhan } from '../../../../redux/slices/userPreferencesSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import { Audio } from 'expo-av'

const AdhanSelectionScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedAdhan } = useSelector((state: RootState) => state.userPreferences)
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  const adhanOptions = [
    { id: 1, label: 'None', file: null },
    { id: 2, label: 'Ahmad Al-Nafees', file: require('../../../../assets/adhans/ahmadAlNafees.mp3') },
    { id: 3, label: 'Mishary Rashid Alafasy', file: require('../../../../assets/adhans/mishary.mp3') },
  ];

  const playAudio = async (file: any) => {
    try {
        if (currentSound) {
            await currentSound.stopAsync();
            await currentSound.unloadAsync();
            setCurrentSound(null);
        }

        if (!file) {
            console.log('No audio file selected (None)');
            return;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(file);
        setCurrentSound(newSound);
        await newSound.playAsync();
    } catch (error) {
        console.error('Error playing sound: ', error)
    }
  }

  useEffect(() => {
    return () => {
        if (currentSound) {
            currentSound.unloadAsync();
        }
    }
  }, [currentSound])

  const handleAdhanSelect = (label: string, file: string) => {
    dispatch(setSelectedAdhan(label));
    playAudio(file);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.selectionContainer}>
        <FlatList
          data={adhanOptions}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.itemContainer,
              ]}
              onPress={() => handleAdhanSelect(item.label, item.file)}
            >
                <View style={styles.iconContainer}>
                    {item.label === selectedAdhan && (
                        <FontAwesome6 name="check" size={theme.fontSizes.large} color={theme.colors.text.secondary} />
                    )}
                    <Text
                        style={[
                        styles.itemLabel,
                        item.label === selectedAdhan && styles.selectedLabel,
                        ]}
                    >
                        {item.label}
                    </Text>
                </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{
            borderRadius: theme.borderRadius.large,
            paddingVertical: theme.spacing.small,
          }}
        />
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    selectionContainer: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      width: '100%',
      maxWidth: 400,
      ...theme.shadows.default,
    },
    itemContainer: {
      paddingVertical: theme.spacing.medium,
      paddingHorizontal: theme.spacing.medium,
      justifyContent: 'center',
      borderRadius: theme.borderRadius.small,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        gap: 20
    },
    itemLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.large,
      color: theme.colors.text.primary,
    },
    selectedLabel: {
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
    },
  });

export default AdhanSelectionScreen;
