import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../../../redux/store/store'
import { useRouter } from 'expo-router'
import { TeacherData } from '../../../../utils/types';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';

const Teachers = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
    const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
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

    const toggleSearch = () => {
        setIsSearchExpanded(prev => !prev);
        if (isSearchExpanded) setSearchQuery(''); // Clear search when collapsing
    };

    useEffect(() => {
        const handler = setTimeout(() => {
          setDebounceQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
      }, [searchQuery]);

    const filteredCardData = teachers.filter((card) => {
        const matchesSearchQuery = card.name.toLowerCase().includes(debounceQuery.toLowerCase()) || 
        card.expertise.toLowerCase().includes(debounceQuery.toLowerCase())
        return matchesSearchQuery;
      })

    return (
        <View style={styles.mainContainer}>
            {/* Header with expandable search bar */}
            <View style={styles.headerContainer}>
                {isSearchExpanded && (
                    <View style={styles.searchBarContainer}>
                        <TextInput
                            placeholder="Search Teacher"
                            placeholderTextColor="#ECDFCC"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                        />
                    </View>
                )}
                <TouchableOpacity onPress={toggleSearch} style={styles.searchIconContainer}>
                    <FontAwesome6 
                        name={isSearchExpanded ? 'xmark' : 'magnifying-glass'} 
                        size={24} 
                        color="#ECDFCC" 
                    />
                </TouchableOpacity>
            </View>

            <FlashList
                showsVerticalScrollIndicator={false}
                estimatedItemSize={197}
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
        backgroundColor: '#2E3D3A',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10
    },
    searchBarContainer: {
        flex: 1,
        backgroundColor: '#3A504C',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        marginRight: 10,
    },
    searchInput: {
        color: '#ECDFCC',
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
    },
    searchIconContainer: {
        padding: 8,
    },
    teacherCard: {
        flex: 1,
        margin: 8,
        padding: 16,
        backgroundColor: '#3A504C',
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    teacherImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#A3C0BB', // Border color to match theme
    },
    teacherInfo: {
        alignItems: 'center',
        gap: 6,
    },
    teacherName: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 16,
        color: '#ECDFCC',  // Off-white for better contrast
        textAlign: 'center',
    },
    teacherExpertise: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#A3C0BB', // Soft blue/green shade for expertise text
        textAlign: 'center',
    },
})

export default Teachers