/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as admin from "firebase-admin";
import axios from "axios";
import https from "https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * MUIS Discovery Scraper - Alphabet Sweep Strategy
 *
 * Since the API doesn't support "get all", we search by letter (a-z, 0-9)
 * and combine/deduplicate the results.
 *
 * Runs: Weekly on Saturdays at 1 AM SGT (or manually)
 */
export const discoverMUISRestaurants = onSchedule(
  {
    schedule: "0 1 * * 6", // Saturday 1 AM
    timeZone: "Asia/Singapore",
    timeoutSeconds: 540,
    memory: "2GiB",
  },
  async (event) => {
    void event;
    await runDiscovery(false);
  }
);

/**
 * Manual test version (HTTP-triggered)
 *
 * URL: ?dryRun=true&testMode=true
 * testMode: Only searches 'a' and 'b' for quick testing
 */
export const testMuisDiscovery = onRequest({
  memory: "2GiB",
  timeoutSeconds: 540,
  cors: true,
  invoker: "public",
}, async (request, response) => {
  const dryRun = request.query.dryRun !== "false";
  const testMode = request.query.testMode === "true"; // Quick test with just a few letters

  try {
    const result = await runDiscovery(dryRun, testMode);
    response.json(result);
  } catch (error) {
    logger.error("Discovery test failed:", error);
    response.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * Main discovery logic
 */
async function runDiscovery(dryRun = false, testMode = false) {
  const startTime = Date.now();
  const db = admin.firestore();

  logger.info("🔍 Starting MUIS discovery scraper...", {dryRun, testMode});

  try {
    // Step 1: Get CSRF token
    logger.info("Getting CSRF token...");
    const {csrfToken, cookies} = await getMuisSession();

    if (!csrfToken) {
      throw new Error("Failed to get CSRF token");
    }

    logger.info("✅ Got CSRF token");

    // Step 2: Fetch ALL establishments using alphabet sweep
    logger.info("Fetching all MUIS establishments (alphabet sweep)...");
    const allEstablishments = await fetchAllMUISEstablishments(csrfToken, cookies, testMode);

    logger.info(`📊 Found ${allEstablishments.length} total establishments from MUIS`);

    // Step 3: Filter to only restaurants (not caterers, suppliers, etc.)
    const restaurants = allEstablishments.filter((est) => {
      const scheme = est.schemeText?.toLowerCase() || "";
      const subScheme = est.subSchemeText?.toLowerCase() || "";

      // Include: Eating Establishments, Restaurants, Cafes, Food Courts
      return (
        scheme.includes("eating") ||
        scheme.includes("restaurant") ||
        subScheme.includes("restaurant") ||
        subScheme.includes("cafe") ||
        subScheme.includes("food court") ||
        subScheme.includes("canteen") ||
        subScheme.includes("hawker")
      );
    });

    logger.info(`🍽️ Filtered to ${restaurants.length} restaurants (excluding caterers, suppliers, etc.)`);

    // Log scheme breakdown
    const schemeBreakdown: any = {};
    restaurants.forEach((r) => {
      const key = `${r.schemeText} - ${r.subSchemeText}`;
      schemeBreakdown[key] = (schemeBreakdown[key] || 0) + 1;
    });
    logger.info("📊 Scheme breakdown:", schemeBreakdown);

    // Step 4: Get existing restaurants from database
    const existingSnapshot = await db.collection("restaurants").get();
    const existingNames = new Set(
      existingSnapshot.docs.map((doc) => doc.data().name.toLowerCase().trim())
    );
    const existingPostals = new Set(
      existingSnapshot.docs.map((doc) => doc.data().address).filter(Boolean).map((addr: string) => {
        const match = addr.match(/\d{6}/); // Singapore postal code
        return match ? match[0] : null;
      }).filter(Boolean)
    );

    logger.info(`📚 Existing database: ${existingSnapshot.size} restaurants`);

    // Step 5: Find new restaurants not in database
    const newRestaurants: any[] = [];
    const possibleDuplicates: any[] = [];

    for (const est of restaurants) {
      const estName = est.name.toLowerCase().trim();
      const estPostal = est.postal;

      // Check if already exists by name
      if (existingNames.has(estName)) {
        continue; // Skip - already in database
      }

      // Check if exists by postal code (might be name variation)
      if (existingPostals.has(estPostal)) {
        possibleDuplicates.push({
          muisName: est.name,
          muisPostal: estPostal,
          muisAddress: est.address,
          certNumber: est.number,
          scheme: est.schemeText,
          subScheme: est.subSchemeText,
        });
        continue; // Skip - possible duplicate
      }

      // This is a new restaurant!
      newRestaurants.push(est);
    }

    logger.info(`✨ Found ${newRestaurants.length} NEW restaurants`);
    logger.info(`⚠️ Found ${possibleDuplicates.length} possible duplicates (same postal)`);

    // Step 6: Create new restaurant entries
    const created: any[] = [];

    if (!dryRun && newRestaurants.length > 0) {
      // Process in batches of 500 (Firestore limit)
      const batchSize = 500;
      for (let i = 0; i < newRestaurants.length; i += batchSize) {
        const batch = db.batch();
        const batchItems = newRestaurants.slice(i, i + batchSize);

        for (const est of batchItems) {
          const newRestaurantRef = db.collection("restaurants").doc();

          const newRestaurant = {
            // From MUIS
            name: est.name,
            address: est.address,
            postal: est.postal,
            status: "MUIS Halal-Certified",
            muisCertNumber: est.number,
            muisScheme: est.schemeText,
            muisSubScheme: est.subSchemeText,

            // Extract coordinates from postal (or set to Singapore default)
            location: new admin.firestore.GeoPoint(1.3521, 103.8198),

            // Required fields (empty for manual completion)
            categories: [],
            hours: "",
            number: "",
            image: "",
            socials: {},

            // Optional fields
            menuUrl: "", // ✅ Changed from website
            averageRating: 0, // ✅ Added
            totalReviews: 0, // ✅ Added

            // Metadata
            isActive: true,
            needsReview: true,
            source: "MUIS Discovery",
            createdAt: admin.firestore.Timestamp.now(),
            lastVerified: admin.firestore.Timestamp.now(),
            lastUpdated: admin.firestore.Timestamp.now(),
          };

          batch.set(newRestaurantRef, newRestaurant);

          created.push({
            id: newRestaurantRef.id,
            name: est.name,
            address: est.address,
            certNumber: est.number,
            scheme: est.schemeText,
            subScheme: est.subSchemeText,
          });
        }

        await batch.commit();
        logger.info(`✅ Created batch ${i / batchSize + 1}: ${batchItems.length} restaurants`);
      }

      logger.info(`✅ Created ${created.length} new restaurant entries total`);
    }

    // Step 7: Log results
    const summary = {
      muisTotalEstablishments: allEstablishments.length,
      muisRestaurants: restaurants.length,
      existingInDatabase: existingSnapshot.size,
      newDiscovered: newRestaurants.length,
      possibleDuplicates: possibleDuplicates.length,
      created: created.length,
      testMode,
      schemeBreakdown,
    };

    await db.collection("scraper_logs").add({
      scraper: "MUIS_Discovery",
      timestamp: admin.firestore.Timestamp.now(),
      ...summary,
      duration: Date.now() - startTime,
      dryRun,
    });

    logger.info("📈 Discovery Summary:", summary);

    return {
      success: true,
      dryRun,
      testMode,
      duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
      summary,
      newRestaurants: dryRun ? newRestaurants.slice(0, 20) : created.slice(0, 20), // Show first 20
      possibleDuplicates: possibleDuplicates.slice(0, 20), // Show first 20
      message: dryRun ?
        `Dry-run: Would create ${newRestaurants.length} new restaurants` :
        `Created ${created.length} new restaurants (marked for review)`,
    };
  } catch (error) {
    logger.error("❌ Discovery scraper error:", error);

    try {
      await db.collection("scraper_logs").add({
        scraper: "MUIS_Discovery",
        timestamp: admin.firestore.Timestamp.now(),
        errors: [String(error)],
        duration: Date.now() - startTime,
        dryRun,
      });
    } catch (e) {
      logger.error("Failed to write error log:", e);
    }

    throw error;
  }
}

/**
 * Fetch ALL establishments from MUIS API using alphabet sweep
 *
 * Strategy: Search for each letter (a-z) and number (0-9) individually,
 * then combine and deduplicate results.
 */
async function fetchAllMUISEstablishments(
  csrfToken: string,
  cookies: string,
  testMode = false
): Promise<any[]> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const apiUrl = "https://halal.muis.gov.sg/api/halal/establishments";

  // Full alphabet + numbers
  const searchTerms = testMode ?
    ["a", "b", "c"] : // Quick test with just 3 letters
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
      "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  const allEstablishments: any[] = [];
  const seenIds = new Set<string>();

  logger.info(`🔄 Searching ${searchTerms.length} terms (alphabet sweep)...`);

  for (const term of searchTerms) {
    try {
      logger.info(`Searching: "${term}"...`);

      const response = await axios.post(
        apiUrl,
        {
          text: term,
        },
        {
          httpsAgent,
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "X-CSRF-TOKEN": csrfToken,
            "Cookie": cookies,
            "Origin": "https://halal.muis.gov.sg",
            "Referer": "https://halal.muis.gov.sg/",
          },
          timeout: 30000,
        }
      );

      const data = response.data?.data || [];
      const totalRecords = response.data?.totalRecords || 0;

      logger.info(`  Found ${totalRecords} results for "${term}" (returned ${data.length})`);

      // Add unique establishments (deduplicate by ID)
      let newCount = 0;
      for (const est of data) {
        if (!seenIds.has(est.id)) {
          seenIds.add(est.id);
          allEstablishments.push(est);
          newCount++;
        }
      }

      logger.info(`  Added ${newCount} new unique establishments`);

      // Rate limiting (be respectful to MUIS server)
      await sleep(300);
    } catch (error) {
      logger.error(`Error searching "${term}":`, error);
      // Continue with next term even if one fails
    }
  }

  logger.info(`✅ Alphabet sweep complete: ${allEstablishments.length} unique establishments`);
  return allEstablishments;
}

/**
 * Get CSRF token and session cookies
 */
async function getMuisSession(): Promise<{
  csrfToken: string | null;
  cookies: string;
}> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    const response = await axios.get("https://halal.muis.gov.sg/", {
      httpsAgent,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const html = response.data;
    let csrfToken: string | null = null;

    // Try multiple patterns
    const inputMatch = html.match(/<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"/i);
    if (inputMatch) csrfToken = inputMatch[1];

    if (!csrfToken) {
      const metaMatch = html.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/i);
      if (metaMatch) csrfToken = metaMatch[1];
    }

    if (!csrfToken) {
      const scriptMatch = html.match(/csrfToken["\s]*[:=]["\s]*["']([^"']+)["']/i);
      if (scriptMatch) csrfToken = scriptMatch[1];
    }

    const setCookieHeaders = response.headers["set-cookie"] || [];
    const cookies = setCookieHeaders.join("; ");

    return {csrfToken, cookies};
  } catch (error) {
    logger.error("Error getting MUIS session:", error);
    return {csrfToken: null, cookies: ""};
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
