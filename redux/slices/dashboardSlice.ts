import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCoursesData, fetchTeachersData, fetchUserData } from '../../api/firebase';
import { CourseAndModuleProgress, CourseData, CourseStatus, DashboardState, ModuleData, UserData } from '../../utils/types';

const initialState: DashboardState = {
  user: { name: "Akhi", avatarUrl: 'https://via.placeholder.com/100', id: '', email: '', enrolledCourses: [] },
  courses: [],
  teachers: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Helper function to calculate course progress
const calculateCourseProgress = (course: CourseData, progress: CourseAndModuleProgress) => {
  const updatedModules = { ...progress.status.modules };

  // Calculate progress: Iterate through modules in `CourseData` and update statuses
  const allModulesCompleted = course.modules.every((module) => updatedModules[module.moduleId] === 'completed');

  return {
    ...progress,
    status: {
      courseStatus: allModulesCompleted ? 'completed' as CourseStatus : 'in progress' as CourseStatus,
      modules: updatedModules
    }
  };
}

// Helper function to update enrolled courses in state
const updateEnrolledCourses = (state: DashboardState, updatedProgress: CourseAndModuleProgress) => {
  const user = state.user;
  if (user) {
    const updatedEnrolledCourses = user.enrolledCourses.map((courseProgress) =>
      courseProgress.courseId === updatedProgress.courseId ? updatedProgress : courseProgress
    );

    state.user = { ...user, enrolledCourses: updatedEnrolledCourses };
  }
};

// Fetching for unauthenticated users
export const fetchCoursesAndTeachers = createAsyncThunk(
  'dashboard/fetchCoursesAndTeachers',
  async (_, { rejectWithValue }) => {
    try {
      const coursesData = await fetchCoursesData();
      const teachersData = await fetchTeachersData();

      return { coursesData, teachersData };
    } catch (error) {
      console.error('Failed to fetch courses and teachers', error);
      return rejectWithValue('Failed to fetch courses and teachers.')
    }
  }
)

// Fetching for authenticated users (user progress and course data)
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData', 
  async (userId: string, { rejectWithValue }) => {
  try {
      const userData: UserData = await fetchUserData(userId);

      if (!userData || !Array.isArray(userData.enrolledCourses)) {
        throw new Error("User data or enrolled courses not found");
      }

      const coursesData = await fetchCoursesData();
      const teachersData = await fetchTeachersData();
      
      // Map through the user's enrolled courses and calculate progress based on module status
      const updatedEnrolledCourses = userData.enrolledCourses.map((progress: CourseAndModuleProgress) => {
        const course = coursesData.find((course: CourseData) => course.id === progress.courseId);
        return course ? calculateCourseProgress(course, progress) : progress;
      });

      // Return both immutable course data and user's progress
      return { userData: { ...userData, enrolledCourses: updatedEnrolledCourses }, coursesData, teachersData };
  } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      return rejectWithValue('Failed to fetch locations');
  }
});

// Updating user’s enrolled courses progress in the dashboard
export const updateDashboardEnrolledCourses = createAsyncThunk(
  'dashboard/updateEnrolledCourses',
  async ({ courseId, userId, enrolledCourses }: { courseId: string, userId: string, enrolledCourses: CourseAndModuleProgress[] }) => {
    console.log('Dispatching updated enrolledCourses:', enrolledCourses)
    return { courseId, userId, enrolledCourses };
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesAndTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.coursesData;
        state.teachers = action.payload.teachersData;
      })
      .addCase(fetchCoursesAndTeachers.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDashboardEnrolledCourses.fulfilled, (state, action) => {
        const updatedCourseProgress = action.payload.enrolledCourses.find(
          (course) => course.courseId === action.payload.courseId
        );
        if (updatedCourseProgress) {
          updateEnrolledCourses(state, updatedCourseProgress);
        } else {
          console.error('No updated course found in the payload.');
        }
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
        state.error = action.payload as string || 'Failed to fetch dashboard data';
      });
  },
});

export default dashboardSlice.reducer;
