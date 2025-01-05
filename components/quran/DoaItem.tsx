import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Doa } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';

interface DoaProps {
  doa: Doa;
  onPress: (doa: Doa) => void;
}

const DoaItem = ({ doa, onPress }: DoaProps) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={() => onPress(doa)}>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.doaNumber,
                { color: theme.colors.text.primary },
              ]}
            >
              {doa.number}
            </Text>
            <View>
              <Text
                style={[
                  styles.doaTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                {doa.title}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    width: '100%',
  },
  contentContainer: {
    height: 55,
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  textContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doaNumber: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 30,
    lineHeight: 45,
  },
  doaTitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    lineHeight: 18,
  },
});

export default DoaItem;
