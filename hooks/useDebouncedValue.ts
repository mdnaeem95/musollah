import { useEffect, useState } from "react";

/**
 * Returns a debounced version of the input value.
 * @param value The raw value to debounce
 * @param delay Delay in milliseconds
 */
export const useDebouncedValue = <T>(value: T, delay: number = 300): T => {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
};
