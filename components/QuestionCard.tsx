// File: src/components/QuestionCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Question } from '../utils/types';
import { format } from 'date-fns';

interface QuestionCardProps {
  question: Question;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const createdAtString = typeof question.createdAt === 'string' ? question.createdAt : format(question.createdAt, 'dd MMM yyyy');
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{question.title}</Text>
      <Text style={styles.body} numberOfLines={2}>{question.body}</Text>
      <View style={styles.footer}>
        <Text style={styles.stats}>👀 {question.views} | 💬 {question.answerCount} | 👍 {question.votes}</Text>
        <Text style={styles.tags}>{question.tags.join(', ')}</Text>
        <Text style={styles.date}>{createdAtString}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 15,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  body: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stats: {
    fontSize: 12,
    color: '#888',
  },
  tags: {
    fontSize: 12,
    color: '#888',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
});

export default QuestionCard;
