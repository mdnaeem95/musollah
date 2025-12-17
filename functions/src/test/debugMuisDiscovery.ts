/* eslint-disable max-len */
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import axios from "axios";
import https from "https";

/**
 * Debug MUIS Discovery - Test different approaches to get all establishments
 */
export const debugMuisDiscovery = onRequest({
  memory: "1GiB",
  timeoutSeconds: 120,
  cors: true,
  invoker: "public",
}, async (request, response) => {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const apiUrl = "https://halal.muis.gov.sg/api/halal/establishments";

  logger.info("🔍 Testing different approaches to fetch all MUIS establishments");

  const results: any = {
    tests: [],
  };

  try {
    // Get CSRF token
    logger.info("Getting CSRF token...");
    const sessionResponse = await axios.get("https://halal.muis.gov.sg/", {
      httpsAgent,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const html = sessionResponse.data;
    let csrfToken: string | null = null;

    const inputMatch = html.match(/<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"/i);
    if (inputMatch) csrfToken = inputMatch[1];

    const setCookieHeaders = sessionResponse.headers["set-cookie"] || [];
    const cookies = setCookieHeaders.join("; ");

    if (!csrfToken) {
      throw new Error("Failed to get CSRF token");
    }

    logger.info("✅ Got CSRF token");

    // Test 1: Empty text string
    logger.info("Test 1: Empty text string");
    try {
      const response1 = await axios.post(apiUrl, {
        text: "",
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "Cookie": cookies,
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://halal.muis.gov.sg",
          "Referer": "https://halal.muis.gov.sg/",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "Empty text string: {text: \"\"}",
        status: response1.status,
        totalRecords: response1.data?.totalRecords,
        dataLength: response1.data?.data?.length,
        sample: response1.data?.data?.slice(0, 2),
      });
    } catch (error: any) {
      results.tests.push({
        test: "Empty text string",
        error: error.message,
      });
    }

    // Test 2: No text parameter at all
    logger.info("Test 2: No text parameter");
    try {
      const response2 = await axios.post(apiUrl, {}, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "Cookie": cookies,
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://halal.muis.gov.sg",
          "Referer": "https://halal.muis.gov.sg/",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "No text parameter: {}",
        status: response2.status,
        totalRecords: response2.data?.totalRecords,
        dataLength: response2.data?.data?.length,
        sample: response2.data?.data?.slice(0, 2),
      });
    } catch (error: any) {
      results.tests.push({
        test: "No text parameter",
        error: error.message,
      });
    }

    // Test 3: Wildcard search
    logger.info("Test 3: Wildcard search");
    try {
      const response3 = await axios.post(apiUrl, {
        text: "*",
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "Cookie": cookies,
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://halal.muis.gov.sg",
          "Referer": "https://halal.muis.gov.sg/",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "Wildcard: {text: \"*\"}",
        status: response3.status,
        totalRecords: response3.data?.totalRecords,
        dataLength: response3.data?.data?.length,
        sample: response3.data?.data?.slice(0, 2),
      });
    } catch (error: any) {
      results.tests.push({
        test: "Wildcard",
        error: error.message,
      });
    }

    // Test 4: Space character
    logger.info("Test 4: Single space");
    try {
      const response4 = await axios.post(apiUrl, {
        text: " ",
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "Cookie": cookies,
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://halal.muis.gov.sg",
          "Referer": "https://halal.muis.gov.sg/",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "Single space: {text: \" \"}",
        status: response4.status,
        totalRecords: response4.data?.totalRecords,
        dataLength: response4.data?.data?.length,
        sample: response4.data?.data?.slice(0, 2),
      });
    } catch (error: any) {
      results.tests.push({
        test: "Single space",
        error: error.message,
      });
    }

    // Test 5: Common letter (should return many results)
    logger.info("Test 5: Letter \"a\"");
    try {
      const response5 = await axios.post(apiUrl, {
        text: "a",
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "Cookie": cookies,
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://halal.muis.gov.sg",
          "Referer": "https://halal.muis.gov.sg/",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "Letter \"a\": {text: \"a\"}",
        status: response5.status,
        totalRecords: response5.data?.totalRecords,
        dataLength: response5.data?.data?.length,
        sample: response5.data?.data?.slice(0, 2),
      });
    } catch (error: any) {
      results.tests.push({
        test: "Letter \"a\"",
        error: error.message,
      });
    }

    // Test 6: Pagination parameters
    logger.info("Test 6: With pagination");
    try {
      const response6 = await axios.post(apiUrl, {
        text: "",
        start: 0,
        length: 100,
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "Cookie": cookies,
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://halal.muis.gov.sg",
          "Referer": "https://halal.muis.gov.sg/",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "With pagination: {text: \"\", start: 0, length: 100}",
        status: response6.status,
        totalRecords: response6.data?.totalRecords,
        dataLength: response6.data?.data?.length,
        sample: response6.data?.data?.slice(0, 2),
      });
    } catch (error: any) {
      results.tests.push({
        test: "With pagination",
        error: error.message,
      });
    }

    response.json({
      success: true,
      results,
      summary: {
        totalTests: results.tests.length,
        successfulTests: results.tests.filter((t: any) => !t.error && (t.totalRecords || 0) > 0).length,
        recommendation: "Use the approach that returns the most totalRecords",
      },
    });
  } catch (error) {
    logger.error("Debug discovery error:", error);
    response.status(500).json({
      success: false,
      error: String(error),
      results,
    });
  }
});
