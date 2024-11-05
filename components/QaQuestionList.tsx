import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Pressable, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store/store';
import { fetchQuestions, incrementQuestionViews, toggleLikeQuestion } from '../redux/slices/qaSlice';
import { FlashList } from '@shopify/flash-list';
import { Question } from '../utils/types';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuestionListProps {
  searchQuery: string;
}

const QuestionList: React.FC<QuestionListProps> = ({ searchQuery }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { questions, loading, error } = useSelector((state: RootState) => state.qa);
  const [likedQuestions, setLikedQuestions] = useState<string[]>([]);
  console.log(likedQuestions)

  const handleLikeToggle = async (questionId: string) => {
    const isCurrentlyLiked = likedQuestions.includes(questionId);
  
    // Optimistically update the local state
    const updatedLikedQuestions = isCurrentlyLiked
      ? likedQuestions.filter((id) => id !== questionId)
      : [...likedQuestions, questionId];
  
    setLikedQuestions(updatedLikedQuestions);
  
    // Save the updated liked questions to AsyncStorage
    try {
      await AsyncStorage.setItem('likedQuestions', JSON.stringify(updatedLikedQuestions));
    } catch (error) {
      console.error('Failed to save liked questions to storage:', error);
    }
  
    // Dispatch the action to update the backend and global state
    await dispatch(toggleLikeQuestion({ questionId }));
  };
    
  const goToThread = (item: Question) => {
    dispatch(incrementQuestionViews({ questionId: item.id }));
    router.push(`/qa/questionThread/${item.id}`)
  }

  const renderQuestion = useCallback(({ item, index }: { item: Question, index: number }) => {
    const createdAtDate = typeof item.createdAt === 'string' ?  new Date(item.createdAt) : item.createdAt;
    const relativeTime = formatDistanceToNow(createdAtDate, { addSuffix: true })
    const isLiked = likedQuestions.includes(item.id);

    return (
      <Animated.View style={styles.container}>
        <View style={{ marginHorizontal: 16, gap: 10 }}>
          <Pressable 
            onPress={() => goToThread(item)}
          >
            <View style={{ gap: 10 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>

              {!item.tags.includes("") && (
                <View style={styles.tagsContainer}>
                  {item.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.date}>{relativeTime}</Text>
            </View>
          </Pressable>

          {/* Stats Row */}
          <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome6 name="eye" size={16} color="#BFE1DB" />
                <Text style={styles.statText}>{item.views}</Text>
              </View>

              <View style={styles.statItem}>
                <FontAwesome6 name="comment" size={16} color="#BFE1DB" />
                <Text style={styles.statText}>{item.answerCount}</Text>
              </View>

              <View style={styles.statItem}>
                <TouchableOpacity onPress={() => handleLikeToggle(item.id)}>
                  <FontAwesome6 name="thumbs-up" size={16} color="#BFE1DB" solid={isLiked} />
                </TouchableOpacity>
                <Text style={styles.statText}>{item.votes}</Text>
              </View>          
          </View>
        </View>
      </Animated.View>
    )
  }, [likedQuestions])

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
      renderItem={renderQuestion}
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

export default QuestionList;
