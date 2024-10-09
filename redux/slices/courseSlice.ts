import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { RootState } from '../store/store';
import { CourseAndModuleProgress, CourseData, CoursesState, CourseStatus, ModuleData, ModuleStatus } from '../../utils/types';
import { updateDashboardEnrolledCourses } from './dashboardSlice';

const initialState: CoursesState = {
  courses: [],
  loading: false,
  error: null,
};

// Helper function to fetch course from Firestore
const fetchCourseFromFirestore = async (courseId: string): Promise<CourseData> => {
  const courseDoc = await firestore().collection('courses').doc(courseId).get();
  if (!courseDoc.exists) {
    throw new Error('Course not found in Firestore.');
  }

  const courseData = courseDoc.data();
  if (!courseData) {
    throw new Error('Course data not found.')
  }

  return {
    id: courseDoc.id,
    backgroundColour: courseData.backgroundColour,
    category: courseData.category,
    description: courseData.description,
    icon: courseData.icon,
    teacherId: courseData.teacherId,
    title: courseData.title,
    modules: courseData.modules as ModuleData[],  // Ensure modules are typed correctly
    type: courseData.type,
  };
}

// Helper function to update user courses
const updateUserProgressInFirestore = async (userId: string, updatedProgress: CourseAndModuleProgress[]) => {
  const userRef = firestore().collection('users').doc(userId);
  await userRef.update({ enrolledCourses: updatedProgress })
}

// Helper function to fetch user's enrolled courses
const fetchUserEnrolledCourses = async (userId: string): Promise<CourseAndModuleProgress[]> => {
  const userRef = firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  return userDoc.data()?.enrolledCourses || [];
}

// Helper function to update module progress
const updateModuleProgress = (progress: CourseAndModuleProgress, moduleId: string): CourseAndModuleProgress => {
  const updatedModules = {
    ...progress.status.modules,
    [moduleId]: 'completed' as ModuleStatus, // Marking the module as completed
  };

  // Check to see if all modules are completed
  const allModulesCompleted = Object.values(updatedModules).every(status => status === 'completed');

  return {
    ...progress,
    status: {
      ...progress.status,
      courseStatus: allModulesCompleted ? 'completed' : 'in progress',
      modules: updatedModules
    }
  }
};

// Enroll user in a course
export const startCourse = createAsyncThunk(
  'courses/startCourse',
  async ({ courseId, userId }: { courseId: string; userId: string }, { rejectWithValue, getState, dispatch }) => {
    try {      
      const state = getState() as RootState;
      let course = state.dashboard.courses.find((course: CourseData) => course.id === courseId);

      if (!course) {
        course = await fetchCourseFromFirestore(courseId);
      }

      // Fetch user progress from Firestore
      const enrolledCourses = await fetchUserEnrolledCourses(userId);

      // Check if user is already enrolled
      const isAlreadyEnrolled = enrolledCourses.some((progress) => progress.courseId === courseId)
      if (isAlreadyEnrolled) {
        return rejectWithValue('User is already enrolled in this course.');
      }

      // Set initial progress for the new course
      const initialProgress: CourseAndModuleProgress = {
        courseId,
        status: {
          courseStatus: 'in progress',
          modules: course.modules.reduce((acc, module, index) => {
            acc[module.moduleId] = index === 0 ? 'in progress' : 'locked';
            return acc;
          }, {} as { [key: string]: ModuleStatus })
        }
      }

      // Dispatch to update dashboard enrolled courses
      const updatedEnrolledCourses = [...enrolledCourses, initialProgress];
      await updateUserProgressInFirestore(userId, updatedEnrolledCourses);

      // Dispatch action to update dashboard
      await dispatch(updateDashboardEnrolledCourses({ courseId, userId, enrolledCourses: updatedEnrolledCourses }));

      return { courseId, status: initialProgress.status };
    } catch (error) {
      console.error('Failed to start course:', error);
      return rejectWithValue('Failed to start course');
    }
  }
);

// Mark a module a completed
export const completeModule = createAsyncThunk(
  'courses/completeModule',
  async (
    { courseId, userId, moduleId }: { courseId: string; userId: string; moduleId: string },
    { rejectWithValue, getState, dispatch }
  ) => {
    try {
      // Fetch user progress from Firestore
      const enrolledCourses = await fetchUserEnrolledCourses(userId);
      const courseProgress = enrolledCourses.find((progress) => progress.courseId === courseId);

      if (!courseProgress) {
        throw new Error('Course progress not found');
      }

      // Update the module status
      const updatedProgress = updateModuleProgress(courseProgress, moduleId)

      // Update the user's enrolled courses with the updated module progress
      const updatedEnrolledCourses = enrolledCourses.map((progress) =>
        progress.courseId === courseId ? updatedProgress : progress
      )

      // Save updated progress to Firestore
      await updateUserProgressInFirestore(userId, updatedEnrolledCourses);

      // Dispatch to update dashboard after completing the module
      await dispatch(updateDashboardEnrolledCourses({ courseId, userId, enrolledCourses: updatedEnrolledCourses }));

      return { courseId, status: updatedProgress.status };
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
      })        
      .addCase(startCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start course';
      })
      .addCase(completeModule.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeModule.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(completeModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export default coursesSlice.reducer;
