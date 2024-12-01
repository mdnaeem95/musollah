import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Question } from '../../utils/types';
import { fetchQuestions, addQuestion, toggleLikeQuestionInBackend, incrementQuestionViewsInBackend } from '../../api/firebase/index';

interface QuestionsState {
  ids: string[];
  entities: { [id: string]: Question };
  loading: boolean;
  error: string | null;
}

const initialState: QuestionsState = {
  ids: [],
  entities: {},
  loading: false,
  error: null,
};

const handleAsyncError = (error: any): string => {
    return error?.message || 'An unexpected error occurred.';
};
  
// Thunks
export const fetchQuestionsFromFirebase = createAsyncThunk<Question[], void, { rejectValue: string }>(
  'questions/fetchQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const questions = await fetchQuestions();
      return questions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const toggleLikeQuestion = createAsyncThunk<
  { questionId: string; newVotes: number },
  { questionId: string; isLiked: boolean },
  { rejectValue: string }
>(
  'questions/toggleLikeQuestion',
  async ({ questionId, isLiked }, { rejectWithValue }) => {
    try {
      const result = await toggleLikeQuestionInBackend(questionId, isLiked);
      return { questionId, newVotes: result.newVotes };
    } catch (error) {
      return rejectWithValue('Failed to toggle like');
    }
  }
);

export const incrementQuestionViews = createAsyncThunk<
  { questionId: string; newViews: number },
  { questionId: string },
  { rejectValue: string }
>(
  'questions/incrementViews',
  async ({ questionId }, { rejectWithValue }) => {
    try {
      const newViews = await incrementQuestionViewsInBackend(questionId);
      return { questionId, newViews };
    } catch (error) {
      return rejectWithValue('Failed to increment views');
    }
  }
);

export const addNewQuestion = createAsyncThunk<Question, Partial<Question>, { rejectValue: string }>(
  'questions/addQuestion',
  async (newQuestion, { rejectWithValue }) => {
    try {
      const question = await addQuestion(newQuestion);
      return question;
    } catch (error) {
      console.error('Error adding question:', error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

// Slice
const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    updateQuestionVotes: (state, action: PayloadAction<{ questionId: string; votes: number }>) => {
      const { questionId, votes } = action.payload;
      if (state.entities[questionId]) {
        state.entities[questionId].votes = votes;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestionsFromFirebase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionsFromFirebase.fulfilled, (state, action: PayloadAction<Question[]>) => {
        state.loading = false;
        action.payload.forEach((question) => {
          state.ids.push(question.id);
          state.entities[question.id] = question;
        });
      })
      .addCase(fetchQuestionsFromFirebase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch questions';
      })
      .addCase(addNewQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewQuestion.fulfilled, (state, action: PayloadAction<Question>) => {
        state.loading = false;
        const question = action.payload;
        state.ids.unshift(question.id);
        state.entities[question.id] = question;
      })
      .addCase(addNewQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add question';
      })
      .addCase(toggleLikeQuestion.fulfilled, (state, action) => {
        const { questionId, newVotes } = action.payload;
        if (state.entities[questionId]) {
          state.entities[questionId].votes = newVotes;
        }
      })
      .addCase(incrementQuestionViews.fulfilled, (state, action) => {
        const { questionId, newViews } = action.payload;
        if (state.entities[questionId]) {
          state.entities[questionId].views = newViews;
        }
      });
  },
});

export const { updateQuestionVotes } = questionsSlice.actions;
export default questionsSlice.reducer;
