/* eslint-disable max-len */
/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
import {logger} from "firebase-functions/v2";
import {getFirestore} from "firebase-admin/firestore";

/**
 * Dry-run helper utility
 *
 * In dry-run mode:
 * - Logs what WOULD be updated
 * - Writes to test collection instead of production
 * - Returns summary of changes
 */
export class DryRunManager {
  private isDryRun: boolean;
  private updates: any[] = [];

  constructor(isDryRun = false) {
    this.isDryRun = isDryRun;

    if (isDryRun) {
      // eslint-disable-next-line max-len
      logger.info("🧪 DRY RUN MODE ENABLED - No production data will be modified");
    }
  }

  // eslint-disable-next-line valid-jsdoc
  /**
   * Log or apply an update
   */
  async recordUpdate(update: any): Promise<void> {
    this.updates.push(update);

    if (this.isDryRun) {
      // Just log what would be updated
      logger.info("📝 [DRY RUN] Would update:", {
        restaurantId: update.restaurantId,
        field: update.field,
        oldValue: update.oldValue,
        newValue: update.newValue,
        source: update.source,
        confidence: update.confidence,
      });
    } else {
      // Actually write to restaurant_updates collection
      const db = getFirestore();
      await db.collection("restaurant_updates").add(update);
      logger.info("✅ [PRODUCTION] Update recorded:", update.restaurantId);
    }
  }

  /**
   * Get summary of all updates
   */
  getSummary() {
    const summary = {
      totalUpdates: this.updates.length,
      byField: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      byRestaurant: {} as Record<string, number>,
    };

    this.updates.forEach((update) => {
      // Count by field
      summary.byField[update.field] = (summary.byField[update.field] || 0) + 1;

      // Count by source
      summary.bySource[update.source] = (summary.bySource[update.source] || 0) + 1;

      // Count by restaurant
      summary.byRestaurant[update.restaurantId] =
        (summary.byRestaurant[update.restaurantId] || 0) + 1;
    });

    return summary;
  }

  /**
   * Save dry-run results to test collection
   */
  async saveDryRunResults(): Promise<void> {
    if (!this.isDryRun || this.updates.length === 0) return;

    const db = getFirestore();
    const summary = this.getSummary();

    // Save to test collection
    await db.collection("dry_run_results").add({
      timestamp: new Date(),
      summary,
      updates: this.updates,
    });

    logger.info("💾 Dry-run results saved to dry_run_results collection");
  }
}

/**
 * Check if dry-run mode is enabled
 */
export function isDryRunEnabled(): boolean {
  // Check environment config
  const config = process.env.FIREBASE_CONFIG ?
    JSON.parse(process.env.FIREBASE_CONFIG) :
    {};

  return config.app?.dry_run === "true";
}
