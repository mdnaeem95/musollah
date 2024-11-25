import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import React, { memo, useCallback, useEffect, useState } from 'react'
import * as Progress from 'react-native-progress'
import { useFocusEffect, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { fetchCoursesAndTeachers, fetchDashboardData } from '../../../../redux/slices/dashboardSlice';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import CourseCardShort from '../../../../components/CourseCardShort';
import { CourseAndModuleProgress, CourseData, ModuleStatus } from '../../../../utils/types';
import { SafeAreaView } from 'react-native-safe-area-context';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const Dashboard = () => {
    const auth = getAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [isUnauthenticatedDataFetched, setIsUnauthenticatedDataFetched] = useState<boolean>(false);
    const dispatch = useDispatch<AppDispatch>();
    const { user, courses, teachers, loading, lastFetched } = useSelector((state: RootState) => state.dashboard);

    // Filter in-progress courses based on 'CourseAndModuleProgress' status
    const inProgressCourses = user?.enrolledCourses?.filter((course: CourseAndModuleProgress) => course.status.courseStatus !== 'completed') || [];

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

    const handleRefresh = async () => {
        if (loading) return;
        setRefreshing(true);
        try {
            await dispatch(fetchCoursesAndTeachers()).unwrap();
            if (user) {
                await dispatch(fetchDashboardData(user.id)).unwrap();
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setTimeout(() => {
                setRefreshing(false);
            }, 500);
        }
    }

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

    if (loading && !refreshing) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator />
            </View>
        )
    }

    const handleCourseProgressClick = (courseId: string) => {
        const course = courses.find((c: CourseData) => c.id === courseId);
        
        if (!course || !course.modules) {
            console.error('Course or modules not found.');
            return;
        }

        // Get the user's progress for this course from the enrolledCourses in the user's collection
        const userProgress = user?.enrolledCourses.find((p: CourseAndModuleProgress) => p.courseId === courseId);

        if (!userProgress) {
            console.error(`Progress for course ID ${courseId} not found.`);
            return;
        }

        const totalModules = course.modules.length;

        // Find the first module that is either in progress or not started yet
        const currentModule = Object.entries(userProgress.status.modules).find(
            (([moduleId, status]: [string, ModuleStatus]) => status === 'in progress' || status === 'locked') || [course.modules[totalModules - 1].moduleId, 'locked']
        )
        
        if (currentModule) {
            router.push(`/courses/${courseId}/modules/${currentModule[0]}`);
        } else {
            console.error('No current module found.');
        }
    }

    return (
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={styles.mainContainer}
            contentContainerStyle={{ paddingBottom: 250 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
        >
            {/* Header Section - Name */}
            <View style={styles.headerContainer}>
                <Text style={styles.greetingText}>Salam, {user?.name}</Text>
            </View>

            {/* Progress Section - if any */}
            <View style={styles.section}>
                {inProgressCourses.length > 0 && (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.progressHeader}>In Progress</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {user?.enrolledCourses
                            .filter((course: CourseAndModuleProgress) => course.status.courseStatus !== 'completed')
                            .map((course: CourseAndModuleProgress, index: number) => {
                                const courseData = courses.find((c: CourseData) => c.id === course.courseId); // Find the course details

                                if (!courseData) {
                                    return null;
                                }

                                const progress = Object.values(course.status.modules).filter((status: ModuleStatus) => status === 'completed').length / Object.keys(course.status.modules).length;
                                return (
                                    <TouchableOpacity key={index} style={styles.progressCard} onPress={() => handleCourseProgressClick(course.courseId)}>
                                        <View style={styles.progressCardContent}>
                                            <Text style={styles.progressCourseTitle}>{courseData?.title || 'Course Title'}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                <View>
                                                    <Progress.Bar 
                                                        progress={progress}
                                                        height={10}
                                                        color="#4D6561" 
                                                    />
                                                </View>
                                                <Text style={styles.progressCourseTitle}>{progress * 100}%</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>
                    </View>
                )}

            {/* Courses Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.coursesHeader}>Courses</Text>
                <TouchableOpacity style={{ paddingRight: 16 }} onPress={() => router.push('/courses')}>
                    <Text style={styles.seeMoreText}>See More</Text>
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

            {/* Teachers Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.coursesHeader]}>Teachers</Text>
                <TouchableOpacity style={{ paddingRight: 16 }} onPress={() => router.push('/teachers')}>
                    <Text style={styles.seeMoreText}>See More</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {teachers.map((teacher) => (
                    <MemoizedTeacherCard key={teacher.id} teacher={teacher} />
                ))}
            </ScrollView>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#2E3D3A'
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    greetingText: {
        fontFamily: 'Outfit_700Bold',
        color: '#ECDFCC',
        fontSize: 22,
    },
    progressHeader: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 18,
        lineHeight: 22,
        color: '#ECDFCC',
        marginBottom: 16
    },
    section: {
        marginVertical: 20,
        gap: 16,
    },
    seeMoreText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        lineHeight: 17,
        color: '#ECDFCC'
    },
    progressCard: {
        backgroundColor: "#3A504C",
        borderRadius: 20,
        padding: 20,
        marginRight: 20,
        width: 220,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 6,
    },
    progressCourseTitle: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        lineHeight: 18,
        color: '#ECDFCC',
    },
    progressCardContent: {
        gap: 10
    },
    coursesHeader: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 18,
        lineHeight: 22,
        color: '#ECDFCC',
    },
    courseCard: {
        backgroundColor: "#3A504C",
        borderRadius: 10,
        padding: 15,
        paddingVertical: 25,
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
    courseHeaderText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 14,
        lineHeight: 20,
        color: '#ECDFCC',
    },
    courseCategoryText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        lineHeight: 17,
        color: '#A3C0BB',
    },
    teacherCard: {
        backgroundColor: "#3A504C",
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
    },
    textContentContainer: {
        gap: 5,
        marginTop: 5
    }
})

export default Dashboard