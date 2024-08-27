import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect } from 'react'

import { FontAwesome6 } from '@expo/vector-icons'
import * as Progress from 'react-native-progress'
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { fetchDashboardData } from '../../../../redux/slices/dashboardSlice';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const Dashboard = () => {
    const auth = getAuth();
    const dispatch = useDispatch<AppDispatch>();
    const { user, courses, progress, teachers, loading, error } = useSelector((state: RootState) => state.dashboard);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    dispatch(fetchDashboardData(user.uid));      
                }
            })
            return () => unsubscribe();
        }, [dispatch])
    )

    if (loading || !user) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator />
            </View>
        )
    }

    const handleCourseProgressClick = (courseId: string) => {
        const course = courses.find((c) => c.id === courseId);
        const userProgress = progress.find((p) => p.id === courseId);

        if (course && userProgress) {
            const totalModules = course.modules.length;
            const completedModules = Math.floor((userProgress.progress) / 100)
            const currentModuleIndex = completedModules >= totalModules ? totalModules - 1 : completedModules

            router.push(`/education/courses/modules/${course.modules[currentModuleIndex]}`);
        }
    }

    return (
        <View style={styles.mainContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.greetingText}>Salam, {user.name}</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity>
                        <FontAwesome6 name="bell" size={24} regular />
                    </TouchableOpacity>
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarContainer}/>
                </View>
            </View>

            <View style={styles.section}>
                {progress.length > 0 && (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.progressHeader}>In Progress</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {progress.map((course, index) => (
                                <TouchableOpacity key={index} style={styles.progressCard} onPress={() => handleCourseProgressClick(course.id)}>
                                    <View style={styles.progressCardContent}>
                                        <Text style={styles.progressCourseTitle}>{course.title}</Text>
                                        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                            <TouchableOpacity style={{ width: 25, height: 25, borderRadius: 12.5, backgroundColor: 'rgba(63, 52, 131, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                                <FontAwesome6 name="user" color="purple" />
                                            </TouchableOpacity>
                                            <Text>{course.teacherId}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <View>
                                                <Progress.Bar 
                                                    progress={course.progress / 100}
                                                    height={7}
                                                    color="#4D6561" 
                                                />
                                            </View>
                                            <Text>{course.progress}%</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        </View>
                )}

                <ScrollView contentContainerStyle={{ paddingBottom: 250 }} showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.coursesHeader}>Courses</Text>
                        <TouchableOpacity style={{ paddingRight: 16 }} onPress={() => router.push('/courses')}>
                            <Text style={[styles.seeMoreText, { color: '#FFFFFF' }]}>See More</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {courses.map((course) => (
                                <TouchableOpacity style={styles.courseCard} key={course.id}>
                                    <Link href={{
                                        pathname: '/courses/[courseId]',
                                        params: { courseId: `${course.id}` }
                                    }} >
                                        <View style={styles.courseContentContainer}>
                                            <View style={{ width: 185, height: 98,  backgroundColor: `${course.backgroundColour}`, alignItems: 'center', justifyContent: 'center' }}>
                                                <FontAwesome6 name={course.icon} size={54} />
                                            </View>

                                            <View style={styles.textContentContainer}>
                                                <Text style={styles.courseCategoryText}>{course.category}</Text>
                                                <Text style={styles.courseHeaderText}>{course.title}</Text>
                                            </View>
                                        </View>
                                    </Link>
                                </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.coursesHeader, { marginTop: 20 }]}>Teachers</Text>
                        <TouchableOpacity style={{ paddingRight: 16 }} onPress={() => router.push('/teachers')}>
                            <Text style={[styles.seeMoreText, { color: '#FFFFFF' }]}>See More</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {teachers.map((teacher) => (
                            <TouchableOpacity style={styles.teacherCard} key={teacher.id} onPress={() => router.push(`teachers/${teacher.id}`)}>
                                <View style={styles.teacherContentContainer}>
                                    <Image source={{ uri: teacher.imagePath }} style={styles.teacherImage} alt={`Azatizah ${teacher.name}`} />        
                                    <View style={styles.textContentContainer}>
                                        <Text style={styles.courseHeaderText}>{teacher.name}</Text>
                                        <Text style={styles.courseCategoryText}>{teacher.expertise}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#4D6561'
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16
    },
    greetingText: {
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        fontSize: 20,
        lineHeight: 28
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    avatarContainer: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#B9B9B9'
    },
    progressHeader: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 18,
        lineHeight: 22,
        color: '#FFFFFF',
        marginBottom: 16
    },
    section: {
        marginVertical: 20,
        gap: 22,
        paddingLeft: 16
    },
    seeMoreText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        lineHeight: 17,
        color: '#FFFFFF'
    },
    progressCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginRight: 20
    },
    progressCourseTitle: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        lineHeight: 18,
        color: '#000000'
    },
    progressCardContent: {
        gap: 11
    },
    coursesHeader: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 18,
        lineHeight: 22,
        color: '#FFFFFF',
        marginBottom: 16
    },
    courseCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 10,
        marginRight: 20,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    courseContentContainer: {
        width: '90%'
    },
    textContentContainer: {
        gap: 10,
        marginTop: 10
    },
    courseCategoryText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        lineHeight: 17
    },
    courseHeaderText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 14,
        lineHeight: 20
    },
    teacherCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 10,
        marginRight: 20,
        height: 250,
        width: 160,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    teacherImage: {
        width: '100%',
        height: 140,
        borderRadius: 10,
        marginBottom: 10,
      },
    teacherContentContainer: {
        alignContent: 'center',
        justifyContent: 'center'
    }

})

export default Dashboard