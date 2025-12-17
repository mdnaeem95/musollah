/* eslint-disable max-len */
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import {getFirestore} from "firebase-admin/firestore";
import {DryRunManager} from "../utils/dryRun";

export const testScraperManual = onRequest({
  memory: "1GiB",
  timeoutSeconds: 300,
  cors: true,
}, async (request, response) => {
  logger.info("🧪 Manual test scraper triggered via HTTP");

  const db = getFirestore();
  const dryRun = new DryRunManager(true);

  try {
    // FIXED: Remove isActive filter since field doesn't exist yet
    const snapshot = await db
      .collection("restaurants")
      .limit(5) // Just get first 5 restaurants
      .get();

    logger.info(`Testing with ${snapshot.size} restaurants`);

    // If no restaurants found, return early
    if (snapshot.empty) {
      logger.warn("⚠️ No restaurants found in database");
      response.json({
        success: false,
        message: "No restaurants found in database. Check your Firestore collection name.",
      });
      return;
    }

    // Process each restaurant
    for (const doc of snapshot.docs) {
      const restaurant = doc.data();

      logger.info(`Processing: ${restaurant.name}`);

      // Create a test update for each restaurant
      await dryRun.recordUpdate({
        restaurantId: doc.id,
        field: "hours",
        oldValue: restaurant.hours,
        newValue: "Monday-Sunday: 10:00-22:00 (TEST UPDATE)",
        source: "Manual Test",
        confidence: 1.0,
        timestamp: new Date(),
        status: "pending",
      });
    }

    const summary = dryRun.getSummary();

    logger.info("Summary:", summary);

    // Save results to Firestore
    await dryRun.saveDryRunResults();

    logger.info("✅ Test complete - Check dry_run_results collection");

    response.json({
      success: true,
      summary,
      restaurantsProcessed: snapshot.size,
      message: "Check dry_run_results collection in Firestore",
    });
  } catch (error) {
    logger.error("❌ Test failed:", error);
    response.status(500).json({
      success: false,
      error: String(error),
    });
  }
});
