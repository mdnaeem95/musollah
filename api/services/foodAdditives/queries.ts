/**
 * Food Additives Firebase Queries (MODULAR + TYPED + STRUCTURED LOGGING)
 * 
 * Handles fetching halal food additive data (E-codes) from Firestore
 * with comprehensive validation and logging.
 * 
 * @version 2.0 - Structured logging migration
 */


import { db } from "../../client/firebase";
import { logger } from '../../../services/logging/logger';
import { collection, getDocs, limit, query, where, type FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { FoodAdditive } from "../../../functions/src/types";

const COLLECTION = "foodAdditives";

type FoodAdditiveDoc = Omit<FoodAdditive, "id">;

/**
 * Maps Firestore document to FoodAdditive type
 * 
 * @param {FirebaseFirestoreTypes.QueryDocumentSnapshot} docSnap - Firestore document
 * @returns {FoodAdditive} Mapped food additive
 */
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

/**
 * Gets typed reference to food additives collection
 * 
 * @returns {FirebaseFirestoreTypes.CollectionReference} Collection reference
 */
function foodAdditivesCollection() {
  return collection(db, COLLECTION) as unknown as FirebaseFirestoreTypes.CollectionReference<FoodAdditiveDoc>;
}

/**
 * Fetch all food additives from Firestore
 * 
 * @async
 * @function fetchFoodAdditives
 * @returns {Promise<FoodAdditive[]>} Array of all food additives
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const additives = await fetchFoodAdditives();
 * console.log(`Loaded ${additives.length} additives`);
 */
export async function fetchFoodAdditives(): Promise<FoodAdditive[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching food additives from Firestore', {
      collection: COLLECTION,
    });

    const snapshot = await getDocs(foodAdditivesCollection());

    if (snapshot.empty) {
      const duration = Math.round(performance.now() - startTime);
      logger.warn('No food additives found', {
        collection: COLLECTION,
        duration: `${duration}ms`,
      });
      return [];
    }

    const additives = snapshot.docs.map(mapDocToFoodAdditive);
    const duration = Math.round(performance.now() - startTime);

    logger.success('Food additives fetched successfully', {
      count: additives.length,
      duration: `${duration}ms`,
      source: 'Firestore',
      collection: COLLECTION,
    });
    
    return additives;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch food additives', {
      error: error.message,
      duration: `${duration}ms`,
      collection: COLLECTION,
    });
    
    throw error;
  }
}

/**
 * Fetch a single food additive by E-code
 * 
 * @async
 * @function fetchFoodAdditiveByECode
 * @param {string} eCode - E-code to search for (e.g., "100", "200")
 * @returns {Promise<FoodAdditive | null>} Food additive or null if not found
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const additive = await fetchFoodAdditiveByECode('100');
 * if (additive) {
 *   console.log(`Found: ${additive.chemicalName}`);
 * }
 */
export async function fetchFoodAdditiveByECode(
  eCode: string
): Promise<FoodAdditive | null> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching food additive by E-code', {
      eCode,
      collection: COLLECTION,
    });

    const colRef = foodAdditivesCollection();
    const q = query(colRef, where("eCode", "==", eCode), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('Food additive not found', {
        eCode,
        duration: `${duration}ms`,
      });
      return null;
    }

    const additive = mapDocToFoodAdditive(snapshot.docs[0]);
    const duration = Math.round(performance.now() - startTime);

    logger.success('Food additive found', {
      eCode,
      chemicalName: additive.chemicalName,
      status: additive.status,
      duration: `${duration}ms`,
    });
    
    return additive;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch food additive by E-code', {
      error: error.message,
      eCode,
      duration: `${duration}ms`,
      collection: COLLECTION,
    });
    
    throw error;
  }
}

/**
 * Fetch food additives by status (Ok/Not Ok)
 * 
 * @async
 * @function fetchFoodAdditivesByStatus
 * @param {string} status - Status to filter by ("Ok" or "Not Ok")
 * @returns {Promise<FoodAdditive[]>} Array of matching additives
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const halalAdditives = await fetchFoodAdditivesByStatus('Ok');
 * console.log(`${halalAdditives.length} halal additives`);
 */
export async function fetchFoodAdditivesByStatus(
  status: string
): Promise<FoodAdditive[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching food additives by status', {
      status,
      collection: COLLECTION,
    });

    const colRef = foodAdditivesCollection();
    const q = query(colRef, where("status", "==", status));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('No food additives found for status', {
        status,
        duration: `${duration}ms`,
      });
      return [];
    }

    const additives = snapshot.docs.map(mapDocToFoodAdditive);
    const duration = Math.round(performance.now() - startTime);

    logger.success('Food additives fetched by status', {
      status,
      count: additives.length,
      duration: `${duration}ms`,
      source: 'Firestore',
    });
    
    return additives;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch food additives by status', {
      error: error.message,
      status,
      duration: `${duration}ms`,
      collection: COLLECTION,
    });
    
    throw error;
  }
}

/**
 * Fetch food additives by category
 * 
 * @async
 * @function fetchFoodAdditivesByCategory
 * @param {string} category - Category to filter by (e.g., "Antioxidant", "Preservative")
 * @returns {Promise<FoodAdditive[]>} Array of matching additives
 * @throws {Error} If Firestore query fails
 * 
 * @example
 * const antioxidants = await fetchFoodAdditivesByCategory('Antioxidant');
 * console.log(`${antioxidants.length} antioxidants`);
 */
export async function fetchFoodAdditivesByCategory(
  category: string
): Promise<FoodAdditive[]> {
  const startTime = performance.now();
  
  try {
    logger.debug('Fetching food additives by category', {
      category,
      collection: COLLECTION,
    });

    const colRef = foodAdditivesCollection();
    const q = query(colRef, where("category", "==", category));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('No food additives found for category', {
        category,
        duration: `${duration}ms`,
      });
      return [];
    }

    const additives = snapshot.docs.map(mapDocToFoodAdditive);
    const duration = Math.round(performance.now() - startTime);

    logger.success('Food additives fetched by category', {
      category,
      count: additives.length,
      duration: `${duration}ms`,
      source: 'Firestore',
    });
    
    return additives;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch food additives by category', {
      error: error.message,
      category,
      duration: `${duration}ms`,
      collection: COLLECTION,
    });
    
    throw error;
  }
}