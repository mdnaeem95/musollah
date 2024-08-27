import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { startCourse } from '../redux/slices/courseSlice';
import { AppDispatch, RootState } from '../redux/store/store';
import { getAuth } from 'firebase/auth';
import { ContentData, CourseData, ModuleData } from '../redux/slices/dashboardSlice';

const OnlineCourseDetails = ({ course, teacherName, teacherImage }: { course : CourseData, teacherName: string, teacherImage: string }) => {
    const auth = getAuth();
    const router = useRouter();
    const user = useSelector((state: RootState) => state.dashboard.user)
    const userProgress = useSelector((state: RootState) => state.course.courses.find(c => c.courseId === course.id))
    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
    const dispatch = useDispatch<AppDispatch>();

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
            dispatch(startCourse({ courseId: course.id, userId })).then(() => {
                if (course.modules.length > 0) {
                    const firstModuleId = course.modules[0].moduleId;
                    router.push(`/education/courses/${course.id}/modules/${firstModuleId}`);
                }
            });
        } else {
            console.error("No user is logged in.")
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>{course.title}</Text>
            </View>

            <ScrollView style={{ marginHorizontal: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
                {/* AUTHOR INFORMATION */}
                <View style={styles.authorContainer}>
                    <View style={{ alignContent: 'center', justifyContent: 'center' }}>
                        <Image source={{ uri: teacherImage }} style={styles.authorAvatar} />
                    </View>
                    <View style={{ alignContent: 'center', justifyContent: 'center', gap: 5 }}>
                        <Text style={styles.subText}>Author</Text>
                        <Text style={styles.mainText}>{teacherName}</Text>
                    </View>
                </View>

                {/* NO OF MODULES AND ESTIMATED TIME */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <FontAwesome6 name="file" regular color='white' size={20} />
                        <Text style={styles.contentText}>{`${course.modules.length} Modules`}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <FontAwesome6 name="clock" regular color='white' size={20} />
                        <Text style={styles.contentText}>{`${course.modules.length} Hours estimated time to finish`}</Text>
                    </View>
                </View>

                {/* COURSE DESCRIPTION */}
                <View style={styles.section}>
                    <Text style={styles.subText}>Description</Text>
                    <Text style={styles.contentText}>{course.description}</Text>
                </View>

                {/* COURSE MODULES */}
                <View style={styles.section}>
                    <Text style={styles.subText}>Modules</Text>
                    {course.modules.map((module, index) => {
                        // Find the progress of the current module
                        const moduleProgress = userProgress?.modules.find((m) => m.moduleId === module.moduleId);
                        const isLocked = moduleProgress?.status === 'locked';

                        return (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.module, isLocked && styles.lockedModule]}
                                disabled={isLocked}
                            >
                                <Link href={`/courses/${course.id}/modules/${module.moduleId}`} asChild>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={[styles.subText, { color: '#000000' }]}>{`${index + 1}. ${module.title}`}</Text>
                                            <Text style={[styles.contentText, { color: '#000000' }]}>1 hour</Text>
                                        </View>
                                        <View>
                                            {isLocked && (
                                                <FontAwesome6 name="lock" size={20} color="#888" />
                                            )}
                                        </View>
                                    </View>
                                </Link>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                <View style={{ marginTop: 16 }}>
                    <TouchableOpacity 
                        style={styles.learningBtn} 
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
    container: {
        backgroundColor: '#4D6561', 
        flex: 1
    },
    section: {
        marginTop: 16,
        gap: 10
    },
    header: {
        marginLeft: 16, 
        marginTop: 20, 
        marginBottom: 20
    },
    headerText: {
        fontFamily: 'Outfit_600SemiBold', 
        fontSize: 16, 
        lineHeight: 22, 
        color: '#FFFFFF'
    },
    authorContainer: {
        flexDirection: 'row', 
        gap: 10
    },
    authorAvatar: {
        width: 48, 
        height: 48, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 24
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
    },
    module: {
        width: '100%', 
        backgroundColor: '#FFFFFF', 
        borderRadius: 10, 
        padding: 10, 
        gap: 4
    },
    lockedModule: {
        backgroundColor: '#CCCCCC',  // Greyed-out background for locked modules
    },
    learningBtn: {
        width: '100%', 
        backgroundColor: '#FFFFFF', 
        borderRadius: 10, 
        padding: 20, 
        alignItems: 'center'
    }
})

export default OnlineCourseDetails