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
        backgroundColor: '#2E3D3A'
    },
    teacherCard: {
        width: '100%',
        flexDirection: 'row',
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#3A504C',
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 6,
    },
    teacherImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#A3C0BB'
    },
    teacherInfo: {
        justifyContent: 'center',
        flexShrink: 1,
        gap: 5,
    },
    teacherName: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 18,
        color: '#ECDFCC',
    },
    teacherExpertise: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#A3C0BB', 
    },
    backgroundText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
        color: '#ECDFCC',
        marginBottom: 16,
        lineHeight: 22,
    },
    coursesHeader: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 18,
        color: '#ECDFCC',
        marginBottom: 16,
    },
    courseCard: {
        backgroundColor: "#3A504C",
        borderRadius: 12,
        padding: 10,
        marginRight: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 6,
    },
    courseContentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 98,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    textContentContainer: {
        marginLeft: 16,
        flex: 1,
    },
    courseCategoryText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
        color: '#A3C0BB',
        marginBottom: 4,
    },
    courseHeaderText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 14,
        color: '#ECDFCC',
    },
})

export default TeacherDetails