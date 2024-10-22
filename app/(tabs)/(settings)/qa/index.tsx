import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import QuestionList from '../../../../components/QaQuestionList';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrayerHeader from '../../../../components/PrayerHeader';
import { useRouter } from 'expo-router';

const LandingPage: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <PrayerHeader title="Questions" backgroundColor='#4D6561' />
      <QuestionList />
      <View>
        <Button
          title="Ask a Question"
          color="#ff8c00"
          onPress={() => router.push('/qa/newQuestion')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#4D6561',
    gap: 20
  },
});

export default LandingPage;
