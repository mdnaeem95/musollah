import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { RootState } from '../store/store';
import { CoursesState, ModuleData } from '../../utils/types';
import { fetchDashboardData, updateDashboardEnrolledCourses } from './dashboardSlice';

const initialState: CoursesState = {
  courses: [],
  loading: false,
  error: null,
};

// Async thunk to start a course for a user
export const startCourse = createAsyncThunk('courses/startCourse', async ({ courseId, userId }: { courseId: string, userId: string }, { rejectWithValue, getState, dispatch }) => {
  try {
    const state = getState() as RootState;
    const course = state.dashboard.courses.find((course) => course.id === courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    // Initialize module progress directly in the course's modules
    const updatedModules: ModuleData[] = course.modules.map((module: ModuleData, index: number) => ({
      ...module,
      status: index === 0 ? 'in progress' : 'locked',  // First module in progress, rest are locked
    }));

    const userRef = firestore().collection('users').doc(userId)
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      throw new Error('User not found.')
    }

    const userData = userSnapshot.data();

    const updatedEnrolledCourses = [
      ...(userData?.enrolledCourses || []),
      { 
        ...course,
        status: 'in progress',
        modules: updatedModules
      }
    ]

    await userRef.update({
      enrolledCourses: updatedEnrolledCourses
    })

    // update the dashboard after enrollment
    dispatch(updateDashboardEnrolledCourses({ courseId, userId, enrolledCourses: updatedEnrolledCourses }));    

    return { courseId, status: 'in progress' as 'in progress', modules: updatedModules };
  } catch (error) {
    console.error('Failed to start course:', error);
    return rejectWithValue('Failed to start course');
  }
});

export const completeModule = createAsyncThunk(
  'courses/completeModule',
  async (
    { courseId, userId, moduleId }: { courseId: string; userId: string; moduleId: string },
    { rejectWithValue, dispatch }
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

      const courseProgress = enrolledCourses.find((course: any) => course.id === courseId);

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
        course.id === courseId
          ? { ...course, status: courseStatus, modules: updatedModules }
          : course
      );

      // Update the user's enrolledCourses field in Firestore
      await userRef.update({ enrolledCourses: updatedEnrolledCourses });

      // Dispatch to update dashboard after completing the module
      dispatch(updateDashboardEnrolledCourses({ courseId, userId, enrolledCourses: updatedEnrolledCourses }));

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
        const { courseId, status, modules } = action.payload;

        // Find the index of course that was enrolled
        const courseIndex = state.courses.findIndex((course) => course.id === courseId);

        if (courseIndex !== -1) {
          // update existing course's status anmd modules in redux state
          state.courses[courseIndex].status = status
          state.courses[courseIndex].modules = modules
        } else {
          // Alert the user or log that the course was not found
          console.error(`Course with ID ${courseId} not found in the state.`);
          // Optionally, we could dispatch an action or show an alert in the UI
          alert(`Course with ID ${courseId} not found in the state.`);
        }
      })
      .addCase(startCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start course';
      })
      .addCase(completeModule.fulfilled, (state, action) => {
        state.loading = false;
        const course = state.courses.find(c => c.id === action.payload.courseId);
        if (course) {
          course.status = action.payload.status;
          course.modules = action.payload.modules;
        }
      })
  },
});

export default coursesSlice.reducer;
