import { useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, TextInput, Share, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store/store';
import { toggleLike, toggleBookmark, addComment } from '../../../../redux/slices/articlesSlice';
import { FontAwesome6 } from '@expo/vector-icons';
import SignInModal from '../../../../components/SignInModal';

const ArticleDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const article = useSelector((state: RootState) => state.articles.articles.find(a => a.id === id));
  const { loading } = useSelector((state: RootState) => state.articles);

  const [commentText, setCommentText] = useState('');
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const showAuthAlert = () => {
    Alert.alert(
      "Sign in Required",
      "You need to be signed in to engage with articles.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => setAuthModalVisible(true) } // Redirect to login
      ]
    );
  };

  // Show loading state if articles are still being fetched
  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.text.primary} style={{ marginTop: 20 }} />;
  }

  // Show error message if not found
  if (!article) {
    return <Text style={{ color: theme.colors.text.primary, textAlign: 'center', marginTop: 20 }}>Article not found</Text>;
  }

  const handleLike = () => {
    if (!user) {
      showAuthAlert();
      return;
    }
    dispatch(toggleLike({ articleId: article.id, userId: user.uid }));
  };
  
  const handleBookmark = () => {
    if (!user) {
      showAuthAlert();
      return;
    }
    dispatch(toggleBookmark({ articleId: article.id, userId: user.uid }));
  };

  const handleComment = () => {
    if (!user) {
      showAuthAlert();
      return;
    }
  
    if (commentText.trim()) {
      dispatch(addComment({ 
        articleId: article.id, 
        comment: { userId: user.uid, text: commentText, timestamp: new Date().toISOString() } 
      }));
      setCommentText('');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      {/* Featured Image */}
      {article.imageUrl && (
        <Image source={{ uri: article.imageUrl }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
      )}

      <View style={{ padding: 20 }}>
        {/* Title */}
        <Text style={{ fontSize: 26, fontFamily: 'Outfit_700Bold', color: theme.colors.text.primary }}>
          {article.title}
        </Text>

        {/* Author & Date */}
        <Text style={{ fontSize: 14, color: theme.colors.text.muted, marginTop: 5 }}>
          By {article.author} • {new Date(article.createdAt).toLocaleDateString()}
        </Text>

        {/* Engagement Buttons Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: 20, marginBottom: 10, gap: 20 }}>
          
          {/* Like Button */}
          <TouchableOpacity onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome6 
              name="heart" 
              size={20} 
              color={user && article.likes.includes(user.uid) ? 'red' : theme.colors.text.muted}
              solid={user && article.likes.includes(user.uid)}
            />
            <Text style={{ color: theme.colors.text.muted, marginLeft: 6, fontSize: 14 }}>{article.likes.length}</Text>
          </TouchableOpacity>

          {/* Bookmark Button */}
          <TouchableOpacity onPress={handleBookmark} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome6 
              name="bookmark" 
              size={20} 
              color={user && article.bookmarks.includes(user.uid) ? theme.colors.accent : theme.colors.text.muted}
              solid={user && article.bookmarks.includes(user.uid)}
            />
            <Text style={{ color: theme.colors.text.muted, marginLeft: 6, fontSize: 14 }}>Bookmark</Text>
          </TouchableOpacity>
        </View>

        {/* Tags */}
        {article.tags && (
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            {article.tags.map((tag, index) => (
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

        {/* Article Content (Formatted) */}
        <View style={{ marginTop: 10 }}>
          {article.content.map((section, index) => {
            if (section.type === 'heading') {
              return (
                <Text key={index} style={{ fontSize: 22, fontFamily: 'Outfit_700Bold', color: theme.colors.text.primary, marginTop: 20, marginBottom: 10 }}>
                  {section.text}
                </Text>
              );
            } else if (section.type === 'paragraph') {
              return (
                <Text key={index} style={{ fontSize: 16, color: theme.colors.text.primary, marginBottom: 12, lineHeight: 24 }}>
                  {section.text}
                </Text>
              );
            } else if (section.type === 'quote') {
              return (
                <View key={index} style={{ backgroundColor: theme.colors.secondary, padding: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.text.muted, marginVertical: 10 }}>
                  <Text style={{ fontSize: 18, fontFamily: 'Outfit_600SemiBold', fontStyle: 'italic', color: theme.colors.text.muted }}>
                    {section.text}
                  </Text>
                </View>
              );
            } else if (section.type === 'list') {
              return (
                <View key={index} style={{ marginBottom: 12 }}>
                  {section.text.map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <Text style={{ color: theme.colors.text.primary, fontSize: 16, marginRight: 5 }}>•</Text>
                      <Text style={{ fontSize: 16, color: theme.colors.text.primary, flex: 1 }}>{item}</Text>
                    </View>
                  ))}
                </View>
              );
            }
            return null;
          })}
        </View>

        {/* Comments Section */}
        <Text style={{ fontSize: 20, fontFamily: 'Outfit_700Bold', color: theme.colors.text.primary, marginTop: 20 }}>Comments</Text>
        {article.comments.map((comment, index) => (
          <View key={index} style={{ marginTop: 10, padding: 10, backgroundColor: theme.colors.secondary, borderRadius: 8 }}>
            <Text style={{ color: theme.colors.text.primary }}>{comment.text}</Text>
          </View>
        ))}

        {/* Add Comment */}
        <TextInput
          placeholder="Write a comment..."
          value={commentText}
          onChangeText={setCommentText}
          style={{ marginTop: 10, padding: 10, backgroundColor: theme.colors.secondary, borderRadius: 8 }}
          onSubmitEditing={handleComment}
        />
      </View>

      {/* Sign In Modal */}
      <SignInModal isVisible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </ScrollView>
  );
};

export default ArticleDetailScreen;
