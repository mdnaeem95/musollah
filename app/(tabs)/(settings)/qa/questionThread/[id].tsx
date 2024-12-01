import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../../redux/store/store';
import { fetchAnswersFromFirebase } from '../../../../../redux/slices/answerSlice';
import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import AnswerModal from '../../../../../components/AnswerModal';
import { FontAwesome6 } from '@expo/vector-icons';
import { selectAnswersByQuestionId } from '../../../../../redux/slices/answerSlice';
import { getAuth } from '@react-native-firebase/auth';
import { fetchUserRole } from '../../../../../api/firebase';

const auth = getAuth();
const currentUser = auth.currentUser;

const QuestionThreadScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Redux Selectors
  const { entities: questionEntities, loading: questionLoading } = useSelector((state: RootState) => state.questions);
  const { entities: answerEntities, loading: answersLoading } = useSelector((state: RootState) => state.answers);
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const fetchRole = async () => {
      if (!currentUser) return;

      try {
        const userRole = await fetchUserRole(currentUser.uid);
        setUserRole(userRole);
      } catch (error) {
        console.error('Error fetching liked questions:', error);
      }
    };

    fetchRole();
  }, [dispatch, currentUser]);

  const [isModalVisible, setModalVisible] = useState(false);

  const question = id ? questionEntities[id] : undefined;
  const answers = useSelector((state: RootState) => selectAnswersByQuestionId(state, id || ''));

  const openModal = () => setModalVisible(true);

  // Fetch answers and user data when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (id) {
        dispatch(fetchAnswersFromFirebase(id));
      }
    }, [dispatch, id])
  );

  if (questionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4D6561" />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Question not found.</Text>
      </View>
    );
  }

  const createdAtDate = new Date(question.createdAt);
  const relativeTime = formatDistanceToNow(createdAtDate, { addSuffix: true });

  return (
    <Animated.View style={styles.container}>
      {/* Question Details */}
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
          {/* Stats Row */}
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

          {/* Reply Button for Admins */}
          {userRole === 'admin' && (
            <TouchableOpacity onPress={openModal}>
              <FontAwesome6 name="reply" size={20} color="#BFE1DB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Answers Section */}
      {answersLoading ? (
        <ActivityIndicator size="large" color="#00ff00" />
      ) : answers.length > 0 ? (
        answers.map((answer: any) => (
          <View key={answer.id} style={styles.answerContainer}>
            <Text style={styles.answerText}>{answer.body}</Text>
            <View style={styles.answerDetailsContainer}>
              <Text style={styles.answerDate}>{`${formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}`}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No answers yet. Be the first to respond!</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  answerDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#A3C0BB',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default QuestionThreadScreen;
