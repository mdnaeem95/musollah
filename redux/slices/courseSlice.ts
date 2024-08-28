import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ModuleData } from './dashboardSlice';

interface ModuleProgress {
  moduleId: string;
  status: 'locked' | 'in progress' | 'completed'
}

interface CourseProgress {
  courseId: string;
  status: 'unenrolled' | 'in progress' | 'completed'
  modules: ModuleProgress[];
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
export const startCourse = createAsyncThunk('courses/startCourse', async ({ courseId, userId }: { courseId: string, userId: string }, { rejectWithValue, getState }) => {
  try {
    const state = getState() as RootState;
    const course = state.dashboard.courses.find((course) => course.id === courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    const initialModulesProgress: ModuleProgress[] = course.modules.map((module: ModuleData, index: number) => ({
      moduleId: module.moduleId,
      status: (index === 0 ? 'in progress' : 'locked') as 'in progress' | 'locked', // First module is in progress, others are locked
    }));
    const userRef = doc(db, 'users', userId);

    // Update user's enrolled courses
    await updateDoc(userRef, {
      enrolledCourses: arrayUnion({ courseId, status: 'in progress' as 'in progress', modules: initialModulesProgress }),
    });

    return { courseId, status: 'in progress' as 'in progress', modules: initialModulesProgress };
  } catch (error) {
    console.error('Failed to start course:', error);
    return rejectWithValue('Failed to start course');
  }
});

export const completeModule = createAsyncThunk('courses/completeModule', async ({ courseId, userId, moduleId }: { courseId: string, userId: string, moduleId: string}, { rejectWithValue, getState }) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const enrolledCourses = userData?.enrolledCourses || [];

    const courseProgress = enrolledCourses.find((course: any) => course.courseId === courseId);

    if (!courseProgress) {
      throw new Error('Course progress not found');
    }

    const updatedModules = courseProgress.modules.map((module: any, index: number) => {
      if (module.moduleId === moduleId) {
        return { ...module, status: 'completed' as 'completed' };
      } else if (courseProgress.modules[index - 1]?.moduleId === moduleId) {
        return { ...module, status: 'in progress' as 'in progress' };
      }
      return module;
    });

    // If all modules are completed, mark the course as completed
    const allModulesCompleted = updatedModules.every((module: any) => module.status === 'completed');
    const courseStatus: 'in progress' | 'completed' = allModulesCompleted ? 'completed' : 'in progress';

    const updatedEnrolledCourses = enrolledCourses.map((course: any) =>
      course.courseId === courseId
        ? { ...course, status: courseStatus, modules: updatedModules }
        : course
    );

    await updateDoc(userRef, { enrolledCourses: updatedEnrolledCourses });

    return { courseId, status: courseStatus, modules: updatedModules };
  } catch (error) {
    console.error('Failed to complete module:', error);
    return rejectWithValue('Failed to complete module')
  }
})

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
      })
      .addCase(completeModule.fulfilled, (state, action) => {
        state.loading = false;
        const course = state.courses.find(c => c.courseId === action.payload.courseId);
        if (course) {
          course.status = action.payload.status;
          course.modules = action.payload.modules;
        }
      })
  },
});

export default coursesSlice.reducer;
