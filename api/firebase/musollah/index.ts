import firestore from '@react-native-firebase/firestore';

export async function updateLocationStatusFirestore(
  type: 'bidet' | 'musollah',
  id: string,
  status: 'Available' | 'Unavailable' | 'Unknown'
) {
  try {
    const collection = type === 'bidet' ? 'Bidets' : 'musollahs';
    const ref = firestore().collection(collection).doc(id);

    await ref.update({
      status,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('[Firestore] Failed to update location status:', error);
    throw error;
  }
}
