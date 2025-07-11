import { deterministicStringify } from "./deterministicStringify";
export function createParametersString(toolParams) {
    // Convert bigints to strings for serialization
    const convertBigInts = (obj) => {
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
    };
    const processedParams = convertBigInts(toolParams);
    console.log("[createParametersString] Creating parameters string for tool params: ", JSON.stringify(processedParams, null, 2));
    return deterministicStringify(processedParams);
}
