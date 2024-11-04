// File: redux/slices/qaSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { Question, Answer, Vote, Comment } from '../../utils/types';

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
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || null,
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
        createdAt: answerData?.createdAt?.toDate(),
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
  },
});

// Export actions and reducer
export const { resetQAState } = qaSlice.actions;
export default qaSlice.reducer;
