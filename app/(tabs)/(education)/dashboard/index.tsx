import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native'
import React from 'react'

import { FontAwesome6 } from '@expo/vector-icons'
import * as Progress from 'react-native-progress'
import { useRouter } from 'expo-router';

const user = {
    name: "Ahmed",
    avatarUrl: 'https://via.placeholder.com/100', // Placeholder image URL for avatar
};

const courseData = [
    {
        backgroundColour: '#DEF682',
        icon: 'person-praying',
        hashtag: 'Prayers',
        header: 'Understanding Solat Fardhu',
        description:
            "Learn the essentials of the five daily prayers in Islam. This guide covers the steps, recitations, and intentions required to perform each prayer correctly.",
    },
    {
        backgroundColour: '#F4E281',
        icon: 'person-praying',
        hashtag: 'Prayers',
        header: 'Benefits of Tahajjud Prayer',
        description:
            "Explore the spiritual and physical benefits of performing the Tahajjud prayer, a voluntary night prayer in Islam that brings one closer to Allah.",
    },
    {
        backgroundColour: '#FFB29A',
        icon: 'book',
        hashtag: 'Quran',
        header: 'Tafsir of Surah Al-Baqarah',
        description: 'An in-depth analysis of the second surah of the Quran, Surah Al-Baqarah.',
    },
]

const courseProgress = [
    { id: '1', title: 'Quran Recitation Basics', progress: 40 },
    { id: '2', title: 'Advanced Tafsir Studies', progress: 75 },
    { id: '3', title: 'Advanced Tafsir Studies', progress: 90 },
];

const teachers = [
    { id: '1', expertise: 'Tafsir and Quranic Studies', name: 'Sheikh Omar', imagePath: require('../../../../assets/sheikhomar.jpg') },
    { id: '2', expertise: 'Islamic Jurisprudence', name: 'Ustadh Amina', imagePath: require('../../../../assets/ustazahaminah.jpg') },
];

const Dashboard = () => {
    const router = useRouter();

    return (
        <View style={styles.mainContainer}>
            <View style={{ height: 200, width: 500, margin: -16, position: 'absolute', backgroundColor: '#4D6561' }}></View>

            <View style={styles.headerContainer}>
                <Text style={styles.greetingText}>Salam, Naeem Sani</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity>
                        <FontAwesome6 name="bell" size={24} regular />
                    </TouchableOpacity>
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarContainer}/>
                </View>
            </View>

            <View style={styles.section}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.progressHeader}>In Progress</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {courseProgress.map((course) => (
                        <View key={course.id} style={styles.progressCard}>
                            <View style={styles.progressCardContent}>
                                <Text style={styles.progressCourseTitle}>{course.title}</Text>
                                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                    <TouchableOpacity style={{ width: 25, height: 25, borderRadius: 12.5, backgroundColor: 'rgba(63, 52, 131, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesome6 name="user" color="purple" />
                                    </TouchableOpacity>
                                    <Text>Amir Mikasa</Text>
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
                        </View>
                    ))}
                </ScrollView>

                <ScrollView contentContainerStyle={{ paddingBottom: 250 }} showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.coursesHeader}>Courses</Text>
                        <TouchableOpacity style={{ paddingRight: 16 }} onPress={() => router.push('/courses')}>
                            <Text style={[styles.seeMoreText, { color: '#000000' }]}>See More</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {courseData.map((course) => (
                            <View style={styles.courseCard} key={course.header}>
                                <View style={styles.courseContentContainer}>
                                    <View style={{ width: 185, height: 98,  backgroundColor: `${course.backgroundColour}`, alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesome6 name={course.icon} size={54} />
                                    </View>

                                    <View style={styles.textContentContainer}>
                                        <Text style={styles.courseCategoryText}>{course.hashtag}</Text>
                                        <Text style={styles.courseHeaderText}>{course.header}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.coursesHeader, { marginTop: 20 }]}>Teachers</Text>
                        <TouchableOpacity style={{ paddingRight: 16 }}>
                            <Text style={[styles.seeMoreText, { color: '#000000' }]}>See More</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {teachers.map((teacher) => (
                            <View style={styles.courseCard} key={teacher.id}>
                                <View style={styles.courseContentContainer}>
                                    <Image source={teacher.imagePath} style={{ width: 185, height: 98, alignItems: 'center', justifyContent: 'center', zIndex: 10 }} alt='sheikhomar' />
                                
                                    <View style={styles.textContentContainer}>
                                        <Text style={styles.courseHeaderText}>{teacher.name}</Text>
                                        <Text style={styles.courseCategoryText}>{teacher.expertise}</Text>
                                    </View>
                                </View>
                            </View>
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
        color: '#000000',
        marginBottom: 20
    },
    courseCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 10,
        marginRight: 20,
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
    }

})

export default Dashboard