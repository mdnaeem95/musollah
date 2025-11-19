import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlan } from './context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import { useQuranStore } from '../../../../stores/useQuranStore';

const TOTAL_AYAHS = 6236;
const TOTAL_SURAHS = 114;
const TOTAL_JUZ = 30;

export default function ReviewScreen() {
  const { theme } = useTheme();
  //@ts-ignore
  const { plan } = usePlan();
  const setRecitationPlan = useQuranStore((state) => state.setRecitationPlan);
  const router = useRouter();

  const handleStart = () => {
    setRecitationPlan({
      ...plan,
      startDate: new Date().toISOString(),
      completedAyahKeys: [],
    });
    router.replace('/(quran)');
  };

  // 💡 Calculate based on unit
  const calculateDailyTarget = () => {
    switch (plan.planType) {
      case 'ayahs':
        return Math.ceil(TOTAL_AYAHS / plan.daysToFinish);
      case 'surahs':
        return Math.ceil(TOTAL_SURAHS / plan.daysToFinish);
      case 'juz':
        return (1 / plan.daysToFinish) * TOTAL_JUZ;
      default:
        return 0;
    }
  };

  const dailyTarget = calculateDailyTarget();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Your Recitation Plan</Text>

      <Text style={[styles.summary, { color: theme.colors.text.secondary }]}>
        🗓️ Finish in <Text style={styles.highlight}>{plan.daysToFinish} days</Text>
      </Text>

      <Text style={[styles.summary, { color: theme.colors.text.secondary }]}>
        📖 Unit: <Text style={styles.highlight}>{plan.planType}</Text>
      </Text>

      <Text style={[styles.summary, { color: theme.colors.text.secondary }]}>
        📝 You'll need to read around
        {' '}
        <Text style={styles.highlight}>
          {plan.planType === 'juz'
            ? `${dailyTarget.toFixed(2)} Juz/day`
            : `${dailyTarget} ${plan.planType}/day`}
        </Text>
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.secondary }]}
        onPress={handleStart}
      >
        <Text style={styles.buttonText}>Start My Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  summary: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'capitalize'
  },
  highlight: {
    fontFamily: 'Outfit_700Bold',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
  },
});