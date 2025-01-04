import { StyleSheet, View } from 'react-native';
import React, { useContext } from 'react';
import Compass from '../../../../components/Compass';
import { ThemeContext } from '../../../../context/ThemeContext';

const QiblatTab = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  return (
    <View style={[styles.mainContainer, { backgroundColor: activeTheme.colors.primary }]}>
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
