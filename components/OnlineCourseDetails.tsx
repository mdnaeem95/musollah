import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { startCourse } from '../redux/slices/courseSlice';
import { AppDispatch, RootState } from '../redux/store/store';
import { getAuth } from '@react-native-firebase/auth';
import { CourseData } from '../utils/types';
import { fetchDashboardData } from '../redux/slices/dashboardSlice';

const OnlineCourseDetails = ({ course, teacherName, teacherImage }: { course: CourseData, teacherName: string, teacherImage: string }) => {
  const auth = getAuth();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.dashboard.user);
  const userProgress = useSelector((state: RootState) => state.course.courses.find(c => c.id === course.id));
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (user) {
      const enrolled = user.enrolledCourses.some((c: any) => c.courseId === course.id);
      setIsEnrolled(enrolled);
    }
  }, [user, course.id]);

  const handleStartLearning = async () => {
    const currentUser = auth.currentUser;

    if (currentUser && !isEnrolling) {
        setIsEnrolling(true);
        const userId = currentUser.uid;

        try {
            await dispatch(startCourse({ courseId: course.id, userId })).unwrap();

            if (course.modules.length > 0) {
                const firstModuleId = course.modules[0].moduleId;
                router.push(`/courses/${course.id}/modules/${firstModuleId}`);
            }
        } catch (error) {
            console.error('Failed to start course:', error);
        } finally {
            setIsEnrolling(false);
        }
    } else {
        console.error("No user is logged in.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{course.title}</Text>
      </View>

      <ScrollView style={{ marginHorizontal: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Author Information */}
        <View style={styles.authorContainer}>
          <Image source={{ uri: teacherImage }} style={styles.authorAvatar} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.subText}>Author</Text>
            <Text style={styles.mainText}>{teacherName}</Text>
          </View>
        </View>

        {/* Course Details */}
        <View style={styles.section}>
          <Text style={styles.subText}>Description</Text>
          <Text style={styles.contentText}>{course.description}</Text>
        </View>

        {/* Modules */}
        <View style={styles.section}>
          <Text style={styles.subText}>Modules</Text>
          {course.modules.map((module, index) => {
            const moduleProgress = userProgress?.modules.find((m) => m.moduleId === module.moduleId);
            const isLocked = !isEnrolled || moduleProgress?.status === 'locked';

            return (
              <TouchableOpacity
                key={index}
                style={[styles.module, isLocked && styles.lockedModule]}
                disabled={isLocked} // Disable locked modules
                onPress={() => router.push(`/courses/${course.id}/modules/${module.moduleId}`)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={[styles.subText, { color: '#000000' }]}>{`${index + 1}. ${module.title}`}</Text>
                    <Text style={[styles.contentText, { color: '#000000' }]}>1 hour</Text>
                  </View>
                  <View>
                    {isLocked && <FontAwesome6 name="lock" size={20} color="#888" />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Start Learning Button */}
        <View style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={styles.learningBtn}
            onPress={handleStartLearning}
            disabled={isEnrolled || isEnrolling}
          >
            <Text style={styles.btnText}>{isEnrolling ? 'Enrolling...' : isEnrolled ? 'Enrolled' : 'Start Learning'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4D6561',
    flex: 1,
  },
  section: {
    marginTop: 16,
    gap: 10,
  },
  header: {
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  headerText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  authorContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  subText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  mainText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    lineHeight: 21,
    color: '#FFFFFF',
  },
  contentText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  btnText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
  },
  module: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  lockedModule: {
    backgroundColor: '#CCCCCC', // Greyed-out background for locked modules
  },
  learningBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
});

export default OnlineCourseDetails;
