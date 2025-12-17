/* eslint-disable max-len */
/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import axios from "axios";
import https from "https";
import {DryRunManager} from "../utils/dryRun";
import {Restaurant, RestaurantUpdate} from "../types";

/**
 * Test MUIS Scraper with CSRF token handling
 */
export const testMuisScraper = onRequest({
  memory: "1GiB",
  timeoutSeconds: 540,
  cors: true,
  invoker: "public",
}, async (request, response) => {
  const startTime = Date.now();
  const db = getFirestore();

  const dryRunMode = request.query.dryRun !== "false";
  const limit = parseInt(request.query.limit as string) || 5;

  const dryRun = new DryRunManager(dryRunMode);

  logger.info("🕌 Testing MUIS certification scraper (with CSRF)...", {
    dryRun: dryRunMode,
    limit,
  });

  try {
    // Get CSRF token first
    logger.info("Step 1: Getting CSRF token...");
    const {csrfToken, cookies} = await getMuisSession();

    if (!csrfToken) {
      throw new Error("Failed to get CSRF token");
    }

    logger.info("✅ Got CSRF token");

    const restaurantsSnapshot = await db
      .collection("restaurants")
      .limit(limit)
      .get();

    if (restaurantsSnapshot.empty) {
      logger.warn("⚠️ No restaurants found");
      response.json({
        success: false,
        message: "No restaurants found in database",
      });
      return;
    }

    logger.info(`📊 Checking ${restaurantsSnapshot.size} restaurants for MUIS certification`);

    const updates: RestaurantUpdate[] = [];
    const errors: string[] = [];
    const results: any[] = [];

    for (const doc of restaurantsSnapshot.docs) {
      const restaurant = doc.data() as Restaurant;

      logger.info(`Checking: ${restaurant.name}`);

      try {
        const certificationResult = await checkMUISCertificationAPI(
          restaurant.name,
          restaurant.address,
          csrfToken,
          cookies
        );

        const {status, details} = certificationResult;

        logger.info(`${restaurant.name} → ${status}`, details ? {certNumber: details.number} : {});

        results.push({
          id: doc.id,
          name: restaurant.name,
          currentStatus: restaurant.status,
          scrapedStatus: status,
          changed: status !== "Unknown" && status !== restaurant.status,
          details: details ? {
            certNumber: details.number,
            scheme: details.schemeText,
            subScheme: details.subSchemeText,
            address: details.address,
            postal: details.postal,
          } : null,
        });

        // Create update if status changed
        if (status !== "Unknown" && status !== restaurant.status) {
          const update: RestaurantUpdate = {
            restaurantId: doc.id,
            field: "status",
            oldValue: restaurant.status,
            newValue: status,
            source: "MUIS API",
            confidence: 1.0,
            timestamp: Timestamp.now(),
            status: "pending",
          };

          await dryRun.recordUpdate(update);
          updates.push(update);
        }

        // Rate limiting
        await sleep(500);
      } catch (error) {
        const errorMsg = `Error checking ${restaurant.name}: ${error}`;
        logger.error(errorMsg);
        errors.push(errorMsg);

        results.push({
          id: doc.id,
          name: restaurant.name,
          error: String(error),
        });
      }
    }

    await dryRun.saveDryRunResults();

    const summary = dryRun.getSummary();
    const duration = Date.now() - startTime;

    logger.info("📈 MUIS Scraper Summary:", {
      dryRun: dryRunMode,
      restaurantsChecked: restaurantsSnapshot.size,
      updatesFound: updates.length,
      errors: errors.length,
      duration,
    });

    await db.collection("scraper_logs").add({
      scraper: "MUIS_API_test",
      timestamp: Timestamp.now(),
      restaurantsChecked: restaurantsSnapshot.size,
      updatesFound: updates.length,
      errors,
      duration,
      dryRun: dryRunMode,
    });

    response.json({
      success: true,
      dryRun: dryRunMode,
      restaurantsChecked: restaurantsSnapshot.size,
      updatesFound: updates.length,
      errorsCount: errors.length,
      duration: `${(duration / 1000).toFixed(2)}s`,
      summary,
      results,
      message: dryRunMode ?
        "Dry-run complete. Check dry_run_results collection in Firestore" :
        "Updates recorded in restaurant_updates collection",
    });
  } catch (error) {
    logger.error("❌ MUIS scraper test failed:", error);
    response.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * Get CSRF token and session cookies from MUIS website
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

    // Extract CSRF token from HTML
    const html = response.data;

    // Look for CSRF token in various common patterns
    let csrfToken: string | null = null;

    // Pattern 1: <input name="__RequestVerificationToken" value="TOKEN">
    const inputMatch = html.match(/<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"/i);
    if (inputMatch) {
      csrfToken = inputMatch[1];
    }

    // Pattern 2: meta tag
    if (!csrfToken) {
      const metaMatch = html.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/i);
      if (metaMatch) {
        csrfToken = metaMatch[1];
      }
    }

    // Pattern 3: JavaScript variable
    if (!csrfToken) {
      const scriptMatch = html.match(/csrfToken["\s]*[:=]["\s]*["']([^"']+)["']/i);
      if (scriptMatch) {
        csrfToken = scriptMatch[1];
      }
    }

    // Get cookies from response
    const setCookieHeaders = response.headers["set-cookie"] || [];
    const cookies = setCookieHeaders.join("; ");

    logger.info("Session info:", {
      csrfTokenFound: !!csrfToken,
      csrfTokenLength: csrfToken?.length || 0,
      cookiesCount: setCookieHeaders.length,
    });

    return {csrfToken, cookies};
  } catch (error) {
    logger.error("Error getting MUIS session:", error);
    return {csrfToken: null, cookies: ""};
  }
}

/**
 * Check MUIS certification using API with CSRF token
 */
async function checkMUISCertificationAPI(
  restaurantName: string,
  address: string,
  csrfToken: string,
  cookies: string
): Promise<{
  status: string;
  details?: any;
}> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    const apiUrl = "https://halal.muis.gov.sg/api/halal/establishments";

    logger.info(`Searching MUIS API for: ${restaurantName}`);

    // Make API request with correct format
    const response = await axios.post(
      apiUrl,
      {
        text: restaurantName, // ✅ Correct format!
      },
      {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-CSRF-TOKEN": csrfToken, // ✅ CSRF token
          "Cookie": cookies, // ✅ Session cookies
          "Origin": "https://halal.muis.gov.sg",
          "Referer": "https://halal.muis.gov.sg/",
        },
        timeout: 30000,
      }
    );

    logger.info("MUIS API response received", {
      totalRecords: response.data?.totalRecords || 0,
      results: response.data?.data?.length || 0,
    });

    const establishments = response.data?.data;

    if (!Array.isArray(establishments) || establishments.length === 0) {
      logger.info(`No MUIS certification found for: ${restaurantName}`);
      return {status: "Not Certified"};
    }

    // Search for match
    return searchEstablishments(establishments, restaurantName, address);
  } catch (error: any) {
    logger.error(`Error checking MUIS API for ${restaurantName}:`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return {status: "Unknown"};
  }
}

/**
 * Search for matching establishment
 */
function searchEstablishments(
  establishments: any[],
  restaurantName: string,
  address: string
): { status: string; details?: any } {
  const searchName = restaurantName.toLowerCase().trim();

  // Exact match
  let match = establishments.find((est) => {
    const apiName = est.name.toLowerCase().trim();
    return apiName === searchName;
  });

  // Partial match
  if (!match) {
    match = establishments.find((est) => {
      const apiName = est.name.toLowerCase().trim();
      return apiName.includes(searchName) || searchName.includes(apiName);
    });
  }

  // Postal code match
  if (!match && address) {
    match = establishments.find((est) => {
      return address.includes(est.postal);
    });
  }

  if (match) {
    logger.info("✅ MUIS certification found!", {
      name: match.name,
      certNumber: match.number,
      scheme: match.schemeText,
    });

    return {
      status: "MUIS Halal-Certified",
      details: match,
    };
  }

  logger.info(`No MUIS match found for: ${restaurantName}`);
  return {status: "Not Certified"};
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
