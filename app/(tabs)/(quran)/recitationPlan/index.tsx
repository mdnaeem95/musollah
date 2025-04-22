import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { clearRecitatonPlan } from '../../../../redux/slices/quranSlice'
import { RootState, AppDispatch } from '../../../../redux/store/store';
import * as Progress from 'react-native-progress';
import { Alert } from 'react-native';

const TOTAL_AYAHS = 6236;
const TOTAL_SURAHS = 114;
const TOTAL_JUZ = 30;

export default function RecitationPlanIndex() {
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const plan = useSelector((state: RootState) => state.quran.recitationPlan);

  const today = new Date();
  const startDate = plan ? new Date(plan.startDate) : null;
  const daysPassed = startDate
    ? Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  let expected = 0;
  let total = 0;

  if (plan) {
    switch (plan.planType) {
      case 'ayahs':
        total = TOTAL_AYAHS;
        expected = (TOTAL_AYAHS / plan.daysToFinish) * daysPassed;
        break;
      case 'surahs':
        total = TOTAL_SURAHS;
        expected = (TOTAL_SURAHS / plan.daysToFinish) * daysPassed;
        break;
      case 'juz':
        total = TOTAL_JUZ;
        expected = (TOTAL_JUZ / plan.daysToFinish) * daysPassed;
        break;
    }
    expected = Math.ceil(expected);
  }

  const actual = plan?.completedAyahKeys.length || 0; 
  const progressRatio = plan ? Math.min(actual / expected, 1) : 0;

  const handleStartNew = () => {
    Alert.alert(
      'Start a New Plan?',
      'This will delete your current recitation plan and its progress. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Start New',
          style: 'destructive',
          onPress: () => {
            router.push('/recitationPlan/timeline');
            setTimeout(() => {
              dispatch(clearRecitatonPlan());
            }, 700);
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {plan ? (
        <>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Active Recitation Plan
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)} Plan — Day {daysPassed} of {plan.daysToFinish}
          </Text>

          <Progress.Bar
            progress={progressRatio}
            width={null}
            height={10}
            color={theme.colors.accent}
            unfilledColor={theme.colors.secondary}
            borderWidth={0}
            style={{ marginVertical: 20 }}
          />

          <Text style={[styles.progressText, { color: theme.colors.text.primary }]}>
            {actual} / {expected} {plan.planType} completed
          </Text>

          <TouchableOpacity
            onPress={handleStartNew}
            style={[styles.secondaryButton, { backgroundColor: theme.colors.secondary, marginTop: 30 }]}
          >
            <Text style={styles.secondaryText}>Start a New Plan</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Start Your Recitation Plan
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            We'll help you complete the Quran at your own pace — by ayah, surah, or juz.
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/recitationPlan/timeline')}
            style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Outfit_600SemiBold',
  },
  secondaryButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#fff',
  },
});