import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Question } from '../utils/types';
import { formatDistanceToNow } from 'date-fns';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface QuestionCardProps {
  question: Question;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const router = useRouter();
  const createdAtDate = typeof question.createdAt === 'string' ?  new Date(question.createdAt) : question.createdAt;
  const relativeTime = formatDistanceToNow(createdAtDate, { addSuffix: true })

  return (
    <View style={styles.container}>
      <View style={{ marginHorizontal: 16, gap: 10 }}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome6 name="eye" size={16} color="#BFE1DB" />
            <Text style={styles.statText}>{question.views}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="comment" size={16} color="#BFE1DB" />
            <Text style={styles.statText}>{question.answerCount}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="thumbs-up" size={16} color="#BFE1DB" />
            <Text style={styles.statText}>{question.votes}</Text>
          </View>
        </View>

        <TouchableOpacity style={{ gap: 10 }} onPress={() => router.push(`/qa/questionThread/${question.id}`)}>
          <Text style={styles.title}>{question.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{question.body}</Text>

          {!question.tags.includes("") && (
            <View style={styles.tagsContainer}>
              {question.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.date}>{relativeTime}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3A504C',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#BFE1DB',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 5,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#D1D5DB',
    marginBottom: 10,
  },
  stats: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#BFE1DB',
  },
  tags: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#A3C0BB',
    marginTop: 5,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#A3C0BB',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#314441',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#A3C0BB',
  },
});

export default QuestionCard;
