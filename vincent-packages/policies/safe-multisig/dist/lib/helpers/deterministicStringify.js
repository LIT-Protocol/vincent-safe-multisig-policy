import stringify from "json-stable-stringify";
/**
 * Converts bigints to strings for serialization
 */
function convertBigInts(obj) {
    if (obj === null || typeof obj !== "object") {
        if (typeof obj === "bigint") {
            return obj.toString();
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(convertBigInts);
    }
    const result = {};
    for (const key of Object.keys(obj)) {
        result[key] = convertBigInts(obj[key]);
    }
    return result;
}
/**
 * Stringify an object with proper handling of bigints
 * Converts bigints to strings before stringifying to ensure deterministic output
 */
export function deterministicStringify(obj) {
    const processedObj = convertBigInts(obj);
    return stringify(processedObj);
}
