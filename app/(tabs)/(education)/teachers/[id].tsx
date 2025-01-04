import { View, Text, ScrollView, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useLayoutEffect, useContext } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeContext } from '../../../../context/ThemeContext';

type Params = {
  id: string;
};

const TeacherDetails = () => {
  const { id } = useLocalSearchParams<Params>();
  const { teachers, courses } = useSelector((state: RootState) => state.dashboard);

  const teacher = teachers.find((teacher) => teacher.id === id);
  const teacherCourses = courses.filter((course) => course.teacherId === id);
  const navigation = useNavigation();
  const router = useRouter();

  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  useLayoutEffect(() => {
    if (teacher) {
      navigation.setOptions({ title: '' });
    }
  }, [navigation, teacher?.name]);

  return (
    <View style={[styles.mainContainer, { backgroundColor: activeTheme.colors.primary }]}>
      <View
        style={[
          styles.teacherCard,
          { backgroundColor: activeTheme.colors.secondary, shadowColor: activeTheme.colors.text.primary },
        ]}
      >
        <Image
          source={{ uri: teacher?.imagePath }}
          style={[styles.teacherImage, { borderColor: activeTheme.colors.accent }]}
        />
        <View style={styles.teacherInfo}>
          <Text style={[styles.teacherName, { color: activeTheme.colors.text.primary }]}>{teacher?.name}</Text>
          <Text style={[styles.teacherExpertise, { color: activeTheme.colors.text.secondary }]}>{teacher?.expertise}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
        <Text style={[styles.coursesHeader, { color: activeTheme.colors.text.primary }]}>Background</Text>
        <Text style={[styles.backgroundText, { color: activeTheme.colors.text.secondary }]}>{teacher?.background}</Text>

        {teacherCourses && (
          <>
            <Text style={[styles.coursesHeader, { color: activeTheme.colors.text.primary }]}>Courses</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={teacherCourses}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.courseCard,
                    { backgroundColor: activeTheme.colors.secondary, shadowColor: activeTheme.colors.text.primary },
                  ]}
                  onPress={() => router.push(`/courses/${item.id}`)}
                >
                  <View style={styles.courseContentContainer}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: item.backgroundColour },
                      ]}
                    >
                      <FontAwesome6 name={item.icon} size={54} color={activeTheme.colors.text.primary} />
                    </View>
                    <View style={styles.textContentContainer}>
                      <Text style={[styles.courseCategoryText, { color: activeTheme.colors.text.secondary }]}>
                        {item.category}
                      </Text>
                      <Text style={[styles.courseHeaderText, { color: activeTheme.colors.text.primary }]}>
                        {item.title}
                      </Text>
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
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  teacherCard: {
    width: '100%',
    flexDirection: 'row',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  },
  teacherInfo: {
    justifyContent: 'center',
    flexShrink: 1,
    gap: 5,
  },
  teacherName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
  },
  teacherExpertise: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
  backgroundText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  coursesHeader: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  courseCard: {
    borderRadius: 12,
    padding: 10,
    marginRight: 16,
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
    marginBottom: 4,
  },
  courseHeaderText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
});

export default TeacherDetails;