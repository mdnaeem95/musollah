import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getAuth } from '@react-native-firebase/auth';
import { useLocalSearchParams } from 'expo-router';
import { Answer } from '../../../../../utils/types';
import { addAnswer, fetchAnswers } from '../../../../../redux/slices/qaSlice';
import { AppDispatch, RootState } from '../../../../../redux/store/store';

const QuestionThreadScreen: React.FC = () => {
  const { id: paramQuestionId } = useLocalSearchParams();
  const questionId = Array.isArray(paramQuestionId) ? paramQuestionId[0] : paramQuestionId;

  const [answerText, setAnswerText] = useState<string>('');
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const dispatch = useDispatch<AppDispatch>();
  const questionDetails = useSelector((state: RootState) => state.qa.questions.find(q => q.id === questionId));
  const answers = useSelector((state: RootState) => state.qa.answers[questionId] || []);
  const loading = useSelector((state: RootState) => state.qa.loading);

  useEffect(() => {
    dispatch(fetchAnswers(questionId));
  }, [dispatch, questionId]);

  const handleAddAnswer = () => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to answer this question.');
      return;
    }

    if (!answerText.trim()) {
      Alert.alert('Error', 'Answer cannot be empty.');
      return;
    }

    const newAnswer: Partial<Answer> = {
        body: answerText.trim(),
        userId: currentUser.uid,  // Replace with actual user ID
        votes: 0,
        isAccepted: false,
        createdAt: new Date(),
      };

    dispatch(addAnswer({ questionId, newAnswer }));
    setAnswerText('');
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#4D6561" />;
  }

  return (
    <View style={styles.container}>
      {questionDetails ? (
        <>
          <View style={styles.questionContainer}>
            <Text style={styles.title}>{questionDetails.title}</Text>
            <Text style={styles.body}>{questionDetails.body}</Text>
            <Text style={styles.stats}>👀 {questionDetails.views} | 💬 {questionDetails.answerCount} | 👍 {questionDetails.votes}</Text>
          </View>

          <FlatList
            data={answers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.answerContainer}>
                <Text style={styles.answerBody}>{item.body}</Text>
                <Text style={styles.answerMeta}>By User {item.userId} - {new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.noAnswersText}>No answers yet. Be the first to answer!</Text>}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer here..."
              value={answerText}
              onChangeText={setAnswerText}
              multiline
            />
            <TouchableOpacity onPress={handleAddAnswer} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.noDataText}>Question not found</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A',
  },
  questionContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#314441',
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#D1D5DB',
    marginBottom: 15,
  },
  stats: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#BFE1DB',
  },
  answerContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#3A504C',
    borderRadius: 5,
  },
  answerBody: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#D1D5DB',
  },
  answerMeta: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#A3C0BB',
    marginTop: 5,
  },
  inputContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#3A504C',
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Outfit_400Regular',
  },
  submitButton: {
    backgroundColor: '#4D6561',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  noAnswersText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 10,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ECDFCC',
  },
});

export default QuestionThreadScreen;
