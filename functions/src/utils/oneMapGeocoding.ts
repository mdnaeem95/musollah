/* eslint-disable valid-jsdoc */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import axios from "axios";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * OneMap API - Singapore's Official Geocoding Service
 *
 * Converts postal codes to GPS coordinates
 * FREE (no API key required)
 *
 * Docs: https://www.onemap.gov.sg/apidocs/
 */

interface OneMapSearchResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string; // Longitude
  Y: string; // Latitude
  LATITUDE: string;
  LONGITUDE: string;
}

interface OneMapResponse {
  found: number;
  totalNumPages: number;
  pageNum: number;
  results: OneMapSearchResult[];
}

/**
 * Get coordinates from postal code using OneMap API
 * @param postal - 6-digit Singapore postal code
 * @return GeoPoint or null if not found
 */
export async function getCoordinatesFromPostal(
  postal: string
): Promise<admin.firestore.GeoPoint | null> {
  try {
    // Validate postal code (6 digits)
    if (!postal || !/^\d{6}$/.test(postal)) {
      logger.warn(`Invalid postal code: ${postal}`);
      return null;
    }

    logger.info(`🗺️ OneMap: Looking up postal ${postal}...`);

    const response = await axios.get<OneMapResponse>(
      "https://www.onemap.gov.sg/api/common/elastic/search",
      {
        params: {
          searchVal: postal,
          returnGeom: "Y",
          getAddrDetails: "Y",
          pageNum: 1,
        },
        timeout: 10000,
      }
    );

    if (response.data.found === 0) {
      logger.warn(`❌ OneMap: Postal ${postal} not found`);
      return null;
    }

    const result = response.data.results[0];
    const lat = parseFloat(result.LATITUDE);
    const lng = parseFloat(result.LONGITUDE);

    if (isNaN(lat) || isNaN(lng)) {
      logger.error(`Invalid coordinates from OneMap: ${result.LATITUDE}, ${result.LONGITUDE}`);
      return null;
    }

    logger.info(`✅ OneMap: ${postal} → (${lat}, ${lng})`);
    logger.info(`   Address: ${result.ADDRESS}`);

    return new admin.firestore.GeoPoint(lat, lng);
  } catch (error: any) {
    logger.error(`Error fetching coordinates for postal ${postal}:`, error.message);
    return null;
  }
}

/**
 * Batch convert multiple postal codes
 * Rate limited to 250 requests/minute (OneMap limit)
 * @param postals - Array of postal codes
 * @return Map of postal → coordinates
 */
export async function batchGetCoordinates(
  postals: string[]
): Promise<Map<string, admin.firestore.GeoPoint>> {
  const results = new Map<string, admin.firestore.GeoPoint>();

  for (const postal of postals) {
    const coords = await getCoordinatesFromPostal(postal);
    if (coords) {
      results.set(postal, coords);
    }

    // Rate limiting: 250/min = ~240ms between requests
    await sleep(250);
  }

  return results;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
