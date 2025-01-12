import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { fetchCoursesAndTeachers, fetchDashboardData } from '../../../../redux/slices/dashboardSlice';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useTheme } from '../../../../context/ThemeContext';
import CourseCardShort from '../../../../components/education/CourseCardShort';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const Dashboard = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme)

  const auth = getAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isUnauthenticatedDataFetched, setIsUnauthenticatedDataFetched] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const { user, courses, teachers, loading, lastFetched } = useSelector(
    (state: RootState) => state.dashboard
  );

  const inProgressCourses =
    user?.enrolledCourses?.filter(
      (course) => course.status.courseStatus !== 'completed'
    ) || [];

  const MemoizedCourseCardShort = memo(CourseCardShort);

  const MemoizedTeacherCard = memo(({ teacher }: { teacher: any }) => (
    <TouchableOpacity
      style={[styles.teacherCard, { backgroundColor: theme.colors.secondary }]}
      onPress={() => router.push(`/teachers/${teacher.id}`)}
    >
      <View style={styles.teacherContentContainer}>
        <Image source={{ uri: teacher.imagePath }} style={styles.teacherImage} />
        <View style={styles.textContentContainer}>
          <Text style={[styles.courseHeaderText, { color: theme.colors.text.primary }]}>
            {teacher.name}
          </Text>
          <Text style={[styles.courseCategoryText, { color: theme.colors.text.muted }]}>
            {teacher.expertise}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ));

  const handleRefresh = async () => {
    if (loading) return;
    setRefreshing(true);
    try {
      await dispatch(fetchCoursesAndTeachers()).unwrap();
      if (user) {
        await dispatch(fetchDashboardData(user.id)).unwrap();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  };

  const shouldFetchData = useCallback(() => {
    if (!lastFetched) return true;
    const currentTime = Date.now();
    return currentTime - lastFetched > CACHE_DURATION;
  }, [lastFetched]);

  useEffect(() => {
    if (!isUnauthenticatedDataFetched && shouldFetchData()) {
      dispatch(fetchCoursesAndTeachers()).unwrap();
      setIsUnauthenticatedDataFetched(true);
    }
  }, [dispatch, shouldFetchData, isUnauthenticatedDataFetched]);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, (user: any) => {
        if (user && shouldFetchData()) {
          dispatch(fetchDashboardData(user.uid));
        }
      });
      return () => unsubscribe();
    }, [dispatch, shouldFetchData])
  );

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
      contentContainerStyle={{ paddingBottom: 250 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.greetingText, { color: theme.colors.text.primary }]}>
          Salam, {user?.name}
        </Text>
      </View>

      <View style={styles.section}>
        {inProgressCourses.length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.progressHeader, { color: theme.colors.text.primary }]}>
                In Progress
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {inProgressCourses.map((course, index) => {
                const courseData = courses.find((c) => c.id === course.courseId);

                if (!courseData) return null;

                const progress =
                  Object.values(course.status.modules).filter(
                    (status) => status === 'completed'
                  ).length / Object.keys(course.status.modules).length;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.progressCard,
                      { backgroundColor: theme.colors.secondary },
                    ]}
                    onPress={() => router.push(`/courses/${course.courseId}`)}
                  >
                    <Text style={[styles.progressCourseTitle, { color: theme.colors.text.primary }]}>
                      {courseData.title}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                      <Progress.Bar
                        progress={progress}
                        height={10}
                        color={theme.colors.accent}
                      />
                      <Text style={[styles.progressCourseTitle, { color: theme.colors.text.primary }]}>
                        {Math.round(progress * 100)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View>
          <Text style={[styles.coursesHeader, { color: theme.colors.text.primary }]}>
            Courses
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {courses.map((course) => (
              <MemoizedCourseCardShort key={course.id} {...course} />
            ))}
          </ScrollView>
        </View>

        <View>
          <Text style={[styles.coursesHeader, { color: theme.colors.text.primary, marginBottom: 10 }]}>
            Teachers
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {teachers.map((teacher) => (
              <MemoizedTeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
    mainContainer: {
      flex: 1,
      padding: 16,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    greetingText: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 22,
    },
    progressHeader: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 18,
      lineHeight: 22,
      marginBottom: 16,
    },
    section: {
      marginVertical: 20,
      gap: 16,
    },
    seeMoreText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 14,
      lineHeight: 17,
    },
    progressCard: {
      gap: 10,
      borderRadius: 20,
      padding: 20,
      marginRight: 20,
      width: 220,
      ...theme.shadows.default,
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
      ...theme.shadows.default,
    },
    teacherImage: {
      width: '100%',
      height: 140,
      borderRadius: 10,
      marginBottom: 10,
    },
    teacherContentContainer: {
      alignContent: 'center',
      justifyContent: 'center',
    },
    textContentContainer: {
      gap: 5,
      marginTop: 5,
    },
  });  

export default Dashboard;
