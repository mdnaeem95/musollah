import { View, Text, StyleSheet } from 'react-native';
import React, { useLayoutEffect } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { RootState } from '../../../../../redux/store/store';
import { useSelector } from 'react-redux';
import OnlineCourseDetails from '../../../../../components/OnlineCourseDetails';
import PhysicalCourseDetails from '../../../../../components/PhysicalCourseDetails';

type Params = {
  courseId: string;
}

const CourseDetails = () => {
  const { courseId } = useLocalSearchParams<Params>();
  const navigation = useNavigation();

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
      navigation.setOptions({ headerTitle: course?.title });
    }
  }, [navigation, course?.title]);

  return (
    <View style={styles.mainContainer}>
        {course.type === 'online' ? (
          <OnlineCourseDetails course={course} teacherName={teacherName} teacherImage={teacherImage} />
        ): (
          <></>
        )}
    </View>
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
    backgroundColor: '#4D6561',
  },
});

export default CourseDetails;
