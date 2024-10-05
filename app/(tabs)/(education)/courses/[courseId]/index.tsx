import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useLayoutEffect } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { RootState } from '../../../../../redux/store/store';
import { useSelector } from 'react-redux';
import OnlineCourseDetails from '../../../../../components/OnlineCourseDetails';
import PhysicalCourseDetails from '../../../../../components/PhysicalCourseDetails';
import { SafeAreaView } from 'react-native-safe-area-context';

type Params = {
  courseId: string;
}

const CourseDetails = () => {
  const { courseId } = useLocalSearchParams<Params>();
  const navigation = useNavigation();
  const router = useRouter();

  const { course, teacher } = useSelector((state: RootState) => {
    const course = state.dashboard.courses.find(c => c.id === courseId);
    const teacher = course ? state.dashboard.teachers.find(t => t.id === course.teacherId) : null;
    return { course, teacher };
  });

  if (!course || !teacher) {
    return (
      <View style={styles.notFound}>
        <Text>{!course ? "Course not Found" : "Teacher not Found"}</Text>
      </View>
    );
  }

  const { name: teacherName, imagePath: teacherImage } = teacher;

  useLayoutEffect(() => {
    if (course) {
      navigation.setOptions({ title: "" });
    }
  }, [navigation, course?.title]);

  return (
    <SafeAreaView style={styles.mainContainer}>
        {course.type === 'online' ? (
          <OnlineCourseDetails course={course} teacherName={teacherName} teacherImage={teacherImage} />
        ): (
          <></>
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#4D6561',
  },
  backButtonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16
  },
  subText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF'
  },
   mainText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    lineHeight: 21,
    color: '#FFFFFF'
  },
  contentText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF'
  },
  btnText: {
    fontFamily: 'Outfit_500Medium', 
    fontSize: 16,
    lineHeight: 22,
    color: '#000000'
  }
});

export default CourseDetails;
