import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../../../redux/store/store';
import { completeModule } from '../../../../../../redux/slices/courseSlice';
import { getAuth } from '@react-native-firebase/auth';
import { CourseAndModuleProgress, CourseData, ModuleData } from '../../../../../../utils/types';
import PagerView from 'react-native-pager-view';
import { useTheme } from '../../../../../../context/ThemeContext';

type Params = {
  courseId: string;
  moduleId: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ModuleDetails = () => {
  const { courseId, moduleId } = useLocalSearchParams<Params>();
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const { theme } = useTheme();

  const course: CourseData | undefined = useSelector((state: RootState) =>
    state.dashboard.courses.find((c) => c.id === courseId),
  );

  const userProgress: CourseAndModuleProgress | undefined = useSelector((state: RootState) =>
    state.dashboard.user?.enrolledCourses.find((p) => p.courseId === courseId),
  );

  const onPageSelected = (event: any) => {
    setCurrentIndex(event.nativeEvent.position);
  };

  useEffect(() => {
    if (course) {
      const module = course.modules.find((m: any) => m.moduleId === moduleId);
      if (module) {
        setModuleData(module);
      }
    }
  }, [course, moduleId]);

  useLayoutEffect(() => {
    if (moduleData) {
      navigation.setOptions({ headerTitle: moduleData?.title });
    }
  }, [navigation, moduleData?.title]);

  const handleCompleteModule = async () => {
    if (courseId && moduleId && userId && userProgress) {
      try {
        const moduleProgress = userProgress.status.modules[moduleId];
        if (!moduleProgress) {
          throw new Error('Module progress not found.');
        }

        await dispatch(completeModule({ courseId, moduleId, userId })).unwrap();

        const currentModuleIndex = course?.modules.findIndex((m: any) => m.moduleId === moduleId);

        if (currentModuleIndex !== undefined && currentModuleIndex < course!.modules.length - 1) {
          const nextModule = course!.modules[currentModuleIndex + 1];
          router.push(`/courses/${courseId}/modules/${nextModule.moduleId}`);
        } else {
          alert('Congratulations! You have completed the course.');
          router.push('/courses');
        }
      } catch (error) {
        console.error('Failed to complete module:', error);
      }
    }
  };

  if (!moduleData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.primary }]}>
        <Text style={{ color: theme.colors.text.primary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={onPageSelected}
      >
        {moduleData.content.map((contentItem, index) => (
          <View
            key={index}
            style={[
              styles.page,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.contentTitle, { color: theme.colors.text.primary }]}>
              {contentItem.title}
            </Text>
            <Text style={[styles.textContent, { color: theme.colors.text.secondary }]}>
              {contentItem.data}
            </Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.pagination}>
        {moduleData.content.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: index === currentIndex ? theme.colors.accent : theme.colors.text.muted },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.completeButton,
          { backgroundColor: theme.colors.text.success },
        ]}
        onPress={handleCompleteModule}
      >
        <Text style={[styles.completeButtonText, { color: theme.colors.text.primary }]}>
          Complete Module
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    gap: 20,
    width: SCREEN_WIDTH - 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: SCREEN_WIDTH - 32,
    padding: 16,
  },
  contentTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  textContent: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 18,
    lineHeight: 24,
  },
  completeButton: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  completeButtonText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
  },
});

export default ModuleDetails;