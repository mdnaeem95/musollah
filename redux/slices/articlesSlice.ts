import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchArticles } from '../../api/firebase';
import { addArticleComment, toggleArticleBookmark, toggleArticleLike } from '../../api/firebase/articles/index'
import { Article, ArticleComment } from '../../utils/types';

// Define the state structure
interface ArticlesState {
  articles: Article[];
  loading: boolean;
  error: string | null;
}

const initialState: ArticlesState = {
  articles: [],
  loading: false,
  error: null,
};

// Async Thunk: Fetch articles from Firestore
export const getArticles = createAsyncThunk('articles/getArticles', async () => {
  return await fetchArticles();
});

// Async Thunk: Toggle Like in Firestore
export const toggleLike = createAsyncThunk(
  'articles/toggleLike',
  async ({ articleId, userId }: { articleId: string; userId: string }) => {
    await toggleArticleLike(articleId, userId); // 🔹 Update Firestore
    return { articleId, userId }; // Return updated data for Redux
  }
);

// Async Thunk: Toggle Bookmark in Firestore
export const toggleBookmark = createAsyncThunk(
  'articles/toggleBookmark',
  async ({ articleId, userId }: { articleId: string; userId: string }) => {
    await toggleArticleBookmark(articleId, userId); // 🔹 Update Firestore
    return { articleId, userId }; // Return updated data for Redux
  }
);

// Async Thunk: Add Comment in Firestore
export const addComment = createAsyncThunk(
  'articles/addComment',
  async ({ articleId, comment }: { articleId: string; comment: ArticleComment }) => {
    await addArticleComment(articleId, comment); // 🔹 Update Firestore
    return { articleId, comment }; // Return updated data for Redux
  }
);

// Reducers for local engagement interactions
const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    toggleBookmark: (state, action: PayloadAction<{ articleId: string; userId: string }>) => {
      const article = state.articles.find(a => a.id === action.payload.articleId);
      if (article) {
        if (article.bookmarks.includes(action.payload.userId)) {
          article.bookmarks = article.bookmarks.filter(id => id !== action.payload.userId);
        } else {
          article.bookmarks.push(action.payload.userId);
        }
      }
    },
    addComment: (state, action: PayloadAction<{ articleId: string; comment: ArticleComment }>) => {
      const article = state.articles.find(a => a.id === action.payload.articleId);
      if (article) {
        //@ts-ignore
        article.comments = [...article.comments, action.payload.comment]; // 🔹 Immutable update
      }
    },    
  },
  extraReducers: (builder) => {
    builder
      .addCase(getArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getArticles.fulfilled, (state, action: PayloadAction<Article[]>) => {
        state.loading = false;
        state.articles = action.payload;
      })
      .addCase(getArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch articles';
      })
      .addCase(toggleLike.fulfilled, (state, action: PayloadAction<{ articleId: string; userId: string }>) => {
        const article = state.articles.find(a => a.id === action.payload.articleId);
        if (article) {
          if (article.likes.includes(action.payload.userId)) {
            article.likes = article.likes.filter(id => id !== action.payload.userId); // Unlike
          } else {
            article.likes.push(action.payload.userId); // Like
          }
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to like article';
      })
      .addCase(toggleBookmark.fulfilled, (state, action: PayloadAction<{ articleId: string; userId: string }>) => {
        const article = state.articles.find(a => a.id === action.payload.articleId);
        if (article) {
          if (article.bookmarks.includes(action.payload.userId)) {
            article.bookmarks = article.bookmarks.filter(id => id !== action.payload.userId); // Unbookmark
          } else {
            article.bookmarks.push(action.payload.userId); // Bookmark
          }
        }
      })
      .addCase(toggleBookmark.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to bookmark article';
      })
      .addCase(addComment.fulfilled, (state, action: PayloadAction<{ articleId: string; comment: ArticleComment }>) => {
        const article = state.articles.find(a => a.id === action.payload.articleId);
        if (article) {
          article.comments = [...article.comments, action.payload.comment]; // 🔹 Add new comment
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add comment';
      });
  },
});

// Export actions
export default articlesSlice.reducer;
