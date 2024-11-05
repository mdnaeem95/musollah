import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { Question, Answer, Vote, Comment } from '../../utils/types';
import { RootState } from '../store/store';
import { getAuth } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define initial state for Q&A
interface QAState {
  questions: Question[];
  answers: { [questionId: string]: Answer[] };
  comments: { [parentId: string]: Comment[] };
  votes: { [parentId: string]: Vote[] };
  loading: boolean;
  error: string | null;
}

const initialState: QAState = {
  questions: [],
  answers: {},
  comments: {},
  votes: {},
  loading: false,
  error: null,
};

export const toggleLikeQuestion = createAsyncThunk<
  { questionId: string; isLiked: boolean; newVotes: number }, // Return type
  { questionId: string }, // Argument type
  { state: RootState; rejectValue: string } // Thunk API configuration
>(
  'qa/toggleLikeQuestion',
  async ({ questionId }, { getState, rejectWithValue }) => {
    try {
      const user = getAuth().currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const userDocRef = firestore().collection('users').doc(user.uid);
      const userData = (await userDocRef.get()).data();

      if (!userData) {
        throw new Error('No user data!');
      }
      const questionDocRef = firestore().collection('questions').doc(questionId);

      // Check if the user already liked the question
      const isLiked = userData.likedQuestions.includes(questionId);
      let voteChange = isLiked ? -1 : 1;

      // Update Firestore with new like state
      await userDocRef.update({
        likedQuestions: isLiked
          ? firestore.FieldValue.arrayRemove(questionId)
          : firestore.FieldValue.arrayUnion(questionId),
      });

      // Update the question's votes
      await questionDocRef.update({
        votes: firestore.FieldValue.increment(voteChange),
      });

      // Update local storage with the new liked questions
      let updatedLikedQuestions;
      if (isLiked) {
        updatedLikedQuestions = userData.likedQuestions.filter((id: string) => id !== questionId);
      } else {
        updatedLikedQuestions = [...userData.likedQuestions, questionId];
      }

      try {
        await AsyncStorage.setItem('likedQuestions', JSON.stringify(updatedLikedQuestions));
      } catch (storageError) {
        console.error('Failed to update local storage:', storageError);
      }

      return { questionId, isLiked: !isLiked, newVotes: voteChange };
    } catch (error) {
      console.error('Error toggling like:', error);
      return rejectWithValue('Failed to toggle like');
    }
  }
);

// Async thunk to increment views in Firestore
export const incrementQuestionViews = createAsyncThunk<
  { questionId: string },
  { questionId: string },
  { rejectValue: string }
>(
  'qa/incrementQuestionViews',
  async ({ questionId }, { rejectWithValue }) => {
    try {
      const questionDocRef = firestore().collection('questions').doc(questionId);

      // Increment the views count by 1
      await questionDocRef.update({
        views: firestore.FieldValue.increment(1),
      });

      return { questionId };
    } catch (error) {
      console.error('Error incrementing views:', error);
      return rejectWithValue('Failed to increment views');
    }
  }
);

// Async thunks using react-native-firebase
export const fetchQuestions = createAsyncThunk<Question[], void, { rejectValue: string }>(
    'qa/fetchQuestions',
    async (_, { rejectWithValue }) => {
      try {
        const questionsSnapshot = await firestore().collection('questions').get();
        const questions: Question[] = questionsSnapshot.docs.map(doc => {
          const data = doc.data();

          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString() || new Date(),            
          } as Question
        });
        return questions;
      } catch (error) {
        return rejectWithValue('Failed to fetch questions');
      }
    }
);

export const addQuestion = createAsyncThunk<Question, Partial<Question>, { rejectValue: string }>(
    'qa/addQuestion',
    async (newQuestion, { rejectWithValue }) => {
      try {
        const questionWithTimestamp = {
          ...newQuestion,
          createdAt: firestore.FieldValue.serverTimestamp()
        }

        const questionRef = await firestore().collection('questions').add(newQuestion);
        const questionSnapshot = await questionRef.get();
        const questionData = questionSnapshot.data();
        return { 
          id: questionSnapshot.id, 
          ...questionData,
          createdAt: questionData?.createdAt?.toDate().toISOString(),
        } as Question;
      } catch (error) {
        return rejectWithValue('Failed to add question');
      }
    }
);

// Async thunk to fetch answers
export const fetchAnswers = createAsyncThunk<Answer[], string, { rejectValue: string }>(
  'qa/fetchAnswers',
  async (questionId, { rejectWithValue }) => {
    try {
      const answersSnapshot = await firestore()
        .collection('questions')
        .doc(questionId)
        .collection('answers')
        .orderBy('createdAt', 'asc')  // Order by creation date
        .get();

      const answers: Answer[] = answersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(), // Convert to ISO string
          updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
        } as Answer;
      });
      return answers;
    } catch (error) {
      return rejectWithValue('Failed to fetch answers');
    }
  }
);

// Async thunk to add an answer
export const addAnswer = createAsyncThunk<Answer, { questionId: string; newAnswer: Partial<Answer> }, { rejectValue: string }>(
  'qa/addAnswer',
  async ({ questionId, newAnswer }, { rejectWithValue }) => {
    try {
      const answerWithTimestamp = {
        ...newAnswer,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const answerRef = await firestore()
        .collection('questions')
        .doc(questionId)
        .collection('answers')
        .add(answerWithTimestamp);

      const answerSnapshot = await answerRef.get();
      const answerData = answerSnapshot.data();

      return {
        id: answerSnapshot.id,
        ...answerData,
        createdAt: answerData?.createdAt?.toDate().toISOString(),
      } as Answer;
    } catch (error) {
      return rejectWithValue('Failed to add answer');
    }
  }
);

// Q&A Slice definition
const qaSlice = createSlice({
  name: 'qa',
  initialState,
  reducers: {
    resetQAState(state) {
      state.questions = [];
      state.answers = {};
      state.comments = {};
      state.votes = {};
      state.loading = false;
      state.error = null;
    },
    incrementQuestionViewsLocally(state, action: PayloadAction<{ questionId: string }>) {
      const { questionId } = action.payload;

      // Find the question and increment its views in the state
      const question = state.questions.find((q) => q.id === questionId);
      if (question) {
        question.views += 1;
      }
    },
    updateQuestionVotes(state, action: PayloadAction<{ questionId: string; isLiked: boolean; newVotes: number }>) {
      const { questionId, isLiked, newVotes } = action.payload;

      // Update the votes of the specific question
      const question = state.questions.find((q) => q.id === questionId);
      if (question) {
        question.votes += isLiked ? 1 : -1;
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetching questions
    builder.addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
    });
    builder.addCase(fetchQuestions.fulfilled, (state, action: PayloadAction<Question[]>) => {
        state.loading = false;
        state.questions = action.payload;
    })
    builder.addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch questions';
    })
    // Handle adding question
    builder.addCase(addQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
    });
    builder.addCase(addQuestion.fulfilled, (state, action: PayloadAction<Question>) => {
      state.loading = false;
      state.questions.unshift(action.payload);
    });
    builder.addCase(addQuestion.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to add question';
    });
    // Handle fetching answers
    builder.addCase(fetchAnswers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAnswers.fulfilled, (state, action) => {
      const questionId = action.meta.arg;  // Corrected: Get the questionId from action.meta.arg
      state.loading = false;
      state.answers[questionId] = action.payload;
    });
    builder.addCase(fetchAnswers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch answers';
    });
    // Handle adding answer
    builder.addCase(addAnswer.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addAnswer.fulfilled, (state, action) => {
      const { questionId } = action.meta.arg;  // Corrected: Get the questionId from action.meta.arg
      state.loading = false;
      state.answers[questionId] = state.answers[questionId] || [];
      state.answers[questionId].push(action.payload);
    });
    builder.addCase(addAnswer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to add answer';
    });
    builder.addCase(toggleLikeQuestion.fulfilled, (state, action) => {
      // Call the new reducer to refresh state
      qaSlice.caseReducers.updateQuestionVotes(state, action);
    });
    builder.addCase(incrementQuestionViews.fulfilled, (state, action) => {
      // Call the reducer to update views locally
      qaSlice.caseReducers.incrementQuestionViewsLocally(state, action);
    });
  },
});

// Export actions and reducer
export const { resetQAState, incrementQuestionViewsLocally, updateQuestionVotes } = qaSlice.actions;
export default qaSlice.reducer;
