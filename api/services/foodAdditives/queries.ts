/**
 * Food Additives Firebase Queries
 */

import { FoodAdditive } from "../../../utils/types";
import { db } from "../../client/firebase";

/**
 * Fetch all food additives from Firestore
 */
export async function fetchFoodAdditives(): Promise<FoodAdditive[]> {
  try {
    console.log('🔵 Fetching food additives from Firestore');

    const snapshot = await db.collection('foodAdditives').get();

    if (snapshot.empty) {
      console.log('⚠️ No food additives found');
      return [];
    }

    const additives: FoodAdditive[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        eCode: data.eCode || '',
        category: data.category || '',
        chemicalName: data.chemicalName || '',
        description: data.description || '',
        status: data.status || '',
      };
    });

    console.log(`✅ Retrieved ${additives.length} food additives`);
    return additives;
  } catch (error) {
    console.error('❌ Error fetching food additives:', error);
    throw error;
  }
}

/**
 * Fetch a single food additive by E-code
 */
export async function fetchFoodAdditiveByECode(eCode: string): Promise<FoodAdditive | null> {
  try {
    console.log(`🔵 Fetching food additive with E-code: ${eCode}`);

    const snapshot = await db
      .collection('foodAdditives')
      .where('eCode', '==', eCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`⚠️ No food additive found with E-code: ${eCode}`);
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const additive: FoodAdditive = {
      id: doc.id,
      eCode: data.eCode || '',
      category: data.category || '',
      chemicalName: data.chemicalName || '',
      description: data.description || '',
      status: data.status || '',
    };

    console.log(`✅ Retrieved food additive: ${additive.chemicalName}`);
    return additive;
  } catch (error) {
    console.error(`❌ Error fetching food additive with E-code ${eCode}:`, error);
    throw error;
  }
}

/**
 * Fetch food additives by status
 */
export async function fetchFoodAdditivesByStatus(status: string): Promise<FoodAdditive[]> {
  try {
    console.log(`🔵 Fetching food additives with status: ${status}`);

    const snapshot = await db
      .collection('foodAdditives')
      .where('status', '==', status)
      .get();

    if (snapshot.empty) {
      console.log(`⚠️ No food additives found with status: ${status}`);
      return [];
    }

    const additives: FoodAdditive[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        eCode: data.eCode || '',
        category: data.category || '',
        chemicalName: data.chemicalName || '',
        description: data.description || '',
        status: data.status || '',
      };
    });

    console.log(`✅ Retrieved ${additives.length} food additives with status: ${status}`);
    return additives;
  } catch (error) {
    console.error(`❌ Error fetching food additives with status ${status}:`, error);
    throw error;
  }
}

/**
 * Fetch food additives by category
 */
export async function fetchFoodAdditivesByCategory(category: string): Promise<FoodAdditive[]> {
  try {
    console.log(`🔵 Fetching food additives in category: ${category}`);

    const snapshot = await db
      .collection('foodAdditives')
      .where('category', '==', category)
      .get();

    if (snapshot.empty) {
      console.log(`⚠️ No food additives found in category: ${category}`);
      return [];
    }

    const additives: FoodAdditive[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        eCode: data.eCode || '',
        category: data.category || '',
        chemicalName: data.chemicalName || '',
        description: data.description || '',
        status: data.status || '',
      };
    });

    console.log(`✅ Retrieved ${additives.length} food additives in category: ${category}`);
    return additives;
  } catch (error) {
    console.error(`❌ Error fetching food additives in category ${category}:`, error);
    throw error;
  }
}