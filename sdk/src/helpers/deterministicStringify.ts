/**
 * @fileoverview Deterministic JSON stringification with BigInt support
 * @description This module provides utilities for creating consistent JSON strings
 * from JavaScript objects, with special handling for BigInt values.
 */

import stringify from "json-stable-stringify";

/**
 * @function deterministicStringify
 * @description Converts a JavaScript object to a deterministic JSON string with proper BigInt handling.
 * This function ensures that the same object will always produce the same string output,
 * regardless of property order or BigInt values.
 * 
 * The function performs the following operations:
 * 1. Recursively converts all BigInt values to strings
 * 2. Uses json-stable-stringify for deterministic property ordering
 * 3. Validates that the result is not undefined
 * 
 * @param obj - The object to stringify (can contain nested objects, arrays, and BigInt values)
 * 
 * @returns A deterministic JSON string representation of the object
 * 
 * @throws {Error} When the stringify operation returns undefined
 * 
 * @example
 * ```typescript
 * const obj = {
 *   amount: 123n, // BigInt
 *   recipient: '0x123...', 
 *   metadata: { id: 456n }
 * };
 * 
 * const jsonString = deterministicStringify(obj);
 * console.log(jsonString); // {"amount":"123","metadata":{"id":"456"},"recipient":"0x123..."}
 * 
 * // Same object with different property order produces identical string
 * const obj2 = {
 *   recipient: '0x123...',
 *   amount: 123n,
 *   metadata: { id: 456n }
 * };
 * console.log(deterministicStringify(obj2) === jsonString); // true
 * ```
 * 
 * @see {@link convertBigInts} for BigInt conversion logic
 */
export function deterministicStringify(obj: any): string {
  const processedObj = convertBigInts(obj);

  const result = stringify(processedObj);
  if (result === undefined) {
    throw new Error("[deterministicStringify] Stringify result is undefined");
  }

  return result;
}

/**
 * @function convertBigInts
 * @description Recursively converts BigInt values to strings within an object structure.
 * This is necessary because JSON.stringify and json-stable-stringify cannot handle BigInt values natively.
 * 
 * @param obj - The value to process (can be primitive, object, or array)
 * @returns The processed value with all BigInt values converted to strings
 * 
 * @example
 * ```typescript
 * const input = { amount: 123n, items: [456n, 'text', { nested: 789n }] };
 * const output = convertBigInts(input);
 * // Result: { amount: '123', items: ['456', 'text', { nested: '789' }] }
 * ```
 * 
 * @internal This is an internal helper function used by deterministicStringify
 */
function convertBigInts(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "bigint") {
      return obj.toString();
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  }

  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    result[key] = convertBigInts(obj[key]);
  }
  return result;
}
