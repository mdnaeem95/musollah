import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../../../redux/store/store'
import { Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router'
import BackArrow from '../../../../components/BackArrow'
import { TeacherData } from '../../../../utils/types';

const Teachers = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const { teachers, loading } = useSelector((state: RootState) => state.dashboard);
    const router = useRouter();

    const renderTeacher = ({ item }: { item: TeacherData }) => (
        <TouchableOpacity style={styles.teacherCard} onPress={() => router.push(`/teachers/${item.id}`)}>
            <Image source={{ uri: item.imagePath }} style={styles.teacherImage} />
            <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{item.name}</Text>
                <Text style={styles.teacherExpertise}>{item.expertise}</Text>
            </View>
        </TouchableOpacity>
    )

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    }

    const filteredCardData = teachers.filter((card) => {
        const matchesSearchQuery = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        card.expertise.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearchQuery;
      })

    return (
        <View style={styles.mainContainer}>
            <BackArrow />

            <Searchbar
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder='Search'
            />

            <FlatList
                data={filteredCardData}
                renderItem={renderTeacher}
                keyExtractor={(teacher) => teacher.id}
                numColumns={2}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: '#4D6561',
        gap: 16
    },
    teacherCard: {
        flex: 1,
        margin: 8,
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    teacherImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 8,
    },
    teacherInfo: {
        alignItems: 'center',
        gap: 10
    },
    teacherName: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 16,
        textAlign: 'center',
    },
      teacherExpertise: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
})

export default Teachers