import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native'
import React, { memo, useCallback, useEffect, useState } from 'react'
import * as Progress from 'react-native-progress'
import { useFocusEffect, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { fetchCoursesAndTeachers, fetchDashboardData } from '../../../../redux/slices/dashboardSlice';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import CourseCardShort from '../../../../components/CourseCardShort';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const Dashboard = () => {
    const auth = getAuth();
    const router = useRouter();
    const [isUnauthenticatedDataFetched, setIsUnauthenticatedDataFetched] = useState<boolean>(false);
    const dispatch = useDispatch<AppDispatch>();
    const { user, courses, teachers, loading, lastFetched } = useSelector((state: RootState) => state.dashboard);
    const inProgressCourses = user?.enrolledCourses?.filter((course: any) => course.status !== 'completed') || [];

    // Memoized CourseCardShort component
    const MemoizedCourseCardShort = memo(CourseCardShort);

    // Memoized TeacherCard component
    const MemoizedTeacherCard = memo(({ teacher }: { teacher: any }) => (
    <TouchableOpacity style={styles.teacherCard} onPress={() => router.push(`/teachers/${teacher.id}`)}>
        <View style={styles.teacherContentContainer}>
            <Image source={{ uri: teacher.imagePath }} style={styles.teacherImage} />
            <View style={styles.textContentContainer}>
            <Text style={styles.courseHeaderText}>{teacher.name}</Text>
            <Text style={styles.courseCategoryText}>{teacher.expertise}</Text>
            </View>
        </View>
    </TouchableOpacity>
    ));

    // Function to determine if we should refetch the data
    const shouldFetchData = useCallback(() => {
        if (!lastFetched) return true;  // No data fetched yet
        const currentTime = Date.now();
        return currentTime - lastFetched > CACHE_DURATION;  // If cache duration expired, refetch
    }, [lastFetched]);
    
    useEffect(() => {
        // fetch courses and teachers once
        if (!isUnauthenticatedDataFetched && shouldFetchData()) {
            dispatch(fetchCoursesAndTeachers()).unwrap();
            setIsUnauthenticatedDataFetched(true)
        }
    }, [dispatch, shouldFetchData, isUnauthenticatedDataFetched])

    useFocusEffect(
        useCallback(() => {
            // If user is authenticated, fetch user-specific progress
            const unsubscribe = onAuthStateChanged(auth, (user: any) => {
                if (user && shouldFetchData()) {
                    dispatch(fetchDashboardData(user.uid));      
                }
            })
            return () => unsubscribe();
        }, [dispatch, shouldFetchData])
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
        
        if (!course || !course.modules) {
            console.error('Course or modules not found.');
            return;
        }

        // Get the user's progress for this course from the enrolledCourses in the user's collection
        const userProgress = user?.enrolledCourses.find((p: any) => p.id === courseId);

        if (!userProgress) {
            console.error(`Progress for course ID ${courseId} not found.`);
            return;
        }

        const totalModules = course.modules.length;

        // Find the first module that is either in progress or not started yet
        const currentModule = userProgress.modules.find(
            (module: any) => module.status === 'in progress' || module.status === 'locked'
        ) || userProgress.modules[totalModules - 1]; // Fallback to the last module if everything is completed
        
        if (currentModule) {
            router.push(`/courses/${courseId}/modules/${currentModule.moduleId}`);
        } else {
            console.error('No current module found.');
        }
    }

    return (
        <View style={styles.mainContainer}>
            {/* Header Section - Name */}
            <View style={styles.headerContainer}>
                <Text style={styles.greetingText}>Salam, {user.name}</Text>
                <View style={styles.headerRight}>
                    {/* <TouchableOpacity>
                        <FontAwesome6 name="bell" size={24} regular />
                    </TouchableOpacity>
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarContainer}/> */}
                </View>
            </View>

            {/* Progress Section - if any */}
            <View style={styles.section}>
                {inProgressCourses.length > 0 && (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.progressHeader}>In Progress</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {user.enrolledCourses
                            .filter((course: any) => course.status !== 'completed')
                            .map((course: any, index: number) => {
                                const courseData = courses.find((c) => c.id === course.id); // Find the course details
                                const progress = course.modules.filter((m: any) => m.status === 'completed').length / course.modules.length;
                                return (
                                    <TouchableOpacity key={index} style={styles.progressCard} onPress={() => handleCourseProgressClick(course.id)}>
                                        <View style={styles.progressCardContent}>
                                            <Text style={styles.progressCourseTitle}>{courseData?.title || 'Course Title'}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                <View>
                                                    <Progress.Bar 
                                                        progress={progress}
                                                        height={7}
                                                        color="#4D6561" 
                                                        />
                                                </View>
                                                <Text>{progress * 100}%</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>
                        </View>
                )}

                {/* Courses Section */}
                <ScrollView contentContainerStyle={{ paddingBottom: 250 }} showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.coursesHeader}>Courses</Text>
                        <TouchableOpacity style={{ paddingRight: 16 }} onPress={() => router.push('/courses')}>
                            <Text style={[styles.seeMoreText, { color: '#FFFFFF' }]}>See More</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {courses.map((course) => (
                            <MemoizedCourseCardShort
                                key={course.id}
                                id={course.id}
                                title={course.title}
                                description={course.description}
                                category={course.category}
                                icon={course.icon}
                                backgroundColour={course.backgroundColour} 
                            />
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
                            <MemoizedTeacherCard key={teacher.id} teacher={teacher} />
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
        paddingVertical: 20,
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
        gap: 5,
        marginTop: 5
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