import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchCoursesData, fetchTeachersData, fetchUserData } from '../../api/firebase';
import {
  CourseAndModuleProgress,
  CourseData,
  CourseStatus,
  DashboardState,
  ModuleStatus,
  UserData,
} from '../../utils/types';

const initialState: DashboardState = {
  user: {
    name: 'Akhi',
    avatarUrl: 'https://via.placeholder.com/100',
    id: '',
    email: '',
    enrolledCourses: [],
    role: 'user',
    likedQuestions: [],
  },
  courses: [],
  teachers: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// 🔧 Helper: Calculate course status based on modules
const calculateCourseProgress = (course: CourseData, progress: CourseAndModuleProgress) => {
  const updatedModules = { ...progress.status.modules };
  const allModulesCompleted = course.modules.every(
    (module) => updatedModules[module.moduleId] === 'completed'
  );

  return {
    ...progress,
    status: {
      courseStatus: allModulesCompleted ? ('completed' as CourseStatus) : ('in progress' as CourseStatus),
      modules: updatedModules,
    },
  };
};

// 🔧 Helper: Replace existing course progress
const updateEnrolledCourses = (
  enrolled: CourseAndModuleProgress[],
  updated: CourseAndModuleProgress
): CourseAndModuleProgress[] =>
  enrolled.map((courseProgress) =>
    courseProgress.courseId === updated.courseId ? updated : courseProgress
  );

// 🌐 Unauthenticated fetch
export const fetchCoursesAndTeachers = createAsyncThunk(
  'dashboard/fetchCoursesAndTeachers',
  async (_, { rejectWithValue }) => {
    try {
      const coursesData = await fetchCoursesData();
      const teachersData = await fetchTeachersData();
      return { coursesData, teachersData };
    } catch (error) {
      console.error('Failed to fetch courses and teachers', error);
      return rejectWithValue('Failed to fetch courses and teachers.');
    }
  }
);

// 🌐 Authenticated fetch
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (userId: string, { rejectWithValue }) => {
    try {
      const userData: UserData = await fetchUserData(userId);
      if (!userData || !Array.isArray(userData.enrolledCourses)) {
        throw new Error('User data or enrolled courses not found');
      }

      const coursesData = await fetchCoursesData();
      const teachersData = await fetchTeachersData();

      const updatedEnrolledCourses = userData.enrolledCourses.map((progress) => {
        const course = coursesData.find((course) => course.id === progress.courseId);
        return course ? calculateCourseProgress(course, progress) : progress;
      });

      return {
        userData: { ...userData, enrolledCourses: updatedEnrolledCourses },
        coursesData,
        teachersData,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      return rejectWithValue('Failed to fetch dashboard data');
    }
  }
);

// 🔄 Sync user course progress after Firestore update
export const updateDashboardEnrolledCourses = createAsyncThunk(
  'dashboard/updateEnrolledCourses',
  async ({
    courseId,
    userId,
    enrolledCourses,
  }: {
    courseId: string;
    userId: string;
    enrolledCourses: CourseAndModuleProgress[];
  }) => {
    return { courseId, userId, enrolledCourses };
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // 🆕 Clear all dashboard state (on logout)
    resetDashboardState: () => initialState,

    // 🆕 Optimistic local update
    markModuleAsCompleteLocally: (
      state,
      action: PayloadAction<{ courseId: string; moduleId: string }>
    ) => {
      const { courseId, moduleId } = action.payload;
      const courseProgress = state.user!.enrolledCourses.find(
        (c) => c.courseId === courseId
      );
      const courseMeta = state.courses.find((c) => c.id === courseId);

      if (!courseProgress || !courseMeta) return;

      // Mark module complete
      courseProgress.status.modules[moduleId] = 'completed';

      // Recalculate overall course status
      const allCompleted = courseMeta.modules.every(
        (mod) => courseProgress.status.modules[mod.moduleId] === 'completed'
      );
      courseProgress.status.courseStatus = allCompleted ? ('completed' as CourseStatus) : ('in progress' as CourseStatus);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCoursesAndTeachers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCoursesAndTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.coursesData;
        state.teachers = action.payload.teachersData;
      })
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.userData;
        state.courses = action.payload.coursesData;
        state.teachers = action.payload.teachersData;
        state.lastFetched = Date.now();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to fetch dashboard data';
      })
      .addCase(updateDashboardEnrolledCourses.fulfilled, (state, action) => {
        const updated = action.payload.enrolledCourses.find(
          (c) => c.courseId === action.payload.courseId
        );
        if (updated) {
          state.user!.enrolledCourses = updateEnrolledCourses(
            state.user!.enrolledCourses,
            updated
          );
        } else {
          console.error('No updated course found in the payload.');
        }
      });
  },
});

export const {
  resetDashboardState,
  markModuleAsCompleteLocally,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;