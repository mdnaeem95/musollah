import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { useRouter } from 'expo-router';

const BookmarksScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.dashboard.user);
  const courses = useSelector((state: RootState) => state.dashboard.courses);
  const articles = useSelector((state: RootState) => state.articles.articles);
  const styles = createStyles(theme)

  if (!user) return null;

  const bookmarkedArticles = articles.filter((article) => article.bookmarks.includes(user.id));
//const bookmarkedCourses = user.enrolledCourses.filter((course) => course.status.courseStatus !== 'locked');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.primary, padding: 16 }}>
      <Text style={styles.header}>Bookmarked Articles</Text>
      {bookmarkedArticles.length === 0 && (
        <Text style={styles.emptyText}>You haven't bookmarked any articles yet.</Text>
      )}
      {bookmarkedArticles.map((article) => (
        <TouchableOpacity key={article.id} onPress={() => router.push(`/articles/${article.id}`)} style={styles.card}>
          <Image source={{ uri: article.imageUrl }} style={styles.image} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.meta}>{article.author} • {new Date(article.createdAt).toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* <Text style={[styles.header, { marginTop: 30 }]}>Bookmarked Courses</Text>
      {bookmarkedCourses.length === 0 && (
        <Text style={styles.emptyText}>You haven't enrolled in any courses yet.</Text>
      )}
      {bookmarkedCourses.map((course) => {
        const fullCourse = courses.find((c) => c.id === course.courseId);
        if (!fullCourse) return null;
        return (
          <TouchableOpacity key={course.courseId} onPress={() => router.push(`/courses/${course.courseId}`)} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: fullCourse.backgroundColour }]}>
              <Text style={{ fontSize: 24 }}>{fullCourse.icon}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.title}>{fullCourse.title}</Text>
              <Text style={styles.meta}>{fullCourse.category} • {fullCourse.type}</Text>
            </View>
          </TouchableOpacity>
        );
      })} */}
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  header: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  emptyText: {
    color: theme.colors.text.muted,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: theme.colors.text.primary,
  },
  meta: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BookmarksScreen;