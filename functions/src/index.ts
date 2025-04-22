import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as vision from "@google-cloud/vision";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();
const visionClient = new vision.ImageAnnotatorClient();

function parseIngredients(text: string): string[] {
  const start = text.toLowerCase().indexOf("ingredients:");
  if (start === -1) return [];

  const endKeywords = ["phenylketonurics", "warning", "use by", "allergy"];
  const rest = text.slice(start);

  let endIndex = rest.length;
  for (const keyword of endKeywords) {
    const i = rest.toLowerCase().indexOf(keyword);
    if (i !== -1 && i < endIndex) endIndex = i;
  }

  const rawBlock = rest.slice(12, endIndex).trim();

  const nestedMatches = [...rawBlock.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
  const nestedItems = nestedMatches
    .flatMap((str) => str.split(/,|and/i))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const cleaned = rawBlock
    .replace(/\([^)]*\)/g, "")
    .replace(/\n|\r/g, " ")
    .replace(/[^a-zA-Z0-9,.\s]/g, "")
    .replace(/\band\b/gi, ",")
    .replace(/\s+/g, " ");

  const rawItems = cleaned
    .split(",")
    .map((i) => i.trim().toLowerCase().replace(/\.+$/, ""))
    .map((i) => [...new Set(i.split(" "))].join(" "))
    .filter(Boolean);

  const allIngredients = [...rawItems, ...nestedItems];
  return [...new Set(allIngredients)];
}

function getOverallStatus(ingredients: { status: string }[]): string {
  if (ingredients.some((i) => i.status.toLowerCase() === "avoid")) return "Avoid";
  if (ingredients.some((i) => i.status.toLowerCase() === "caution")) return "Caution";
  if (ingredients.every((i) => i.status.toLowerCase() === "ok")) return "OK";
  return "Unknown";
}

function classifyWithRules(name: string): { status: string; description: string } {
  const n = name.toLowerCase();

  if (n.includes("pork") || n.includes("bacon") || n.includes("lard") || n.includes("swine")) {
    return {status: "Avoid", description: "Contains swine or swine-derived products."};
  }

  if (n.includes("alcohol") || n.includes("wine") || n.includes("rum") || n.includes("beer")) {
    return {status: "Avoid", description: "Contains intoxicants."};
  }

  if (n.includes("blood") || n.includes("carrion") || n.includes("dead meat")) {
    return {status: "Avoid", description: "Contains blood or dead animals not slaughtered Islamically."};
  }

  if (n.includes("gelatin")) {
    return {status: "Caution", description: "Gelatin may be derived from haram sources."};
  }

  if (["beef", "chicken", "meat", "duck", "lamb", "animal fat"].some((w) => n.includes(w))) {
    return {status: "Caution", description: "Contains meat; halal status depends on slaughter method."};
  }

  return {status: "Unknown", description: ""};
}

const EXCLUDED_GENERIC = ["vitamins", "spices", "minerals", "flavour", "seasoning"];

export const scanIngredients = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const {image} = req.body;

  if (!image || typeof image !== "string") {
    res.status(400).json({error: "Missing or invalid base64 image string."});
    return;
  }

  try {
    const buffer = Buffer.from(image, "base64");
    const tmpFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.jpg`);
    fs.writeFileSync(tmpFilePath, buffer);

    logger.info("✅ Image written to disk:", tmpFilePath);

    const [result] = await visionClient.textDetection(tmpFilePath);
    const detections = result.textAnnotations;
    const fullText = detections?.[0]?.description || "";

    logger.info("📄 OCR Extracted Text:", fullText);

    const parsedIngredients = parseIngredients(fullText);
    logger.info("🧪 Parsed Ingredients:", parsedIngredients);

    const snapshot = await db.collection("foodAdditives").get();
    const additives = snapshot.docs.map((doc) => doc.data());

    const newIngredients: string[] = [];

    const matched = parsedIngredients.map((name) => {
      const found = additives.find((item) =>
        item.chemicalName.toLowerCase() === name.toLowerCase() ||
        name.includes(item.chemicalName.toLowerCase()) ||
        item.chemicalName.toLowerCase().includes(name)
      );

      if (found) {
        return {
          name,
          status: found.status,
          description: found.description,
        };
      } else {
        const fallback = classifyWithRules(name);

        if (fallback.status === "Unknown" && !EXCLUDED_GENERIC.includes(name)) {
          newIngredients.push(name);
        }

        return {
          name,
          ...fallback,
        };
      }
    });

    // Upload any unmatched ingredients to the coreIngredients collection
    const uploads = await Promise.all(
      newIngredients.map(async (ingredient) => {
        const existing = await db
          .collection("coreIngredients")
          .where("name", "==", ingredient)
          .limit(1)
          .get();

        if (existing.empty) {
          logger.info(`📥 Adding new core ingredient: ${ingredient}`);
          return db.collection("coreIngredients").add({
            name: ingredient,
            status: "Unknown",
            source: "auto-upload",
            createdAt: FieldValue.serverTimestamp(),
          });
        } else {
          logger.info(`✅ Ingredient already exists: ${ingredient}`);
          return null;
        }
      })
    );

    const overallStatus = getOverallStatus(matched);

    res.status(200).json({
      ingredients: matched,
      overallStatus,
    });
  } catch (error) {
    logger.error("Error during OCR/Parsing/Matching:", error);
    res.status(500).send("Failed to process image.");
  }
});
