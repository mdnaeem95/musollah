import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useLayoutEffect } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { RootState } from '../../../../redux/store/store';
import { useSelector } from 'react-redux';
import OnlineCourseDetails from '../../../../components/OnlineCourseDetails';
import PhysicalCourseDetails from '../../../../components/PhysicalCourseDetails';
import { CourseData, TeacherData } from '../../../../redux/slices/dashboardSlice';

type Params = {
  id: string;
}

const CourseDetails = () => {
  const { id } = useLocalSearchParams<Params>();
  const course: CourseData = useSelector((state: RootState) => 
    state.dashboard.courses.find((course) => course.id === id)
  )
  const teacher: TeacherData = useSelector((state: RootState) => (
    state.dashboard.teachers.find((teacher) => teacher.id === course.teacherId)
  ))

  const { name: teacherName, imagePath: teacherImage } = teacher;
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    if (course) {
      navigation.setOptions({ title: "" });
    }
  }, [navigation, course?.title]);

  if (!course) {
    return (
      <View>
        <Text>Course not Found</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#4D6561', flex: 1 }}>
        <View style={{ width: '100%', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" color='white' size={24} />
          </TouchableOpacity>
        </View>

        {course.type === 'online' ? (
          <OnlineCourseDetails course={course} teacherName={teacherName} teacherImage={teacherImage} />
        ): (
          <></>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
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
})

export default CourseDetails;
