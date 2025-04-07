import firestore from '@react-native-firebase/firestore';
import { Khutbah } from '../../../utils/types';

export const fetchKhutbahs = async (): Promise<Khutbah[]> => {
  try {
    const snapshot = await firestore().collection('khutbahs').orderBy('date', 'desc').get();

    const khutbahs: Khutbah[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date, // Expected to be ISO string
        links: {
          English: data.links?.english || null,
          Malay: data.links?.malay || null,
          Tamil: data.links?.tamil || null,
        },
        tags: data.tags || [],
        speaker: data.speaker || '',
        summary: data.summary || '',
      };
    });

    return khutbahs;
  } catch (error) {
    console.error('❌ Error fetching khutbahs:', error);
    throw new Error('Failed to fetch khutbahs');
  }
};