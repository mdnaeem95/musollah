import { View, Text, ScrollView, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useEffect, useLayoutEffect } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { getArticles } from '../../../../redux/slices/articlesSlice';

type Params = {
  id: string;
};

const TeacherDetails = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { id } = useLocalSearchParams<Params>();
  const { teachers, courses, articles } = useSelector((state: RootState) => ({
    teachers: state.dashboard.teachers,
    courses: state.dashboard.courses,
    articles: state.articles.articles, 
  }));

  const teacher = teachers.find((teacher) => teacher.id === id);
  console.log('Teacher name: ', teacher?.name)
  const teacherCourses = courses.filter((course) => course.teacherId === id);

  // Fetch articles if they haven't been loaded
  useEffect(() => {
    if (articles.length === 0) {
      dispatch(getArticles());
    }
  }, [dispatch, articles.length]);

  const teacherArticles = articles.filter((article) => article.author === teacher?.name); 

  const navigation = useNavigation();
  const router = useRouter();
  const { theme } = useTheme();

  console.log('All articles:', articles);
  console.log('Teacher name:', teacher?.name);

  useLayoutEffect(() => {
    if (teacher) {
      navigation.setOptions({ title: '' });
    }
  }, [navigation, teacher?.name]);

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      <View
        style={[
          styles.teacherCard,
          { backgroundColor: theme.colors.secondary, shadowColor: theme.colors.text.primary },
        ]}
      >
        <Image
          source={{ uri: teacher?.imagePath }}
          style={[styles.teacherImage, { borderColor: theme.colors.accent }]}
        />
        <View style={styles.teacherInfo}>
          <Text style={[styles.teacherName, { color: theme.colors.text.primary }]}>{teacher?.name}</Text>
          <Text style={[styles.teacherExpertise, { color: theme.colors.text.secondary }]}>{teacher?.expertise}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
        <Text style={[styles.coursesHeader, { color: theme.colors.text.primary }]}>Background</Text>
        <Text style={[styles.backgroundText, { color: theme.colors.text.secondary }]}>{teacher?.background}</Text>

        {/* Courses Section */}
        {teacherCourses.length > 0 && (
          <>
            <Text style={[styles.coursesHeader, { color: theme.colors.text.primary }]}>Courses</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={teacherCourses}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.courseCard,
                    { backgroundColor: theme.colors.secondary, shadowColor: theme.colors.text.primary },
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
                      <FontAwesome6 name={item.icon} size={54} color={theme.colors.text.primary} />
                    </View>
                    <View style={styles.textContentContainer}>
                      <Text style={[styles.courseCategoryText, { color: theme.colors.text.secondary }]}>
                        {item.category}
                      </Text>
                      <Text style={[styles.courseHeaderText, { color: theme.colors.text.primary }]}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
            />
          </>
        )}

        {/* Articles Section */}
        {teacherArticles.length > 0 && (
          <>
            <Text style={[styles.coursesHeader, { color: theme.colors.text.primary }]}>Articles</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={teacherArticles}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.articleCard,
                    { backgroundColor: theme.colors.secondary, shadowColor: theme.colors.text.primary },
                  ]}
                  onPress={() => router.push(`/articles/${item.id}`)}
                >
                  <Image
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                    style={styles.articleImage}
                  />
                  <View style={styles.articleTextContainer}>
                    <Text style={[styles.articleTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={[styles.articleDate, { color: theme.colors.text.muted }]}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
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
  articleCard: {
    width: 200,
    borderRadius: 12,
    marginRight: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  articleImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  articleTextContainer: {
    padding: 10,
  },
  articleTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    marginBottom: 5,
  },
  articleDate: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
  },
});

export default TeacherDetails;
