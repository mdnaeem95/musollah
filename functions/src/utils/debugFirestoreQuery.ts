/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Debug Firestore Query
 *
 * Let's see what's actually in the database
 */
export const debugFirestoreQuery = onRequest(
  {
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    const db = admin.firestore();

    try {
      console.log("🔍 Checking Firestore...");

      // Test 1: Get ALL restaurants (no filters)
      const allSnapshot = await db.collection("restaurants").limit(5).get();

      console.log(`📊 Total restaurants found: ${allSnapshot.size}`);

      // Test 2: Check first restaurant structure
      if (allSnapshot.size > 0) {
        const firstDoc = allSnapshot.docs[0];
        const data = firstDoc.data();
        console.log("📄 First restaurant data:", {
          id: firstDoc.id,
          name: data.name,
          source: data.source,
          isActive: data.isActive,
          active: data.active, // Maybe it's called 'active'?
          needsReview: data.needsReview,
          hasCreatedAt: !!data.createdAt,
          hasOperatingHours: !!data.operatingHours,
          hasPhoneNumber: !!data.phoneNumber,
          allFields: Object.keys(data),
        });
      }

      // Test 3: Try different source values
      const muisSnapshot = await db
        .collection("restaurants")
        .where("source", "==", "muis")
        .limit(5)
        .get();

      console.log(`🏪 Restaurants with source='muis': ${muisSnapshot.size}`);

      // Test 4: Try with isActive
      try {
        const activeSnapshot = await db
          .collection("restaurants")
          .where("isActive", "==", true)
          .limit(5)
          .get();
        console.log(`✅ Restaurants with isActive=true: ${activeSnapshot.size}`);
      } catch (error: any) {
        console.log(`❌ isActive query failed: ${error.message}`);
      }

      // Test 5: Try the compound query
      try {
        const compoundSnapshot = await db
          .collection("restaurants")
          .where("source", "==", "muis")
          .where("isActive", "==", true)
          .limit(5)
          .get();
        console.log(`🔗 Compound query (source + isActive): ${compoundSnapshot.size}`);
      } catch (error: any) {
        console.log(`❌ Compound query failed: ${error.message}`);
      }

      // Test 6: Get sample MUIS restaurants
      const muisDocs = muisSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        source: doc.data().source,
        isActive: doc.data().isActive,
        needsReview: doc.data().needsReview,
        hasHours: !!doc.data().operatingHours,
        hasPhone: !!doc.data().phoneNumber,
      }));

      res.json({
        success: true,
        summary: {
          totalRestaurants: allSnapshot.size,
          muisRestaurants: muisSnapshot.size,
        },
        sampleRestaurant: allSnapshot.size > 0 ? {
          id: allSnapshot.docs[0].id,
          data: allSnapshot.docs[0].data(),
        } : null,
        muisSample: muisDocs,
      });
    } catch (error: any) {
      console.error("❌ Error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack,
      });
    }
  }
);
