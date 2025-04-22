import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlan } from './context';
import { useTheme } from '../../../../context/ThemeContext';

export default function TimelineScreen() {
  const { theme } = useTheme();
  //@ts-ignore
  const { setPlan } = usePlan();
  const router = useRouter();

  const handleSelect = (days: number) => {
    setPlan({ daysToFinish: days });
    router.push('/recitationPlan/unit');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Text style={[styles.question, { color: theme.colors.text.primary }]}>When would you like to complete the Quran?</Text>

      {[7, 30, 60, 90].map((d) => (
        <TouchableOpacity
          key={d}
          onPress={() => handleSelect(d)}
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
            In {d} days
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  question: {
    fontSize: 22,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
  },
});