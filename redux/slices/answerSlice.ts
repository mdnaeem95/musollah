import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Answer } from '../../utils/types';
import { addAnswer, fetchAnswers } from '../../api/firebase/index';
import { RootState } from '../store/store';

interface AnswersState {
  entities: { [questionId: string]: { ids: string[]; entities: { [id: string]: Answer } } };
  loading: boolean;
  error: string | null;
}

const initialState: AnswersState = {
  entities: {},
  loading: false,
  error: null,
};

const handleAsyncError = (error: any): string => {
  return error?.message || 'An unexpected error occurred.';
};

export const selectAnswersByQuestionId = (state: RootState, questionId: string) => {
  const { entities } = state.answers;
  return entities[questionId]?.ids.map((id) => entities[questionId].entities[id]) || [];
};

// Thunks
export const fetchAnswersFromFirebase = createAsyncThunk<Answer[], string, { rejectValue: string }>(
  'answers/fetchAnswers',
  async (questionId, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { answers: AnswersState };
      if (state.answers.entities[questionId]) {
        // Prevent fetching if answers already exist
        return [];
      }
      return await fetchAnswers(questionId);
    } catch (error) {
      console.error('Error fetching answers:', error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const addNewAnswer = createAsyncThunk<
  Answer,
  { questionId: string; newAnswer: Partial<Answer> },
  { rejectValue: string }
>(
  'answers/addAnswer',
  async ({ questionId, newAnswer }, { rejectWithValue }) => {
    try {
      return await addAnswer(questionId, newAnswer);
    } catch (error) {
      console.error('Error adding answer:', error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

// Slice
const answersSlice = createSlice({
  name: 'answers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnswersFromFirebase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnswersFromFirebase.fulfilled, (state, action) => {
        state.loading = false;
        const questionId = action.meta.arg;
        const answers = action.payload;

        if (!state.entities[questionId]) {
          state.entities[questionId] = { ids: [], entities: {} };
        }

        answers.forEach((answer) => {
          state.entities[questionId].ids.push(answer.id);
          state.entities[questionId].entities[answer.id] = answer;
        });
      })
      .addCase(fetchAnswersFromFirebase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch answers';
      })
      .addCase(addNewAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewAnswer.fulfilled, (state, action) => {
        state.loading = false;
        const questionId = action.meta.arg.questionId;
        const answer = action.payload;

        if (!state.entities[questionId]) {
          state.entities[questionId] = { ids: [], entities: {} };
        }

        state.entities[questionId].ids.push(answer.id);
        state.entities[questionId].entities[answer.id] = answer;
      })
      .addCase(addNewAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add answer';
      });
  },
});

export default answersSlice.reducer;
