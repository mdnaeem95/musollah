/* eslint-disable max-len */
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import axios from "axios";
import https from "https";

/**
 * Debug MUIS API - Try POST requests
 */
export const debugMuisApi = onRequest({
  memory: "512MiB",
  timeoutSeconds: 60,
  cors: true,
  invoker: "public",
}, async (request, response) => {
  const testName = (request.query.name as string) || "Carrara";

  logger.info(`🔍 Testing MUIS API with POST requests: ${testName}`);

  const apiUrl = "https://halal.muis.gov.sg/api/halal/establishments";

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const results: any = {
    testName,
    tests: [],
  };

  try {
    // Test 1: POST with empty body
    logger.info("Test 1: POST with empty body");
    try {
      const response1 = await axios.post(apiUrl, {}, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "MusollahApp/2.0",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "POST with empty body",
        status: response1.status,
        totalRecords: response1.data?.totalRecords,
        dataLength: response1.data?.data?.length,
        sampleData: response1.data?.data?.slice(0, 3),
      });

      logger.info("Test 1 success");
    } catch (error: any) {
      results.tests.push({
        test: "POST with empty body",
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Test 2: POST with search in body
    logger.info("Test 2: POST with search in body");
    try {
      const response2 = await axios.post(apiUrl, {
        search: testName,
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "MusollahApp/2.0",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "POST with search in body",
        status: response2.status,
        totalRecords: response2.data?.totalRecords,
        dataLength: response2.data?.data?.length,
        results: response2.data?.data,
      });

      logger.info("Test 2 success");
    } catch (error: any) {
      results.tests.push({
        test: "POST with search in body",
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Test 3: POST with DataTables format in body
    logger.info("Test 3: POST with DataTables format");
    try {
      const response3 = await axios.post(apiUrl, {
        start: 0,
        length: 100,
        search: {
          value: testName,
          regex: false,
        },
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "MusollahApp/2.0",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "POST with DataTables format",
        status: response3.status,
        totalRecords: response3.data?.totalRecords,
        dataLength: response3.data?.data?.length,
        results: response3.data?.data,
      });

      logger.info("Test 3 success");
    } catch (error: any) {
      results.tests.push({
        test: "POST with DataTables format",
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Test 4: POST with form data (application/x-www-form-urlencoded)
    logger.info("Test 4: POST with form data");
    try {
      const params = new URLSearchParams();
      params.append("start", "0");
      params.append("length", "100");
      params.append("search[value]", testName);

      const response4 = await axios.post(apiUrl, params, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "MusollahApp/2.0",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "POST with form data (urlencoded)",
        status: response4.status,
        totalRecords: response4.data?.totalRecords,
        dataLength: response4.data?.data?.length,
        results: response4.data?.data,
      });

      logger.info("Test 4 success");
    } catch (error: any) {
      results.tests.push({
        test: "POST with form data (urlencoded)",
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Test 5: POST with pagination only
    logger.info("Test 5: POST with pagination");
    try {
      const response5 = await axios.post(apiUrl, {
        start: 0,
        length: 50,
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "MusollahApp/2.0",
        },
        timeout: 30000,
      });

      // Try to find match in results
      const found = response5.data?.data?.find((est: any) =>
        est.name.toLowerCase().includes(testName.toLowerCase())
      );

      results.tests.push({
        test: "POST with pagination only",
        status: response5.status,
        totalRecords: response5.data?.totalRecords,
        dataLength: response5.data?.data?.length,
        foundMatch: !!found,
        matchDetails: found || null,
        firstThree: response5.data?.data?.slice(0, 3),
      });

      logger.info("Test 5 success");
    } catch (error: any) {
      results.tests.push({
        test: "POST with pagination only",
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Test 6: Try the actual URL format from MUIS website
    logger.info("Test 6: POST mimicking browser behavior");
    try {
      const response6 = await axios.post(apiUrl, {
        draw: 1,
        columns: [
          {data: "name", name: "", searchable: true, orderable: true, search: {value: "", regex: false}},
          {data: "number", name: "", searchable: true, orderable: true, search: {value: "", regex: false}},
          {data: "schemeText", name: "", searchable: true, orderable: true, search: {value: "", regex: false}},
          {data: "address", name: "", searchable: true, orderable: true, search: {value: "", regex: false}},
        ],
        order: [{column: 0, dir: "asc"}],
        start: 0,
        length: 10,
        search: {value: testName, regex: false},
      }, {
        httpsAgent,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://halal.muis.gov.sg/",
          "Origin": "https://halal.muis.gov.sg",
        },
        timeout: 30000,
      });

      results.tests.push({
        test: "POST mimicking browser (DataTables)",
        status: response6.status,
        totalRecords: response6.data?.recordsTotal || response6.data?.totalRecords,
        filteredRecords: response6.data?.recordsFiltered,
        dataLength: response6.data?.data?.length,
        results: response6.data?.data,
      });

      logger.info("Test 6 success");
    } catch (error: any) {
      results.tests.push({
        test: "POST mimicking browser (DataTables)",
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    response.json({
      success: true,
      results,
      summary: {
        apiUrl,
        testsRun: results.tests.length,
        successfulTests: results.tests.filter((t: any) => !t.error).length,
        note: "Trying POST requests with various formats",
      },
    });
  } catch (error) {
    logger.error("Debug function error:", error);
    response.status(500).json({
      success: false,
      error: String(error),
      results,
    });
  }
});
