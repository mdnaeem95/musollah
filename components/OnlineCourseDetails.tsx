import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { startCourse } from '../redux/slices/courseSlice';
import { AppDispatch, RootState } from '../redux/store/store';
import { getAuth } from 'firebase/auth';

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



const OnlineCourseDetails = ({ course, teacherName, teacherImage }: { course : OnlineCourseProps, teacherName: string, teacherImage: string }) => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const auth = getAuth();
    const user = useSelector((state: RootState) => state.dashboard.user)
    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            const enrolled = user.enrolledCourses.some((c: any) => c.courseId === course.id);
            setIsEnrolled(enrolled);
        }
    }, [user, course.id]);

    const handleStartLearning = () => {
        const user = auth.currentUser;

        if (user) {
            const userId = user.uid;
            dispatch(startCourse({ courseId: course.id, userId }));
        } else {
            console.error("No user is logged in.")
        }
    };

    return (
        <View style={{ backgroundColor: '#4D6561', flex: 1 }}>
            <View style={{ marginLeft: 16, marginTop: 20, marginBottom: 20 }}>
                <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 16, lineHeight: 22, color: '#FFFFFF' }}>{course.title}</Text>
            </View>

            <ScrollView style={{ marginHorizontal: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ alignContent: 'center', justifyContent: 'center' }}>
                        <Image source={{ uri: teacherImage }} style={{ width: 48, height: 48, backgroundColor: '#FFFFFF', borderRadius: 24 }} />
                    </View>
                    <View style={{ alignContent: 'center', justifyContent: 'center', gap: 5 }}>
                        <Text style={styles.subText}>Author</Text>
                        <Text style={styles.mainText}>{teacherName}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 16, gap: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <FontAwesome6 name="file" regular color='white' size={20} />
                        <Text style={styles.contentText}>{`${course.modules.length} Modules`}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <FontAwesome6 name="clock" regular color='white' size={20} />
                        <Text style={styles.contentText}>{`${course.modules.length} Hours estimated time to finish`}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 16, gap: 10 }}>
                    <Text style={styles.subText}>Description</Text>
                    <Text style={styles.contentText}>{course.description}</Text>
                </View>

                <View style={{ marginTop: 16, gap: 10 }}>
                    <Text style={styles.subText}>Modules</Text>
                    {course.modules.map((module, index) => (
                        <View key={index} style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, gap: 4 }}>
                            <Text style={[styles.subText, { color: '#000000' }]}>{`${index + 1}. ${module}`}</Text>
                            <Text style={[styles.contentText, { color: '#000000' }]}>1 hour</Text>
                        </View>
                    ))}
                </View>

                <View style={{ marginTop: 16 }}>
                    <TouchableOpacity 
                        style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, alignItems: 'center' }} 
                        onPress={handleStartLearning}
                        disabled={isEnrolled}
                    >
                        <Text style={styles.btnText}>{isEnrolled ? 'Enrolled' : 'Start Learning'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

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

export default OnlineCourseDetails