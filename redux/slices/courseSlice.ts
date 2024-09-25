import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { RootState } from '../store/store';
import { CoursesState, ModuleData, ModuleProgress } from '../../utils/types';

const initialState: CoursesState = {
  courses: [],
  loading: false,
  error: null,
};

export const updateDashboardEnrolledCourses = createAsyncThunk(
  'dashboard/updateEnrolledCourses',
  async ({ courseId, userId, enrolledCourses }: { courseId: string, userId: string, enrolledCourses: any[] }) => {
    return { courseId, userId, enrolledCourses };
  }
)

// Async thunk to start a course for a user
export const startCourse = createAsyncThunk('courses/startCourse', async ({ courseId, userId }: { courseId: string, userId: string }, { rejectWithValue, getState, dispatch }) => {
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

    const userRef = firestore().collection('users').doc(userId)
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      throw new Error('User not found.')
    }

    const userData = userSnapshot.data();

    const updatedEnrolledCourses = [
      ...(userData?.enrolledCourses || []),
      { courseId, status: 'in progress', modules: initialModulesProgress }
    ]

    await userRef.update({
      enrolledCourses: updatedEnrolledCourses
    })

    // update the dashboard after enrollment
    dispatch(updateDashboardEnrolledCourses({ courseId, userId, enrolledCourses: updatedEnrolledCourses }));    

    return { courseId, status: 'in progress' as 'in progress', modules: initialModulesProgress };
  } catch (error) {
    console.error('Failed to start course:', error);
    return rejectWithValue('Failed to start course');
  }
});

export const completeModule = createAsyncThunk(
  'courses/completeModule',
  async (
    { courseId, userId, moduleId }: { courseId: string; userId: string; moduleId: string },
    { rejectWithValue }
  ) => {
    try {
      // Firestore reference to the user document
      const userRef = firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const enrolledCourses = userData?.enrolledCourses || [];

      const courseProgress = enrolledCourses.find((course: any) => course.courseId === courseId);

      if (!courseProgress) {
        throw new Error('Course progress not found');
      }

      // Update the module status
      const updatedModules = courseProgress.modules.map((module: any, index: number) => {
        if (module.moduleId === moduleId) {
          return { ...module, status: 'completed' as 'completed' };
        } else if (courseProgress.modules[index - 1]?.moduleId === moduleId) {
          return { ...module, status: 'in progress' as 'in progress' };
        }
        return module;
      });

      // Check if all modules are completed
      const allModulesCompleted = updatedModules.every((module: any) => module.status === 'completed');
      const courseStatus: 'in progress' | 'completed' = allModulesCompleted ? 'completed' : 'in progress';

      // Update the user's enrolled courses with the updated module progress
      const updatedEnrolledCourses = enrolledCourses.map((course: any) =>
        course.courseId === courseId
          ? { ...course, status: courseStatus, modules: updatedModules }
          : course
      );

      // Update the user's enrolledCourses field in Firestore
      await userRef.update({ enrolledCourses: updatedEnrolledCourses });

      return { courseId, status: courseStatus, modules: updatedModules };
    } catch (error) {
      console.error('Failed to complete module:', error);
      return rejectWithValue('Failed to complete module');
    }
  }
);


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
