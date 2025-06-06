import { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { getArticles } from '../../../../redux/slices/articlesSlice';
import { RootState, AppDispatch } from '../../../../redux/store/store';
import { FlashList } from '@shopify/flash-list';
import { ArticleCategory } from '../../../../utils/types';
import { fetchCategories } from '../../../../api/firebase';
import { FontAwesome6 } from '@expo/vector-icons';

const ArticlesScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { articles, loading, error } = useSelector((state: RootState) => state.articles);
  
  // State for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null);
  const [filteredArticles, setFilteredArticles] = useState(articles);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    dispatch(getArticles());
    fetchCategories().then((data) => {
      setCategories(data);
      setCategoriesLoading(false); // ✅ Set loading to false when done
    });
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCategory) {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article => article.category?.id === selectedCategory.id);
      setFilteredArticles(filtered.length > 0 ? filtered : articles);
    }
  }, [selectedCategory, articles]);

  if (loading) return <ActivityIndicator size="large" color={theme.colors.text.primary} />;
  if (error) return <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error}</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary, paddingBottom: 20 }}>
      <View
        style={{
          padding: 15,
          backgroundColor: theme.colors.secondary,
          borderRadius: 8,
          marginHorizontal: 15,
          marginVertical: 15,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          placeholder="Search articles..."
          placeholderTextColor={theme.colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            flex: 1,
            color: theme.colors.text.primary,
            fontSize: 16,
            paddingVertical: 5,
          }}
        />
      </View>

      <Text style={{ fontSize: 20, fontFamily: 'Outfit_700Bold', color: theme.colors.text.primary, marginLeft: 15, marginBottom: 10 }}>
        Browse Categories
      </Text>

      {categoriesLoading ? (
        <ActivityIndicator size="small" color={theme.colors.text.primary} style={{ alignSelf: 'center', marginBottom: 15 }} />
      ) : categories.length === 0 ? (
        <Text style={{ textAlign: 'center', color: theme.colors.text.muted, marginBottom: 15 }}>
          No categories found.
        </Text>
      ) : (
        <View style={{ height: 150 }}>
          <FlashList
            horizontal
            estimatedItemSize={120}
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedCategory?.id === item.id;
              return (
                <TouchableOpacity
                  style={{ marginHorizontal: 10, alignItems: 'center', position: 'relative' }}
                  onPress={() => setSelectedCategory(prev => (prev?.id === item.id ? null : item))}
                >
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{
                        width: 130,
                        height: 130,
                        borderRadius: 12,
                        backgroundColor: theme.colors.secondary,
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: theme.colors.accent,
                        opacity: isSelected ? 0.7 : 1,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 16,
                          fontWeight: 'bold',
                          textAlign: 'center',
                          paddingHorizontal: 5,
                          textTransform: 'uppercase',
                          opacity: isSelected ? 1 : 0.9,
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>

                    {isSelected && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 5,
                          right: 5,
                          backgroundColor: theme.colors.accent,
                          borderRadius: 20,
                          padding: 6,
                        }}
                      >
                        <FontAwesome6 name="check" size={14} color="white" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            extraData={selectedCategory} 
            contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 15 }}
          />
        </View>
      )}

      <Text style={{ fontSize: 20, fontFamily: 'Outfit_700Bold', color: theme.colors.text.primary, marginLeft: 15, marginBottom: 5 }}>
        Latest Articles
      </Text>

      <FlashList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        estimatedItemSize={150}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: `/articles/${item.id}` })}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              paddingHorizontal: 20,
              backgroundColor: pressed ? theme.colors.secondary : 'transparent',
            })}
          >
            <Image
              source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                backgroundColor: theme.colors.secondary,
              }}
            />

            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={{ color: theme.colors.text.primary, fontSize: 18, fontFamily: 'Outfit_700Bold' }}>
                {item.title}
              </Text>

              <Text numberOfLines={2} ellipsizeMode="tail" style={{ color: theme.colors.text.muted, fontSize: 14, marginTop: 5 }}>
                {item.content.find(c => c.type === 'paragraph')?.text || ''}
              </Text>

              <Text style={{ color: theme.colors.text.muted, fontSize: 12, marginTop: 5 }}>
                {item.author} • {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.text.muted, marginVertical: 5 }} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default ArticlesScreen;