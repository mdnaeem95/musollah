import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { CourseAndModuleProgress, CourseData } from '../../../../utils/types';
import { ThemeContext } from '../../../../context/ThemeContext';

const Profile = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const user = useSelector((state: RootState) => state.dashboard.user); // Fetch user data from Redux state
  const courses = useSelector((state: RootState) => state.dashboard.courses); // Fetch all courses

  // Filter out completed courses using `CourseAndModuleProgress`
  const completedCourses = user?.enrolledCourses.filter(
    (course: CourseAndModuleProgress) => course.status.courseStatus === 'completed'
  ) || [];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: activeTheme.colors.primary }]}>
      {/* User Information */}
      <View style={[styles.profileHeader, { backgroundColor: activeTheme.colors.secondary, shadowColor: activeTheme.colors.text.muted }]}>
        <Image source={{ uri: user?.avatarUrl }} style={styles.profileImage} />
        <Text style={[styles.profileName, { color: activeTheme.colors.text.primary }]}>{user?.name}</Text>
        <Text style={[styles.profileEmail, { color: activeTheme.colors.text.muted }]}>{user?.email}</Text>
      </View>

      {/* Completed Courses */}
      <View style={[styles.section, { backgroundColor: activeTheme.colors.secondary }]}>
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>Completed Courses</Text>
        {completedCourses.length > 0 ? (
          completedCourses.map((progress: CourseAndModuleProgress, index: number) => {
            // Find the course data based on the `courseId` in the user's progress
            const courseData = courses.find((c: CourseData) => c.id === progress.courseId);

            if (!courseData) return null;

            return (
              <View key={index} style={[styles.courseProgress, { backgroundColor: activeTheme.colors.accent }]}>
                <Text style={[styles.courseTitle, { color: activeTheme.colors.text.primary }]}>{courseData.title}</Text>
                <Text style={[styles.courseType, { color: activeTheme.colors.text.secondary }]}>
                  {courseData.type === 'online' ? 'Online Course' : 'Physical Course'}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={[styles.noCoursesText, { color: activeTheme.colors.text.muted }]}>No completed courses yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    height: '100%',
    width: '100%',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#CCCCCC',
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
  },
  profileEmail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
  },
  courseProgress: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  courseType: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
  noCoursesText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default Profile;