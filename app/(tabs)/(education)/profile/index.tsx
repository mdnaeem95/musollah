import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { CourseAndModuleProgress, CourseData } from '../../../../utils/types';

const Profile = () => {
  const user = useSelector((state: RootState) => state.dashboard.user); // Fetch user data from Redux state
  const courses = useSelector((state: RootState) => state.dashboard.courses); // Fetch all courses

  // Filter out completed courses using `CourseAndModuleProgress`
  const completedCourses = user?.enrolledCourses.filter((course: CourseAndModuleProgress) => course.status.courseStatus === 'completed') || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* User Information */}
      <View style={styles.profileHeader}>
        <Image source={{ uri: user?.avatarUrl }} style={styles.profileImage} />
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      {/* Completed Courses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed Courses</Text>
        {completedCourses.length > 0 ? (
          completedCourses.map((progress: CourseAndModuleProgress, index: number) => {
            // Find the course data based on the `courseId` in the user's progress
            const courseData = courses.find((c: CourseData) => c.id === progress.courseId);

            if (!courseData) return null;

            return (
              <View key={index} style={styles.courseProgress}>
                <Text style={styles.courseTitle}>{courseData.title}</Text>
                <Text style={styles.courseType}>{courseData.type === 'online' ? 'Online Course' : 'Physical Course'}</Text>
                
                {/* Show details for physical courses */}
                {courseData.type === 'physical' && (
                  <View>
                    {/* <Text style={styles.physicalCourseDetail}>Location: {courseData.location}</Text>
                    <Text style={styles.physicalCourseDetail}>Schedule: {courseData.schedule}</Text> */}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.noCoursesText}>No completed courses yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#9CC2BC',
    height: '100%',
    width: '100%'
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#ccc', // Fallback for missing images
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold'
  },
  profileEmail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#888',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
  },
  courseProgress: {
    marginBottom: 15,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  courseType: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  physicalCourseDetail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#666',
  },
  noCoursesText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default Profile;
