import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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
import { useTheme } from '../../../../../context/ThemeContext';

const auth = getAuth();
const currentUser = auth.currentUser;

const QuestionThreadScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { theme } = useTheme();
  const styles = createStyles(theme);

  const { entities: questionEntities, loading: questionLoading } = useSelector((state: RootState) => state.questions);
  const { entities: answerEntities, loading: answersLoading } = useSelector((state: RootState) => state.answers);

  const [userRole, setUserRole] = useState<string>('');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (!currentUser) return;

      try {
        const userRole = await fetchUserRole(currentUser.uid);
        setUserRole(userRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchRole();
  }, [dispatch, currentUser]);

  const question = id ? questionEntities[id] : undefined;
  const answers = useSelector((state: RootState) => selectAnswersByQuestionId(state, id || ''));

  const openModal = () => setModalVisible(true);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        dispatch(fetchAnswersFromFirebase(id));
      }
    }, [dispatch, id])
  );

  if (questionLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.text.secondary} />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.errorText, { color: theme.colors.text.error }]}>
          Question not found.
        </Text>
      </View>
    );
  }

  const createdAtDate = new Date(question.createdAt);
  const relativeTime = formatDistanceToNow(createdAtDate, { addSuffix: true });

  return (
    <Animated.View style={[styles.container]}>
      <View style={{ gap: 10, marginBottom: 20 }}>
        <Text style={styles.title}>{question.title}</Text>
        <Text style={styles.body}>{question.body}</Text>

        {!question.tags.includes('') && (
          <View style={styles.tagsContainer}>
            {question.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.date}>{relativeTime}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome6 name="comment" size={20} color={theme.colors.accent} />
            <Text style={styles.statText}>{question.answerCount}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="thumbs-up" size={20} color={theme.colors.accent} />
            <Text style={styles.statText}>{question.votes}</Text>
          </View>
        </View>

        {userRole === 'admin' && (
          <TouchableOpacity onPress={openModal}>
            <FontAwesome6 name="reply" size={20} color={theme.colors.accent} />
          </TouchableOpacity>
        )}
      </View>

      {answersLoading ? (
        <ActivityIndicator size="large" color={theme.colors.accent} />
      ) : answers.length > 0 ? (
        answers.map((answer: any) => (
          <View key={answer.id} style={styles.answerContainer}>
            <Text style={styles.answerText}>{answer.body}</Text>
            <Text style={styles.answerDate}>
              {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No answers yet. Be the first to respond!</Text>
      )}

      <AnswerModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        questionId={question.id}
      />
    </Animated.View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.primary,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginBottom: 10,
    },
    body: {
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
      marginBottom: 15,
    },
    date: {
      fontSize: 12,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 5,
    },
    tag: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 5,
      paddingVertical: 2,
      paddingHorizontal: 8,
      marginRight: 5,
      marginBottom: 5,
    },
    tagText: {
      fontSize: 12,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    statsRow: {
      flexDirection: 'row',
      marginBottom: 15,
      gap: 10
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statText: {
      fontSize: 20,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
    answerContainer: {
      marginBottom: 15,
      padding: 15,
      borderRadius: 10,
      backgroundColor: theme.colors.secondary,
    },
    answerText: {
      fontSize: 15,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.primary,
      marginBottom: 10,
    },
    answerDate: {
      fontSize: 12,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginTop: 20,
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
    },
  });

export default QuestionThreadScreen;
