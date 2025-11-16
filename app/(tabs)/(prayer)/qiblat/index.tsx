import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import Compass from '../../../../components/prayer/qiblat/Compass';
import { SafeAreaView } from 'react-native-safe-area-context';

const QiblatTab = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        <Compass />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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