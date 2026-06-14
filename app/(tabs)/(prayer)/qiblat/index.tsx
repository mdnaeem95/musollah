import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../context/ThemeContext';
import Compass from '../../../../components/prayer/qiblat/Compass';
import { SafeAreaView } from 'react-native-safe-area-context';

const QiblatTab = () => {
  const { isDarkMode } = useTheme();

  const gradientColors = isDarkMode
    ? (['#060B18', '#0A1020', '#0C1428'] as const)
    : (['#EEF2FF', '#F0F4FF', '#E8EFFF'] as const);

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Compass />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});

export default QiblatTab;