import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store/store';
import { fetchQuestions } from '../redux/slices/qaSlice';
import QuestionCard from './QuestionCard';
import { FlashList } from '@shopify/flash-list';

interface QuestionListProps {
  searchQuery: string;
}

const QuestionList: React.FC<QuestionListProps> = ({ searchQuery }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { questions, loading, error } = useSelector((state: RootState) => state.qa);

  useEffect(() => {
    dispatch(fetchQuestions());
  }, [dispatch]);

  // Filter questions based on the search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery) return questions;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return questions.filter(
      (question) =>
        question.title.toLowerCase().includes(lowerCaseQuery) ||
        question.body.toLowerCase().includes(lowerCaseQuery)
    );
  }, [searchQuery, questions]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <FlashList
      data={filteredQuestions}
      estimatedItemSize={100}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => {/* Navigate to question detail page */}}>
          <QuestionCard question={item} />
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No questions found.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  emptyText: {
    color: '#ECDFCC',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
});

export default QuestionList;
