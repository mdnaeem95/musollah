// Refactored Education Dashboard Screen with High & Medium priority improvements

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ScrollView,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import {
  fetchCoursesAndTeachers,
  fetchDashboardData,
  resetDashboardState,
} from '../../../../redux/slices/dashboardSlice';
import { useTheme } from '../../../../context/ThemeContext';
import CourseCardShort from '../../../../components/education/CourseCardShort';
import { MotiView } from 'moti';
import { useAuth } from '../../../../context/AuthContext';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const useShouldFetchDashboard = (lastFetched: number | null) => {
  return useCallback(() => {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > CACHE_DURATION;
  }, [lastFetched]);
};

const TeacherCard = React.memo(({ teacher }: { teacher: any }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 100, type: 'timing' }}
      style={styles.teacherCardShadow}
    >
      <TouchableOpacity
        style={[styles.teacherCard, { backgroundColor: theme.colors.secondary }]}
        onPress={() => router.push(`/teachers/${teacher.id}`)}
      >
        <Image source={{ uri: teacher.imagePath }} style={styles.teacherImage} />
        <View style={styles.textContentContainer}>
          <Text style={[styles.courseHeaderText, { color: theme.colors.text.primary }]}> {teacher.name} </Text>
          <Text style={[styles.courseCategoryText, { color: theme.colors.text.muted }]}> {teacher.expertise} </Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
});

const ProgressBarWithLabel = ({ progress }: { progress: number }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      <Progress.Bar progress={progress} height={10} color={theme.colors.accent} />
      <Text style={[styles.progressCourseTitle, { color: theme.colors.text.primary }]}> {Math.round(progress * 100)}% </Text>
    </View>
  );
};

const Dashboard = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isUnauthenticatedDataFetched, setIsUnauthenticatedDataFetched] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { user: userData, courses, teachers, loading, lastFetched } = useSelector(
    (state: RootState) => state.dashboard
  );

  const shouldFetchData = useShouldFetchDashboard(lastFetched);

  const inProgressCourses = useMemo(() => userData?.enrolledCourses?.filter(
    (course) => course.status.courseStatus !== 'completed') || [],
  [userData?.enrolledCourses]);

  useEffect(() => {
    if (!user && userData?.id) {
      dispatch(resetDashboardState());
    }
  }, [user, userData?.id, dispatch]);

  useEffect(() => {
    if (!isUnauthenticatedDataFetched && shouldFetchData()) {
      dispatch(fetchCoursesAndTeachers()).unwrap();
      setIsUnauthenticatedDataFetched(true);
    }
  }, [dispatch, shouldFetchData, isUnauthenticatedDataFetched]);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid && shouldFetchData()) {
        dispatch(fetchDashboardData(user.uid));
      }
    }, [dispatch, shouldFetchData, user?.uid])
  );

  const handleRefresh = async () => {
    if (loading) return;
    setRefreshing(true);
    try {
      await dispatch(fetchCoursesAndTeachers()).unwrap();
      if (userData?.id) await dispatch(fetchDashboardData(userData.id)).unwrap();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator color={theme.colors.text.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={[styles.greetingText, { color: theme.colors.text.primary }]}>Salam, {userData?.name || 'Guest'}</Text>
      </MotiView>

      {inProgressCourses.length > 0 && (
        <View>
          <Text style={[styles.progressHeader, { color: theme.colors.text.primary }]}>In Progress</Text>
          <FlatList
            horizontal
            data={inProgressCourses}
            keyExtractor={(item) => item.courseId}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const courseData = courses.find((c) => c.id === item.courseId);
              if (!courseData) return null;
              const progress =
                Object.values(item.status.modules).filter((s) => s === 'completed').length /
                Object.keys(item.status.modules).length;
              return (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: index * 100, type: 'timing' }}
                >
                  <TouchableOpacity
                    style={[styles.progressCard, { backgroundColor: theme.colors.secondary }]}
                    onPress={() => router.push(`/courses/${item.courseId}`)}
                  >
                    <Text style={[styles.progressCourseTitle, { color: theme.colors.text.primary }]}> {courseData.title} </Text>
                    <ProgressBarWithLabel progress={progress} />
                  </TouchableOpacity>
                </MotiView>
              );
            }}
          />
        </View>
      )}

      <View>
        <Text style={[styles.coursesHeader, { color: theme.colors.text.primary }]}>Courses</Text>
        {courses.length === 0 ? (
          <Text style={{ color: theme.colors.text.muted }}>No courses available at the moment.</Text>
        ) : (
          <FlatList
            horizontal
            data={courses}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 75, type: 'timing' }}
              >
                <CourseCardShort {...item} />
              </MotiView>
            )}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      <View>
        <Text style={[styles.coursesHeader, { color: theme.colors.text.primary }]}>Teachers</Text>
        {teachers.length === 0 ? (
          <Text style={{ color: theme.colors.text.muted }}>No teachers available yet.</Text>
        ) : (
          <FlatList
            horizontal
            data={teachers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TeacherCard teacher={item} />}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      padding: 16,
    },
    greetingText: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 22,
      marginBottom: 10,
    },
    progressHeader: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 18,
      marginBottom: 10,
    },
    progressCard: {
      gap: 10,
      borderRadius: 20,
      padding: 20,
      marginRight: 20,
      marginVertical: 10,
      width: 220,
      elevation: Platform.OS === 'android' ? 2.5 : 1,
    },
    progressCourseTitle: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      lineHeight: 18,
    },
    coursesHeader: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 18,
      lineHeight: 22,
      marginVertical: 10,
    },
    courseHeaderText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 14,
      lineHeight: 20,
    },
    courseCategoryText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      lineHeight: 17,
    },
    teacherCard: {
      borderRadius: 10,
      padding: 10,
      marginRight: 20,
      height: 250,
      width: 160,
      marginLeft: 3,
      marginBottom: 3,
    },
    teacherCardShadow: {
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: Platform.OS === 'android' ? 0 : 3,
    },
    teacherImage: {
      width: '100%',
      height: 140,
      borderRadius: 10,
      marginBottom: 10,
    },
    textContentContainer: {
      gap: 5,
    },
  });

export default Dashboard;