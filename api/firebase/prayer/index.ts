import firestore from '@react-native-firebase/firestore';
import { Khutbah } from '../../../utils/types';
import { ExtensionStorage } from '@bacons/apple-targets';
import { fetchPrayerTimes2025 } from '..';

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

export const seedPrayerTimesToWidget = async () => {
  try {
    const widgetStorage = new ExtensionStorage("group.com.rihlah.prayerTimesWidget");

    // Fetch from Firebase or cache
    const prayerTimesList = await fetchPrayerTimes2025();

    // Save to shared widget storage
    await widgetStorage.set("prayerTimes2025", JSON.stringify(prayerTimesList));

    // Reload widget to apply today's data
    ExtensionStorage.reloadWidget();

    console.log("✅ Seeded widget with full 2025 prayer times.");
  } catch (err) {
    console.error("❌ Failed to seed widget prayer times:", err);
  }
};