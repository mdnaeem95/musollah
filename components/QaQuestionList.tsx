// File: src/components/QuestionList.tsx

import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store/store';
import { fetchQuestions } from '../redux/slices/qaSlice';
import QuestionCard from './QuestionCard';

const QuestionList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { questions, loading, error } = useSelector((state: RootState) => state.qa);

  useEffect(() => {
    dispatch(fetchQuestions());
  }, [dispatch]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <FlatList
      data={questions}
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
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
});

export default QuestionList;
