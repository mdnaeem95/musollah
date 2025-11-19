import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { useQuranStore, calculateRecitationProgress } from '../../../../stores/useQuranStore';
import * as Progress from 'react-native-progress';

export default function RecitationPlanIndex() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const { recitationPlan, clearRecitationPlan } = useQuranStore();

  const progress = recitationPlan ? calculateRecitationProgress(recitationPlan) : null;

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
            clearRecitationPlan();
            router.push('/recitationPlan/timeline');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {recitationPlan && progress ? (
        <>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Active Recitation Plan
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {recitationPlan.planType.charAt(0).toUpperCase() + recitationPlan.planType.slice(1)} Plan — Day {progress.daysPassed} of {recitationPlan.daysToFinish}
          </Text>

          <Progress.Bar
            progress={progress.progressRatio}
            width={null}
            height={10}
            color={theme.colors.accent}
            unfilledColor={theme.colors.secondary}
            borderWidth={0}
            style={{ marginVertical: 20 }}
          />

          <Text style={[styles.progressText, { color: theme.colors.text.primary }]}>
            {progress.completed} / {progress.expected} {recitationPlan.planType} completed
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