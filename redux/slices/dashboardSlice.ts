import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { fetchCoursesData, fetchTeachersData, fetchUserData } from '../../api/firebase';

export interface CourseProgressData {
  id: string;
  title: string;
  progress: number;
}

export interface CourseData {
    id: string,
    backgroundColour: string;
    category: string;
    description: string;
    icon: string;
    teacherId: string;
    title: string;
    modules: ModuleData[];
    type: string;
}

export interface ModuleData {
  moduleId: string;
  title: string;
  content: ContentData[];
}

export interface ContentData {
  contentId: string;
  title: string;
  type: string;
  data: string;
}

export interface TeacherData {
  id: string;
  expertise: string;
  name: string;
  imagePath: string;
  background: string;
  courses: string[];
}

export interface UserData {
    id: string;
    avatarUrl: string;
    email: string;
    enrolledCourses: string[],
    name: string
}

interface DashboardState {
  user: any;
  courses: any[]
  progress: any[];
  teachers: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  user: { name: "Akhi", avatarUrl: 'https://via.placeholder.com/100', id: '', email: '', enrolledCourses: [] },
  courses: [],
  progress: [],
  teachers: [],
  loading: false,
  error: null,
};

export const fetchDashboardData = createAsyncThunk('dashboard/fetchDashboardData', async (userId: string, { rejectWithValue }) => {
try {
    const userData = await fetchUserData(userId);

    if (!userData || !Array.isArray(userData.enrolledCourses)) {
      throw new Error("User data or enrolled courses not found");
    }

    const coursesData = await fetchCoursesData();
    const teachersData = await fetchTeachersData();
    
    const progress = userData.enrolledCourses.map((course: any) => {
        const courseData = coursesData.find((c: CourseData) => c.id === course.courseId)
        return {
          id: course.courseId ?? '',  // Ensure safe access
          title: courseData?.title ?? 'Untitled',
          progress: course?.progress ?? 0,
        }
    }) || [];
    
    console.log('User Data', userData)

    return { userData, coursesData, teachersData, progress };
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
        state.progress = action.payload.progress;
        state.teachers = action.payload.teachersData;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard data';
      });
  },
});

export default dashboardSlice.reducer;
