import firestore from "@react-native-firebase/firestore";
import { ArticleComment } from '../../../utils/types'

// Like an article
export const toggleArticleLike = async (articleId: string, userId: string) => {
    const articleRef = firestore().collection('articles').doc(articleId);
    const doc = await articleRef.get();
  
    if (doc.exists) {
      const data = doc.data();
      const likes = data?.likes || [];
  
      if (likes.includes(userId)) {
        await articleRef.update({ likes: likes.filter((id: string) => id !== userId) });
      } else {
        await articleRef.update({ likes: [...likes, userId] });
      }
    }
};
  
// Bookmark an article
export const toggleArticleBookmark = async (articleId: string, userId: string) => {
    const articleRef = firestore().collection('articles').doc(articleId);
    const doc = await articleRef.get();
  
    if (doc.exists) {
      const data = doc.data();
      const bookmarks = data?.bookmarks || [];
  
      if (bookmarks.includes(userId)) {
        await articleRef.update({ bookmarks: bookmarks.filter((id: string) => id !== userId) });
      } else {
        await articleRef.update({ bookmarks: [...bookmarks, userId] });
      }
    }
};
  
// Add a comment
export const addArticleComment = async (articleId: string, comment: ArticleComment) => {
    const articleRef = firestore().collection('articles').doc(articleId);
    await articleRef.update({
      comments: firestore.FieldValue.arrayUnion({
        ...comment,
        timestamp: firestore.Timestamp.fromDate(new Date()), // 🔹 Store Firestore Timestamp properly
      }),
    });
};