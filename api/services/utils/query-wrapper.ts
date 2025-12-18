/**
 * Production-Safe Firestore Query Wrapper
 *
 * Prevents crashes from malformed data, null values, and type mismatches
 * that occur in production Turbo Module bridge.
 *
 * @version 1.1
 * @date 2025-12-18
 */

import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

// ============================================================================
// TYPE GUARDS
// ============================================================================

// More reliable than checking for `.get()` (both Query and DocumentReference have it)
const isDocumentReference = (
  value: FirebaseFirestoreTypes.Query | FirebaseFirestoreTypes.DocumentReference
): value is FirebaseFirestoreTypes.DocumentReference => {
  const v: any = value;
  return (
    v &&
    typeof v === "object" &&
    typeof v.set === "function" &&
    typeof v.update === "function" &&
    typeof v.delete === "function"
  );
};

const isQuery = (
  value: FirebaseFirestoreTypes.Query | FirebaseFirestoreTypes.DocumentReference
): value is FirebaseFirestoreTypes.Query => {
  const v: any = value;
  return (
    v &&
    typeof v === "object" &&
    // Query has "where/orderBy/limit" chainable functions; DocumentReference doesn't
    typeof v.where === "function" &&
    typeof v.orderBy === "function" &&
    typeof v.limit === "function"
  );
};

// Basic validation helpers
const isValidString = (value: any): value is string =>
  typeof value === "string" && value.length > 0;

const isValidArray = (value: any): value is any[] => Array.isArray(value);

// ============================================================================
// SANITIZER
// ============================================================================

/**
 * Sanitizes Firestore document data to prevent Turbo Module crashes
 * ✅ FIXED: Skip Firebase FieldValue objects (arrayUnion, arrayRemove, etc.)
 */
const sanitizeDocumentData = <T = any>(data: any): T => {
  if (data === null || data === undefined) return {} as T;

  // ✅ NEW: Detect Firebase FieldValue (arrayUnion, arrayRemove, increment, etc.)
  if (typeof data === 'object' && data !== null) {
    // Firebase FieldValue has a special _methodName property
    const dataAny = data as any;
    if (dataAny._methodName || dataAny._delegate?._methodName) {
      console.log('🔥 Preserving Firebase FieldValue');
      return data as T;
    }
  }

  // primitives are safe to return directly
  if (typeof data !== "object") return data as T;

  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    try {
      if (value === undefined || value === null) {
        sanitized[key] = null;
        continue;
      }

      // ✅ NEW: Preserve Firebase FieldValue in nested data
      if (typeof value === 'object' && value !== null) {
        const valueAny = value as any;
        if (valueAny._methodName || valueAny._delegate?._methodName) {
          console.log(`🔥 Preserving Firebase FieldValue for key: ${key}`);
          sanitized[key] = value; // Don't sanitize FieldValues!
          continue;
        }
      }

      if (Array.isArray(value)) {
        sanitized[key] = value
          .filter((item) => item !== undefined && item !== null)
          .map((item) => (typeof item === "object" ? sanitizeDocumentData(item) : item));
        continue;
      }

      if (typeof value === "object") {
        sanitized[key] = sanitizeDocumentData(value);
        continue;
      }

      if (typeof value === "string") {
        // Prevent control chars that can crash NSString conversion
        sanitized[key] = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
        continue;
      }

      sanitized[key] = value;
    } catch (err) {
      console.warn(`⚠️ Failed to sanitize field "${key}":`, err);
      sanitized[key] = null;
    }
  }

  return sanitized as T;
};

// ============================================================================
// SAFE GET
// ============================================================================

/**
 * Safe wrapper for Firestore get() operations
 */
export const safeFirestoreGet = async <T = any>(
  target: FirebaseFirestoreTypes.Query | FirebaseFirestoreTypes.DocumentReference
): Promise<T[]> => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore query timeout")), 10000)
    );

    // Both Query and DocumentReference have .get()
    const snapshot = (await Promise.race([(target as any).get(), timeoutPromise])) as
      | FirebaseFirestoreTypes.QuerySnapshot
      | FirebaseFirestoreTypes.DocumentSnapshot;

    // DocumentSnapshot has "exists"
    if ("exists" in snapshot) {
      if (!snapshot.exists) return [];
      const data = snapshot.data();
      return [sanitizeDocumentData<T>(data)];
    }

    // QuerySnapshot has "docs"
    if (!("docs" in snapshot) || snapshot.empty) return [];

    const results: T[] = [];

    snapshot.docs.forEach((doc) => {
      try {
        const data = doc.data();

        if (!data || typeof data !== "object") {
          console.warn(`⚠️ Skipping malformed document: ${doc.id}`);
          return;
        }

        const sanitized = sanitizeDocumentData<T>({
          ...data,
          id: doc.id,
          _firestoreRef: doc.ref.path, // helpful for debugging
        });

        results.push(sanitized);
      } catch (err) {
        console.error(`❌ Failed to process document ${doc.id}:`, err);
      }
    });

    return results;
  } catch (error) {
    console.error("❌ Firestore query failed:", error);
    return [];
  }
};

// ============================================================================
// SAFE LISTENER
// ============================================================================

/**
 * Safe wrapper for Firestore onSnapshot() operations
 */
export const safeFirestoreListener = <T = any>(
  target: FirebaseFirestoreTypes.Query | FirebaseFirestoreTypes.DocumentReference,
  onSuccess: (data: T[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    // Narrow the union BEFORE calling .onSnapshot (fixes TS overload union error)
    if (isDocumentReference(target)) {
      const unsubscribe = target.onSnapshot(
        (snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => {
          try {
            if (!snapshot.exists) {
              onSuccess([]);
              return;
            }
            const data = snapshot.data();
            onSuccess([sanitizeDocumentData<T>(data)]);
          } catch (err) {
            console.error("❌ Snapshot processing failed (doc):", err);
            onError?.(err as Error);
          }
        },
        (err: any) => {
          console.error("❌ Firestore listener error (doc):", err);
          onError?.(err as Error);
        }
      );

      return unsubscribe;
    }

    if (isQuery(target)) {
      const unsubscribe = target.onSnapshot(
        (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
          try {
            if (snapshot.empty) {
              onSuccess([]);
              return;
            }

            const results: T[] = [];

            snapshot.docs.forEach((doc) => {
              try {
                const data = doc.data();

                if (!data || typeof data !== "object") {
                  console.warn(`⚠️ Skipping malformed document: ${doc.id}`);
                  return;
                }

                results.push(
                  sanitizeDocumentData<T>({
                    ...data,
                    id: doc.id,
                  })
                );
              } catch (err) {
                console.error(`❌ Failed to process document ${doc.id}:`, err);
              }
            });

            onSuccess(results);
          } catch (err) {
            console.error("❌ Snapshot processing failed (query):", err);
            onError?.(err as Error);
          }
        },
        (err: any) => {
          console.error("❌ Firestore listener error (query):", err);
          onError?.(err as Error);
        }
      );

      return unsubscribe;
    }

    // Fallback (shouldn’t happen)
    console.error("❌ Unknown Firestore target passed to safeFirestoreListener");
    return () => {};
  } catch (error) {
    console.error("❌ Failed to create Firestore listener:", error);
    return () => {};
  }
};

// ============================================================================
// SAFE WRITES
// ============================================================================

export const safeFirestoreWrite = async (
  ref: FirebaseFirestoreTypes.DocumentReference,
  data: any,
  options?: { merge?: boolean }
): Promise<boolean> => {
  try {
    const sanitized = sanitizeDocumentData(data);
    if (options?.merge) await ref.set(sanitized, { merge: true });
    else await ref.set(sanitized);
    return true;
  } catch (error) {
    console.error("❌ Firestore write failed:", error);
    return false;
  }
};

export const safeFirestoreUpdate = async (
  ref: FirebaseFirestoreTypes.DocumentReference,
  data: any
): Promise<boolean> => {
  try {
    const sanitized = sanitizeDocumentData(data);
    await ref.update(sanitized);
    return true;
  } catch (error) {
    console.error("❌ Firestore update failed:", error);
    return false;
  }
};

export const safeFirestoreDelete = async (
  ref: FirebaseFirestoreTypes.DocumentReference
): Promise<boolean> => {
  try {
    await ref.delete();
    return true;
  } catch (error) {
    console.error("❌ Firestore delete failed:", error);
    return false;
  }
};

// ============================================================================
// VALIDATION
// ============================================================================

export const validateFirestoreQuery = (
  collection: string,
  requiredFields: string[] = []
): boolean => {
  try {
    if (!isValidString(collection)) {
      console.error("❌ Invalid collection name");
      return false;
    }

    if (!isValidArray(requiredFields)) {
      console.error("❌ Invalid required fields array");
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Query validation failed:", error);
    return false;
  }
};
