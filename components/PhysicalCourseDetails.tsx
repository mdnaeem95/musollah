import { View, Text } from 'react-native'
import React from 'react'

interface OnlineCourseProps {
    id: string,
    backgroundColour: string;
    category: string;
    description: string;
    icon: string;
    teacherId: string;
    title: string;
    modules: string[];
    type: string;
}

const PhysicalCourseDetails = ({ course }: { course : OnlineCourseProps }) => {
  return (
    <View>
      <Text>{course.type}</Text>
    </View>
  )
}

export default PhysicalCourseDetails