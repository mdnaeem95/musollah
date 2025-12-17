/* eslint-disable valid-jsdoc */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
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
 * MUIS Discovery Scraper
 *
 * Fetches ALL halal-certified establishments from MUIS
 * Creates new restaurant entries for ones not in database
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
 * URL: ?dryRun=true&limit=50
 */
export const testMuisDiscovery = onRequest({
  memory: "2GiB",
  timeoutSeconds: 540,
  cors: true,
  invoker: "public",
}, async (request, response) => {
  const dryRun = request.query.dryRun !== "false";
  const limit = parseInt(request.query.limit as string) || 50;

  try {
    const result = await runDiscovery(dryRun, limit);
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
async function runDiscovery(dryRun = false, limit?: number) {
  const startTime = Date.now();
  const db = admin.firestore();

  logger.info("🔍 Starting MUIS discovery scraper...", {dryRun, limit});

  try {
    // Step 1: Get CSRF token
    logger.info("Getting CSRF token...");
    const {csrfToken, cookies} = await getMuisSession();

    if (!csrfToken) {
      throw new Error("Failed to get CSRF token");
    }

    logger.info("✅ Got CSRF token");

    // Step 2: Fetch ALL establishments from MUIS
    logger.info("Fetching all MUIS establishments...");
    const allEstablishments = await fetchAllMUISEstablishments(csrfToken, cookies, limit);

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
        subScheme.includes("canteen")
      );
    });

    logger.info(`🍽️ Filtered to ${restaurants.length} restaurants (excluding caterers, suppliers, etc.)`);

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
      const batch = db.batch();

      for (const est of newRestaurants) {
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
          location: new admin.firestore.GeoPoint(1.3521, 103.8198), // Singapore center - to be updated

          // Empty fields for manual completion
          categories: [],
          hours: "",
          number: "",
          image: "",
          socials: {},
          website: "",

          // Metadata
          isActive: true,
          needsReview: true, // 🚨 Flag for manual review
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
        });
      }

      await batch.commit();
      logger.info(`✅ Created ${created.length} new restaurant entries`);
    }

    // Step 7: Log results
    const summary = {
      muisTotalEstablishments: allEstablishments.length,
      muisRestaurants: restaurants.length,
      existingInDatabase: existingSnapshot.size,
      newDiscovered: newRestaurants.length,
      possibleDuplicates: possibleDuplicates.length,
      created: created.length,
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
      duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
      summary,
      newRestaurants: dryRun ? newRestaurants.slice(0, 10) : created, // Show first 10 in dry-run
      possibleDuplicates: possibleDuplicates.slice(0, 10), // Show first 10
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
 * Fetch ALL establishments from MUIS API with pagination
 */
async function fetchAllMUISEstablishments(
  csrfToken: string,
  cookies: string,
  limit?: number
): Promise<any[]> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const apiUrl = "https://halal.muis.gov.sg/api/halal/establishments";
  const allEstablishments: any[] = [];

  try {
    // First request to get total count
    const firstResponse = await axios.post(
      apiUrl,
      {
        text: "", // Empty search = all results
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

    const totalRecords = firstResponse.data?.totalRecords || 0;
    logger.info(`📊 Total MUIS records: ${totalRecords}`);

    // If limit specified (for testing), use that instead
    const recordsToFetch = limit ? Math.min(limit, totalRecords) : totalRecords;

    // Add first batch
    if (firstResponse.data?.data) {
      allEstablishments.push(...firstResponse.data.data);
    }

    // Fetch remaining pages
    const pageSize = 100; // Request 100 at a time
    const totalPages = Math.ceil(recordsToFetch / pageSize);

    for (let page = 1; page < totalPages; page++) {
      logger.info(`Fetching page ${page + 1}/${totalPages}...`);

      const response = await axios.post(
        apiUrl,
        {
          text: "",
          start: page * pageSize,
          length: pageSize,
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

      if (response.data?.data) {
        allEstablishments.push(...response.data.data);
      }

      // Rate limiting
      await sleep(300);

      // Stop if we've reached the limit (for testing)
      if (limit && allEstablishments.length >= limit) {
        break;
      }
    }

    logger.info(`✅ Fetched ${allEstablishments.length} establishments`);
    return allEstablishments;
  } catch (error) {
    logger.error("Error fetching MUIS establishments:", error);
    throw error;
  }
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
