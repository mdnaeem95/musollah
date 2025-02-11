import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { scaleSize } from '../../utils';
import { useTheme } from '../../context/ThemeContext';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const QuickAccessButtons = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  return (
    <View style={styles.quickAccessContainer}>
      {/* Qiblat */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/qiblat')}>
          <FontAwesome6 name="compass" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.buttonLabel}>Qiblat</Text>
      </View>

      {/* Doas */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/doa')}>
          <FontAwesome6 name="hands-praying" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.buttonLabel}>Doas</Text>
      </View>

      {/* Monthly Prayer Times */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/monthlyPrayerTimes')}>
          <FontAwesome6 name="calendar-alt" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.buttonLabel}>Monthly</Text>
      </View>

      {/* Prayer Dashboard */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/prayerDashboard')}>
          <FontAwesome6 name="chart-bar" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.buttonLabel}>Dashboard</Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    quickAccessContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allows 2x2 layout
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.small,
    },
    buttonWrapper: {
      alignItems: 'center',
      width: '45%',
    },
    button: {
      width: scaleSize(50),
      height: scaleSize(50),
      borderRadius: scaleSize(25),
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.default,
      marginBottom: 5
    },
    buttonLabel: {
      marginTop: 5,
      fontSize: scaleSize(12),
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.primary,
    },
  });

export default QuickAccessButtons;
