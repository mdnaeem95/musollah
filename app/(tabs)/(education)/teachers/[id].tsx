import { View, Text, ScrollView, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useLayoutEffect } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { FontAwesome6 } from '@expo/vector-icons';

type Params = {
    id: string;
}

const TeacherDetails = () => {
    const { id } = useLocalSearchParams<Params>();
    const { teachers, courses } = useSelector((state: RootState) => state.dashboard);

    const teacher = teachers.find((teacher) => teacher.id === id);
    const teacherCourses = courses.filter((course) => course.teacherId === id);
    const navigation = useNavigation();
    const router = useRouter();

    useLayoutEffect(() => {
        if (teacher) {
          navigation.setOptions({ title: '' });
        }
      }, [navigation, teacher?.name]);

    return (
        <View style={styles.mainContainer}>
            <View style={{ width: '100%', marginBottom: 20 }}>
                <TouchableOpacity onPress={() => router.back()}>
                    <FontAwesome6 name="arrow-left" color='white' size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.teacherCard}>
                <Image source={{ uri: teacher?.imagePath }} style={styles.teacherImage} />
                <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>{teacher?.name}</Text>
                    <Text style={styles.teacherExpertise}>{teacher?.expertise}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
                <Text style={styles.coursesHeader}>Background</Text>
                <Text style={styles.backgroundText}>{teacher?.background}</Text>

                {teacherCourses && (
                    <>
                        <Text style={styles.coursesHeader}>Courses</Text>
                        <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={teacherCourses}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.courseCard} onPress={() => router.push(`/courses/${item.id}`)}>
                                <View style={styles.courseContentContainer}>
                                    <View style={{ width: 100, height: 98, backgroundColor: item.backgroundColour, alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesome6 name={item.icon} size={54} />
                                    </View>
                                    <View style={styles.textContentContainer}>
                                        <Text style={styles.courseCategoryText}>{item.category}</Text>
                                        <Text style={styles.courseHeaderText}>{item.title}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                            numColumns={1} 
                        />
                    </>
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#4D6561'
    },
    teacherCard: {
        width: '100%',
        flexDirection: 'row',
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    teacherImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
    },
    teacherInfo: {
        justifyContent: 'center',
        flexShrink: 1,
        gap: 5,
    },
    teacherName: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16
    },
    teacherExpertise: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14
    },
    backgroundText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 16
    },
    coursesHeader: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 22,
        marginBottom: 16,
        color: '#FFFFFF'
    },
    courseCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 10,
        marginBottom: 16,
    },
    courseContentContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContentContainer: {
        marginLeft: 16,
        flex: 1,
    },
      courseCategoryText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        lineHeight: 17,
    },
      courseHeaderText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 14,
        lineHeight: 20,
    },
})

export default TeacherDetails