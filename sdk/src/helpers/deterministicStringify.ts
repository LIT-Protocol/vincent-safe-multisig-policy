/**
 * @fileoverview Deterministic JSON stringification with BigInt support
 * @description This module provides utilities for creating consistent JSON strings
 * from JavaScript objects, with special handling for BigInt values.
 */

import stringify from "json-stable-stringify";

/**
 * @type SerializableValue
 * @description Union type representing all values that can be safely serialized to JSON,
 * including BigInt values which will be converted to strings.
 */
export type SerializableValue = 
  | string 
  | number 
  | boolean 
  | bigint 
  | null 
  | undefined
  | SerializableObject 
  | SerializableArray;

/**
 * @type SerializableObject
 * @description Object type with string keys and serializable values, allowing for nested structures.
 */
export type SerializableObject = {
  [key: string]: SerializableValue;
};

/**
 * @type SerializableArray
 * @description Array containing serializable values.
 */
export type SerializableArray = SerializableValue[];

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
 * @throws {Error} When the input contains non-serializable values (functions, symbols, etc.)
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
 * @see {@link SerializableValue} for supported input types
 */
export function deterministicStringify(obj: SerializableValue): string {
  const processedObj = convertBigInts(obj);

  const result = stringify(processedObj);
  if (result === undefined) {
    throw new Error("[deterministicStringify] Stringify result is undefined");
  }

  return result;
}

/**
 * @type ProcessedValue
 * @description Union type representing values after BigInt conversion, where BigInt values become strings.
 */
type ProcessedValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | ProcessedObject 
  | ProcessedArray;

/**
 * @type ProcessedObject
 * @description Object type with string keys and processed values (BigInts converted to strings).
 */
type ProcessedObject = {
  [key: string]: ProcessedValue;
};

/**
 * @type ProcessedArray
 * @description Array containing processed values (BigInts converted to strings).
 */
type ProcessedArray = ProcessedValue[];

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
function convertBigInts(obj: SerializableValue): ProcessedValue {
  // Handle null and primitive types
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "bigint") {
      return obj.toString();
    }
    return obj as ProcessedValue;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts) as ProcessedArray;
  }

  // Handle objects
  const result: ProcessedObject = {};
  for (const key of Object.keys(obj)) {
    result[key] = convertBigInts((obj as SerializableObject)[key]);
  }
  return result;
}
