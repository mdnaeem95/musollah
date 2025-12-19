/* eslint-disable max-len */
import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * One-time migration: Fix MUIS Discovery restaurants
 *
 * Changes:
 * 1. Rename website → menuUrl (if exists)
 * 2. Add averageRating: 0 (if missing)
 * 3. Add totalReviews: 0 (if missing)
 * 4. Remove old website field
 *
 * URL: ?dryRun=true (test first)
 */
export const migrateRestaurantSchema = onRequest({
  memory: "1GiB",
  timeoutSeconds: 540,
  cors: true,
  invoker: "public",
}, async (request, response) => {
  const dryRun = request.query.dryRun !== "false";
  const db = admin.firestore();

  logger.info("🔧 Starting restaurant schema migration...", {dryRun});

  try {
    // Get all needsReview restaurants (the 438 from MUIS discovery)
    const snapshot = await db
      .collection("restaurants")
      .where("needsReview", "==", true)
      .get();

    logger.info(`Found ${snapshot.size} restaurants needing schema migration`);

    const updates: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const changes: any = {};
      let needsUpdate = false;

      // 1. Check if has old 'website' field
      if ("website" in data) {
        changes.menuUrl = data.website || "";
        changes.website = admin.firestore.FieldValue.delete();
        needsUpdate = true;
      }

      // 2. Add menuUrl if completely missing
      if (!("menuUrl" in data) && !("website" in data)) {
        changes.menuUrl = "";
        needsUpdate = true;
      }

      // 3. Add averageRating if missing
      if (!("averageRating" in data)) {
        changes.averageRating = 0;
        needsUpdate = true;
      }

      // 4. Add totalReviews if missing
      if (!("totalReviews" in data)) {
        changes.totalReviews = 0;
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.push({
          id: doc.id,
          name: data.name,
          changes,
        });
      }
    }

    logger.info(`${updates.length} restaurants need updates`);

    // Apply updates in batches
    if (!dryRun && updates.length > 0) {
      const batchSize = 500;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = db.batch();
        const batchUpdates = updates.slice(i, i + batchSize);

        for (const update of batchUpdates) {
          const ref = db.collection("restaurants").doc(update.id);
          batch.update(ref, update.changes);
        }

        await batch.commit();
        logger.info(`✅ Migrated batch ${Math.floor(i / batchSize) + 1}`);
      }

      logger.info(`✅ Migration complete: ${updates.length} restaurants updated`);
    }

    response.json({
      success: true,
      dryRun,
      totalRestaurants: snapshot.size,
      needsUpdate: updates.length,
      sample: updates.slice(0, 5),
      message: dryRun ?
        `Would update ${updates.length} restaurants` :
        `Updated ${updates.length} restaurants`,
    });
  } catch (error) {
    logger.error("Migration error:", error);
    response.status(500).json({
      success: false,
      error: String(error),
    });
  }
});
