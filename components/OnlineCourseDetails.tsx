import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { startCourse } from '../redux/slices/courseSlice';
import { AppDispatch, RootState, store } from '../redux/store/store';
import { getAuth } from '@react-native-firebase/auth';
import { CourseData, ModuleData } from '../utils/types';
import SignInModal from './SignInModal';
import PrayerHeader from './PrayerHeader';

const OnlineCourseDetails = ({ course, teacherName, teacherImage }: { course: CourseData, teacherName: string, teacherImage: string }) => {
  const auth = getAuth();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.dashboard.user);
  const userProgress = useSelector((state: RootState) => user?.enrolledCourses.find((enrolledCourse: CourseData) => enrolledCourse.id === course.id));
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const currentUser = auth.currentUser

    if (user && currentUser) {
      const enrolled = user.enrolledCourses.some((c: any) => c.id === course.id);
      setIsEnrolled(enrolled);
    }
  }, [user, course.id]);

  const handleStartLearning = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert(
        'Authentication Required',
        'You need to sign in or create an account to start this course.',
        [
          { text: "Cancel", style: 'cancel'},
          { text: "Sign In", onPress: () => setIsAuthModalVisible(true)},
        ]
      );
      return
    }

    if (currentUser && !isEnrolling) {
        setIsEnrolling(true);
        const userId = currentUser.uid;

        try {
            await dispatch(startCourse({ courseId: course.id, userId })).unwrap();

      // Add a small delay
      setTimeout(() => {
        // Log the updated Redux state
        const updatedCourses = store.getState().dashboard.courses;
        console.log('Updated courses in Redux:', updatedCourses);

        // Navigate if course is present in Redux state
        const enrolledCourse = updatedCourses.find((c: any) => c.id === course.id);
        if (enrolledCourse && enrolledCourse.modules.length > 0) {
          const firstModuleId = enrolledCourse.modules[0].moduleId;
          router.push(`/courses/${enrolledCourse.id}/modules/${firstModuleId}`);
        } else {
          console.error('Course not found in the state after enrollment');
        }
      }, 500); // Adjust the delay if needed
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
      <PrayerHeader title={course.title} backgroundColor='#4D6561'/>

      <ScrollView style={{ marginHorizontal: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Author Information */}
        <View style={styles.authorContainer}>
          <Image source={{ uri: teacherImage }} style={styles.authorAvatar} />
          <View style={{ marginLeft: 10, justifyContent: 'center' }}>
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
            const moduleProgress = userProgress?.modules.find((m: ModuleData) => m.moduleId === module.moduleId);
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
        {!isEnrolled && (
          <View style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={styles.learningBtn}
            onPress={handleStartLearning}
            disabled={isEnrolled || isEnrolling}
            >
            <Text style={styles.btnText}>{isEnrolling ? 'Enrolling...' : isEnrolled ? 'Enrolled' : 'Start Learning'}</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Sign In Modal */}
        <SignInModal
          isVisible={isAuthModalVisible}
          onClose={() => setIsAuthModalVisible(false)}
        />
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
    gap: 5,
    marginTop: 16,
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
