/**
 * Food Additives Firebase Queries (MODULAR + TYPED)
 */

import { FoodAdditive } from "../../../utils/types";
import { db } from "../../client/firebase";

import {
  collection,
  getDocs,
  limit,
  query,
  where,
  type FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

const COLLECTION = "foodAdditives";

type FoodAdditiveDoc = Omit<FoodAdditive, "id">;

function mapDocToFoodAdditive(
  docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot<FoodAdditiveDoc>
): FoodAdditive {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    eCode: data.eCode ?? "",
    chemicalName: data.chemicalName ?? "",
    category: data.category ?? "",
    description: data.description ?? "",
    status: data.status ?? "",
  };
}

function foodAdditivesCollection() {
  return collection(db, COLLECTION) as unknown as FirebaseFirestoreTypes.CollectionReference<FoodAdditiveDoc>;
}

/**
 * Fetch all food additives from Firestore
 */
export async function fetchFoodAdditives(): Promise<FoodAdditive[]> {
  try {
    console.log("🔵 Fetching food additives from Firestore");

    const snapshot = await getDocs(foodAdditivesCollection());

    if (snapshot.empty) {
      console.log("⚠️ No food additives found");
      return [];
    }

    const additives = snapshot.docs.map(mapDocToFoodAdditive);

    console.log(`✅ Retrieved ${additives.length} food additives`);
    return additives;
  } catch (error) {
    console.error("❌ Error fetching food additives:", error);
    throw error;
  }
}

/**
 * Fetch a single food additive by E-code
 */
export async function fetchFoodAdditiveByECode(
  eCode: string
): Promise<FoodAdditive | null> {
  try {
    console.log(`🔵 Fetching food additive with E-code: ${eCode}`);

    const colRef = foodAdditivesCollection();
    const q = query(colRef, where("eCode", "==", eCode), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`⚠️ No food additive found with E-code: ${eCode}`);
      return null;
    }

    const additive = mapDocToFoodAdditive(snapshot.docs[0]);

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
export async function fetchFoodAdditivesByStatus(
  status: string
): Promise<FoodAdditive[]> {
  try {
    console.log(`🔵 Fetching food additives with status: ${status}`);

    const colRef = foodAdditivesCollection();
    const q = query(colRef, where("status", "==", status));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`⚠️ No food additives found with status: ${status}`);
      return [];
    }

    const additives = snapshot.docs.map(mapDocToFoodAdditive);

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
export async function fetchFoodAdditivesByCategory(
  category: string
): Promise<FoodAdditive[]> {
  try {
    console.log(`🔵 Fetching food additives in category: ${category}`);

    const colRef = foodAdditivesCollection();
    const q = query(colRef, where("category", "==", category));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`⚠️ No food additives found in category: ${category}`);
      return [];
    }

    const additives = snapshot.docs.map(mapDocToFoodAdditive);

    console.log(`✅ Retrieved ${additives.length} food additives in category: ${category}`);
    return additives;
  } catch (error) {
    console.error(`❌ Error fetching food additives in category ${category}:`, error);
    throw error;
  }
}
