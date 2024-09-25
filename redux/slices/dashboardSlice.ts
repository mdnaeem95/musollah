import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCoursesData, fetchTeachersData, fetchUserData } from '../../api/firebase';
import { CourseData, DashboardState, ModuleData } from '../../utils/types';

const initialState: DashboardState = {
  user: { name: "Akhi", avatarUrl: 'https://via.placeholder.com/100', id: '', email: '', enrolledCourses: [] },
  courses: [],
  teachers: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchDashboardData = createAsyncThunk('dashboard/fetchDashboardData', async (userId: string, { rejectWithValue }) => {
try {
    const userData = await fetchUserData(userId);

    if (!userData || !Array.isArray(userData.enrolledCourses)) {
      throw new Error("User data or enrolled courses not found");
    }

    const coursesData = await fetchCoursesData();
    const teachersData = await fetchTeachersData();
    
    // Map through enrolled courses and calculate progress based on module status
    const updatedCoursesData = coursesData.map((course: CourseData) => {
      const enrolledCourse = userData.enrolledCourses.find((enrolled: any) => enrolled.courseId === course.id);

      if (enrolledCourse) {
        const completedModules = course.modules.filter((module: ModuleData) => module.status === 'completed').length;
        const totalModules = course.modules.length;

        return {
          ...course,
          status: completedModules === totalModules ? 'completed' : 'in progress', // Update course status
          modules: course.modules, // Use the enrolled course modules with progress info
        }
      }

      return course;
    })

    return { userData, coursesData: updatedCoursesData, teachersData };
} catch (error) {
    console.error('Failed to fetch dashboard data', error);
    return rejectWithValue('Failed to fetch locations');
}
});

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
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.userData;
        state.courses = action.payload.coursesData;
        state.teachers = action.payload.teachersData;
        state.lastFetched = Date.now();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard data';
      });
  },
});

export default dashboardSlice.reducer;
