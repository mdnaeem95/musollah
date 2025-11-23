import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { usePrayerSettings } from '../../../../hooks/settings/usePrayerSettings';

const AdhanSelectionScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    adhanOptions,
    selectedAdhan,
    isPlayingAdhan,
    handleAdhanSelect,
  } = usePrayerSettings();

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Select the adhan audio you want to hear for prayer times. Tap to preview.
      </Text>

      <FlatList
        data={adhanOptions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => {
          const isSelected = item.label === selectedAdhan;
          const isLastItem = index === adhanOptions.length - 1;

          return (
            <TouchableOpacity
              style={[
                styles.adhanOption,
                !isLastItem && styles.adhanOptionBorder,
                isSelected && styles.selectedOption,
              ]}
              onPress={() => handleAdhanSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                {isSelected && (
                  <FontAwesome6
                    name="check-circle"
                    size={20}
                    color={theme.colors.accent}
                    solid
                  />
                )}
                <Text
                  style={[
                    styles.adhanLabel,
                    isSelected && styles.selectedLabel,
                  ]}
                >
                  {item.label}
                </Text>
              </View>

              {item.file && (
                <FontAwesome6
                  name="play"
                  size={16}
                  color={theme.colors.text.muted}
                />
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {isPlayingAdhan && (
        <View style={styles.playingIndicator}>
          <FontAwesome6
            name="volume-high"
            size={20}
            color={theme.colors.accent}
          />
          <Text style={styles.playingText}>Playing preview...</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    description: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.medium,
      lineHeight: 22,
    },
    listContent: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      ...theme.shadows.default,
    },
    adhanOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.medium,
      paddingHorizontal: theme.spacing.medium,
    },
    adhanOptionBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.text.muted + '20',
    },
    selectedOption: {
      backgroundColor: theme.colors.accent + '10',
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small,
      flex: 1,
    },
    adhanLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
    },
    selectedLabel: {
      color: theme.colors.accent,
      fontFamily: 'Outfit_600SemiBold',
    },
    playingIndicator: {
      position: 'absolute',
      bottom: theme.spacing.large,
      left: theme.spacing.medium,
      right: theme.spacing.medium,
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small,
      ...theme.shadows.strong,
    },
    playingText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.secondary,
    },
  });

export default AdhanSelectionScreen;