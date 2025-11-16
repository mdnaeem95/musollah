import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DoaItemProps } from '../../../types/doa.types';

/**
 * Presentational component for displaying a single Doa item
 * Following SRP - only responsible for rendering one doa
 */
const DoaItem: React.FC<DoaItemProps> = ({
  item,
  textColor,
  secondaryColor,
  mutedColor,
}) => {
  return (
    <View style={[styles.container, { borderBottomColor: mutedColor }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: textColor }]}>
          {item.step}. {item.title}
        </Text>
      </View>
      
      <Text style={[styles.arabicText, { color: textColor }]}>
        {item.arabicText}
      </Text>
      
      <Text style={[styles.romanizedText, { color: secondaryColor }]}>
        {item.romanized}
      </Text>
      
      <Text style={[styles.englishText, { color: mutedColor }]}>
        {item.englishTranslation}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 20,
    lineHeight: 25,
  },
  arabicText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 26,
    lineHeight: 48,
    textAlign: 'right',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  romanizedText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  englishText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
});

export default memo(DoaItem);