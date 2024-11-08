import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Question } from '../../../../../utils/types';
import { AppDispatch, RootState } from '../../../../../redux/store/store';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import AnswerModal from '../../../../../components/AnswerModal';
import { fetchAnswers } from '../../../../../redux/slices/qaSlice';
import { fetchUser } from '../../../../../redux/slices/userSlice';

const QuestionThreadScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { questions, loading } = useSelector((state: RootState) => state.qa);
  const user = useSelector((state: RootState) => state.user.user);
  const question: Question | undefined = questions.find((question: Question) => question.id === id);
  const answers = useSelector((state: RootState) => state.qa.answers[question!.id] || []);
  const [isModalVisible, setModalVisible] = useState(false);

  const openModal = () => {
      setModalVisible(true);
  };

  // Fetch answers whenever the screen is in focus
  useFocusEffect(
    useCallback(() => {
      if (id) {
        dispatch(fetchUser);
        dispatch(fetchAnswers(id));
      }
    }, [dispatch, id])
  );

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#4D6561" />
      </View>
    )
  }

  if (!question) {
    return (
      <Text>Question is not found.</Text>
    )
  }

  const createdAtDate = typeof question.createdAt === 'string' ?  new Date(question.createdAt) : question.createdAt;
  const relativeTime = formatDistanceToNow(createdAtDate, { addSuffix: true })

  return (
      <Animated.View style={styles.container}>
        <View style={{ gap: 10, marginBottom: 20 }}>
          <Text style={styles.title}>{question.title}</Text>
          <Text style={styles.body}>{question.body}</Text>

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

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* STATS */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome6 name="comment" size={20} color="#BFE1DB" />
                <Text style={styles.statText}>{question.answerCount}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome6 name="thumbs-up" size={20} color="#BFE1DB" />
                <Text style={styles.statText}>{question.votes}</Text>
              </View>
            </View>

            {/* REPLY FOR ADMINS */}
            {user?.role === 'admin' && (
              <TouchableOpacity onPress={openModal}>
                <FontAwesome6 name="reply" size={20} color="#BFE1DB" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
        <ActivityIndicator size="large" color="#00ff00" />
        ) : (
          answers.map((answer) => (
            <View key={answer.id} style={styles.answerContainer}>
              <Text style={styles.answerText}>{answer.body}</Text>
              <View style={styles.answerDetailsContainer}>
                <Text style={styles.answerDate}>{`${formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}`}</Text>
              </View>
            </View>
          ))
        )}

        {/* Answer Modal */}
        <AnswerModal
          visible={isModalVisible}
          onClose={() => setModalVisible(false)}
          questionId={question.id}
        />
      </Animated.View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A',
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
    fontSize: 20,
    fontFamily: 'Outfit_400Regular',
    color: '#BFE1DB',
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
  answerContainer: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#3D4F4C',
  },
  answerText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: '#D1D5DB',
    marginBottom: 10,
  },
  answerDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerDetails: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#A3C0BB',
    marginLeft: 5,
  },
  answerDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#A3C0BB',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  }
});

export default QuestionThreadScreen;
