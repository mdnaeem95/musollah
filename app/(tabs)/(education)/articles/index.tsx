import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { getArticles } from '../../../../redux/slices/articlesSlice';
import { RootState, AppDispatch } from '../../../../redux/store/store';

const ArticlesScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { articles, loading, error } = useSelector((state: RootState) => state.articles);

  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState(articles);

  useEffect(() => {
    dispatch(getArticles());
  }, [dispatch]);

  // Update filtered articles when articles change
  useEffect(() => {
    setFilteredArticles(articles);
  }, [articles]);

  // Function to handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredArticles(articles);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    const filtered = articles.filter((article) =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.author.toLowerCase().includes(lowerQuery) ||
      (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );

    setFilteredArticles(filtered);
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.text.primary} />;
  if (error) return <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error}</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      {/* Search Bar */}
      <View
        style={{
          padding: 15,
          backgroundColor: theme.colors.secondary,
          borderRadius: 8,
          margin: 15,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          placeholder="Search articles..."
          placeholderTextColor={theme.colors.text.muted}
          value={searchQuery}
          onChangeText={handleSearch}
          style={{
            flex: 1,
            color: theme.colors.text.primary,
            fontSize: 16,
            paddingVertical: 5,
          }}
        />
      </View>

      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: `/articles/${item.id}`})}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              paddingHorizontal: 20,
              backgroundColor: pressed ? theme.colors.secondary : 'transparent',
            })}
          >
            {/* Thumbnail Image */}
            <Image
              source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                backgroundColor: theme.colors.secondary,
              }}
            />

            {/* Article Details */}
            <View style={{ flex: 1, marginLeft: 15 }}>
              {/* Tags */}
              {item.tags && (
                <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                  {item.tags.map((tag, index) => (
                    <Text
                      key={index}
                      style={{
                        fontSize: 12,
                        color: theme.colors.text.muted,
                        backgroundColor: theme.colors.secondary,
                        paddingVertical: 3,
                        paddingHorizontal: 8,
                        borderRadius: 15,
                        marginRight: 5,
                      }}
                    >
                      {tag}
                    </Text>
                  ))}
                </View>
              )}

              {/* Title */}
              <Text style={{ color: theme.colors.text.primary, fontSize: 18, fontFamily: 'Outfit_700Bold' }}>
                {item.title}
              </Text>

              {/* Content Preview (2 lines) */}
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{ color: theme.colors.text.muted, fontSize: 14, marginTop: 5 }}
              >
                {item.content.find(c => c.type === 'paragraph')?.text || ''}
              </Text>

              {/* Author & Date */}
              <Text style={{ color: theme.colors.text.muted, fontSize: 12, marginTop: 5 }}>
                By {item.author} • {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: theme.colors.text.muted, marginVertical: 5 }} />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default ArticlesScreen;
