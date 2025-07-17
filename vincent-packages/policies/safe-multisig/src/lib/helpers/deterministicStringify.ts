import stringify from "json-stable-stringify";

/**
 * Stringify an object with proper handling of bigints
 * Converts bigints to strings before stringifying to ensure deterministic output
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
 * Converts bigints to strings for serialization
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
