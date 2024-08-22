import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface CourseProgress {
  courseId: string;
  progress: number;
}

interface CoursesState {
  courses: CourseProgress[];
  loading: boolean;
  error: string | null;
}

const initialState: CoursesState = {
  courses: [],
  loading: false,
  error: null,
};

// Async thunk to start a course for a user
export const startCourse = createAsyncThunk('courses/startCourse', async ({ courseId, userId }: { courseId: string, userId: string }, { rejectWithValue }) => {
  try {// Replace with the logic to get current user ID
    const userRef = doc(db, 'users', userId);

    // Update user's enrolled courses
    await updateDoc(userRef, {
      enrolledCourses: arrayUnion({ courseId, progress: 0 }),
    });

    return { courseId, progress: 0 };
  } catch (error) {
    console.error('Failed to start course:', error);
    return rejectWithValue('Failed to start course');
  }
});

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(startCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses.push(action.payload);
      })
      .addCase(startCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start course';
      });
  },
});

export default coursesSlice.reducer;
