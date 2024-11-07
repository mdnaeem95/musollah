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
    backgroundColor: '#2E3D3A',
    height: '100%',
    width: '100%'
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
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
    color: '#2E3D3A',
  },
  profileEmail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#777',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
    color: '#2E3D3A',
  },
  courseProgress: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#333',
  },
  courseType: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#666',
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
