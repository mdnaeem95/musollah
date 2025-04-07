import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchArticles } from '../../api/firebase';
import {
  addArticleComment,
  toggleArticleBookmark,
  toggleArticleLike,
} from '../../api/firebase/articles/index';
import { Article, ArticleComment } from '../../utils/types';

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

// 🔄 Optimistic Like Toggle
export const toggleLike = createAsyncThunk(
  'articles/toggleLike',
  async (
    { articleId, userId }: { articleId: string; userId: string },
    { dispatch }
  ) => {
    dispatch(toggleLikeOptimistic({ articleId, userId }));
    await toggleArticleLike(articleId, userId);
  }
);

// 🔄 Optimistic Bookmark Toggle
export const toggleBookmark = createAsyncThunk(
  'articles/toggleBookmark',
  async (
    { articleId, userId }: { articleId: string; userId: string },
    { dispatch }
  ) => {
    dispatch(toggleBookmarkOptimistic({ articleId, userId }));
    await toggleArticleBookmark(articleId, userId);
  }
);

// 🔄 Optimistic Comment Add
export const addComment = createAsyncThunk(
  'articles/addComment',
  async (
    { articleId, comment }: { articleId: string; comment: ArticleComment },
    { dispatch }
  ) => {
    dispatch(addCommentOptimistic({ articleId, comment }));
    await addArticleComment(articleId, comment);
  }
);

export const getArticles = createAsyncThunk('articles/getArticles', async () => {
  return await fetchArticles();
});

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    toggleLikeOptimistic: (state, action: PayloadAction<{ articleId: string; userId: string }>) => {
      const article = state.articles.find((a) => a.id === action.payload.articleId);
      if (article) {
        const index = article.likes.indexOf(action.payload.userId);
        if (index > -1) {
          article.likes.splice(index, 1);
        } else {
          article.likes.push(action.payload.userId);
        }
      }
    },
    toggleBookmarkOptimistic: (state, action: PayloadAction<{ articleId: string; userId: string }>) => {
      const article = state.articles.find((a) => a.id === action.payload.articleId);
      if (article) {
        const index = article.bookmarks.indexOf(action.payload.userId);
        if (index > -1) {
          article.bookmarks.splice(index, 1);
        } else {
          article.bookmarks.push(action.payload.userId);
        }
      }
    },
    addCommentOptimistic: (state, action: PayloadAction<{ articleId: string; comment: ArticleComment }>) => {
      const article = state.articles.find((a) => a.id === action.payload.articleId);
      if (article) {
        article.comments = [...article.comments, action.payload.comment];
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
      });
  },
});

export const {
  toggleLikeOptimistic,
  toggleBookmarkOptimistic,
  addCommentOptimistic,
} = articlesSlice.actions;

export default articlesSlice.reducer;
