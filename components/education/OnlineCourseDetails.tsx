import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import React, { useState } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { startCourse } from '../../redux/slices/courseSlice';
import { AppDispatch, RootState, store } from '../../redux/store/store';
import { getAuth } from '@react-native-firebase/auth';
import { CourseAndModuleProgress, CourseData, ModuleData } from '../../utils/types';
import SignInModal from '../SignInModal';
import { useTheme } from '../../context/ThemeContext';
import { MotiView } from 'moti';

const OnlineCourseDetails = ({
  course,
  teacherName,
  teacherImage,
}: {
  course: CourseData;
  teacherName: string;
  teacherImage: string;
}) => {
  const auth = getAuth();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.dashboard.user);

  const { theme } = useTheme();

  const userProgress: CourseAndModuleProgress | undefined =
    user?.enrolledCourses.find(
      (enrolledCourse: CourseAndModuleProgress) => enrolledCourse.courseId === course.id,
    );

  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();

  const handleStartLearning = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Authentication Required', 'You need to sign in or create an account to start this course.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => setIsAuthModalVisible(true) },
      ]);
      return;
    }

    if (currentUser && !isEnrolling) {
      setIsEnrolling(true);
      const userId = currentUser.uid;

      try {
        await dispatch(startCourse({ courseId: course.id, userId })).unwrap();

        setTimeout(() => {
          const updatedCourses = store.getState().dashboard.courses;
          const enrolledCourse = updatedCourses.find((c: CourseData) => c.id === course.id);

          if (enrolledCourse && enrolledCourse.modules.length > 0) {
            const firstModuleId = enrolledCourse.modules[0].moduleId;
            router.push(`/courses/${enrolledCourse.id}/modules/${firstModuleId}`);
          } else {
            console.error('Course not found in the state after enrollment');
          }
        }, 500);
      } catch (error) {
        console.error('Failed to start course:', error);
      } finally {
        setIsEnrolling(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>      
      <ScrollView contentContainerStyle={{ gap: 5, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={[styles.authorContainer, { backgroundColor: theme.colors.secondary }]}
        >
          <Image source={{ uri: teacherImage }} style={styles.authorAvatar} />
          <View style={{ marginLeft: 10, justifyContent: 'center' }}>
            <Text style={[styles.subText, { color: theme.colors.text.secondary }]}>Author</Text>
            <Text style={[styles.mainText, { color: theme.colors.text.primary }]}>{teacherName}</Text>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 150 }}
          style={styles.section}
        >
          <Text style={[styles.subText, { color: theme.colors.text.secondary }]}>Description</Text>
          <Text style={[styles.contentText, { color: theme.colors.text.muted }]}>{course.description}</Text>
        </MotiView>

        <View style={styles.section}>
          <Text style={[styles.subText, { color: theme.colors.text.secondary }]}>Modules</Text>
          {course.modules.map((module: ModuleData, index: number) => {
            const moduleProgress = userProgress?.status.modules[module.moduleId];
            const isLocked = !userProgress || moduleProgress === 'locked';

            return (
              <MotiView
                key={index}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 100 }}
              >
                <TouchableOpacity
                  style={[
                    styles.module,
                    { backgroundColor: isLocked ? theme.colors.text.muted : theme.colors.secondary },
                  ]}
                  disabled={isLocked}
                  onPress={() => router.push(`/courses/${course.id}/modules/${module.moduleId}`)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={[styles.subText, { color: isLocked ? "#000" : theme.colors.text.primary }]}>                      
                        {`${index + 1}. ${module.title}`}
                      </Text>
                      <Text style={[styles.contentText, { color: isLocked ? "#000" : theme.colors.text.secondary }]}>1 hour</Text>
                    </View>
                    {isLocked && <FontAwesome6 name="lock" size={20} color={theme.colors.text.muted} />}
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </View>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 250 }}
        >
          <TouchableOpacity
            style={[
              styles.learningBtn,
              {
                backgroundColor: userProgress ? theme.colors.accent : theme.colors.text.success,
              },
            ]}
            onPress={handleStartLearning}
            disabled={!!userProgress || isEnrolling}
          >
            <Text style={[styles.btnText, { color: theme.colors.text.primary }]}>              
              {isEnrolling ? 'Enrolling...' : userProgress ? 'Enrolled' : 'Start Learning'}
            </Text>
          </TouchableOpacity>
        </MotiView>

        <SignInModal isVisible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  section: {
    marginTop: 16,
    gap: 10,
  },
  authorContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  authorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  subText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
  mainText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
  },
  contentText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
  btnText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
  module: {
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    margin: 2
  },
  learningBtn: {
    margin: 2,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
});

export default OnlineCourseDetails;