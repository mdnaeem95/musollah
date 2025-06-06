import { StyleSheet, View } from 'react-native';
import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import Compass from '../../../../components/prayer/Compass';

const QiblatTab = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.compassContainer}>
        <Compass />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compassContainer: {
    justifyContent: 'center', 
    alignItems: 'center', 
    flex: 1, 
    marginBottom: 200,
  },
  mainContainer: {
    padding: 16,
    flex: 1,
  },
});

export default QiblatTab;
