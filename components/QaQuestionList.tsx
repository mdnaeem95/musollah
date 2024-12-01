import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Pressable, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store/store';
import { fetchQuestionsFromFirebase, incrementQuestionViews, toggleLikeQuestion, updateQuestionVotes } from '../redux/slices/questionSlice';
import { FlashList } from '@shopify/flash-list';
import { Question, Tag } from '../utils/types';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import SignInModal from './SignInModal';
import firestore from "@react-native-firebase/firestore";
import { fetchUserLikedQuestions } from '../api/firebase';

interface QuestionListProps {
  searchQuery: string;
}

const auth = getAuth();
const currentUser = auth.currentUser;

const QuestionList: React.FC<QuestionListProps> = ({ searchQuery }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { ids, entities, loading, error } = useSelector((state: RootState) => state.questions);
  const [likedQuestions, setLikedQuestions] = useState<string[]>([]);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false); 

  useEffect(() => {
    const fetchLikedQuestions = async () => {
      if (!currentUser) return;

      try {
        const likedQuestions = await fetchUserLikedQuestions(currentUser.uid);
        setLikedQuestions(likedQuestions);
      } catch (error) {
        console.error('Error fetching liked questions:', error);
      }
    };

    fetchLikedQuestions();
    dispatch(fetchQuestionsFromFirebase());
  }, [dispatch, currentUser]);

  const handleLikeToggle = async (questionId: string) => {
    // Authentication check
    if (!currentUser) {
      Alert.alert(
        'Authentication Required',
        'You need to log in to like a question.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/login') },
        ]
      );
      return;
    }
  
    // Find the question from the entities
    const question = entities[questionId];
    if (!question) return;
  
    const isCurrentlyLiked = likedQuestions.includes(questionId);
    const voteChange = isCurrentlyLiked ? -1 : 1; // Increment or decrement based on like status
    const updatedLikedQuestions = isCurrentlyLiked
      ? likedQuestions.filter((id) => id !== questionId) // Remove the questionId
      : [...likedQuestions, questionId]; // Add the questionId
  
    // Optimistically update the UI
    setLikedQuestions(updatedLikedQuestions);
    dispatch(
      updateQuestionVotes({
        questionId,
        votes: question.votes + voteChange, // Update the vote count in the UI
      })
    );
  
    try {
      // Sync the like status and votes with the backend
      await dispatch(
        toggleLikeQuestion({
          questionId,
          isLiked: !isCurrentlyLiked,
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to toggle like:', error);
  
      // Rollback on failure
      setLikedQuestions(isCurrentlyLiked ? updatedLikedQuestions : likedQuestions);
      dispatch(
        updateQuestionVotes({
          questionId,
          votes: question.votes, // Revert to the original vote count
        })
      );
    }
  };  

  const goToThread = async (item: Question) => {
    try {
      // Optimistically update views in Redux
      dispatch(
        incrementQuestionViews({
          questionId: item.id,
        })
      );
  
      // Navigate to the thread page
      router.push(`/qa/questionThread/${item.id}`);
    } catch (error) {
      console.error('Failed to increment views:', error);
      Alert.alert('Error', 'Unable to update views for this question.');
    }
  };
    
  const renderQuestion = useCallback(({ item }: { item: Question }) => {
    //@ts-ignore
    const question = entities[item];
    if (!question) return null;
  
    const createdAtDate = new Date(question.createdAt);
    const relativeTime = formatDistanceToNow(createdAtDate, { addSuffix: true });
    const isLiked = likedQuestions.includes(question.id); // Determine like status
    console.log('Rendering Question:', question.title, 'isLiked:', isLiked);
  
    return (
      <Animated.View style={styles.container}>
        <View style={{ marginHorizontal: 16, gap: 10 }}>
          <Pressable onPress={() => goToThread(question)}>
            <View style={{ gap: 10 }}>
              <Text style={styles.title}>{question.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{question.body}</Text>
  
              {!question.tags.includes("") && (
                <View style={styles.tagsContainer}>
                  {question.tags.map((tag: any, index: number) => (
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
            <StatItem icon="eye" value={question.views} />
            <StatItem icon="comment" value={question.answerCount} />
            <StatItem
              icon="thumbs-up"
              value={question.votes}
              onPress={() => handleLikeToggle(question.id)}
              isLiked={isLiked} // Pass `isLiked` here
            />
          </View>
        </View>
      </Animated.View>
    );
  }, [entities, likedQuestions]);
  
  const StatItem: React.FC<{ 
    icon: string; 
    value: number; 
    onPress?: () => void; 
    isLiked?: boolean 
  }> = ({ icon, value, onPress, isLiked }) => (
    <View style={styles.statItem}>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          <FontAwesome6 
            name={icon} 
            size={16} 
            color="#BFE1DB" 
            solid={!!isLiked} // Ensure proper boolean handling
          />
        </TouchableOpacity>
      ) : (
        <FontAwesome6 
          name={icon} 
          size={16} 
          color="#BFE1DB" 
          solid={false} // Default for non-clickable
        />
      )}
      <Text style={styles.statText}>{value}</Text>
    </View>
  );  
  
  // Filter questions based on the search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery) return ids;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return ids.filter((id) => {
      const question = entities[id];
      return (
        question.title.toLowerCase().includes(lowerCaseQuery) ||
        question.body.toLowerCase().includes(lowerCaseQuery)
      );
    });
  }, [searchQuery, ids, entities]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <>
      <FlashList
        data={filteredQuestions}
        estimatedItemSize={100}
        extraData={likedQuestions}
        keyExtractor={(item) => item}
        //@ts-ignore
        renderItem={({ item }) => renderQuestion({ item })}
        ListEmptyComponent={<Text style={styles.emptyText}>No questions found.</Text>}
      />

      <SignInModal
        isVisible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />
    </>
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
