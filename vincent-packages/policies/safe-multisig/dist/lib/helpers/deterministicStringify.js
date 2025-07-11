export function deterministicStringify(obj) {
    if (obj === null)
        return "null";
    if (obj === undefined)
        return undefined;
    if (typeof obj === "boolean" || typeof obj === "number")
        return JSON.stringify(obj);
    if (typeof obj === "string")
        return JSON.stringify(obj);
    if (typeof obj === "bigint")
        return JSON.stringify(obj.toString());
    if (Array.isArray(obj)) {
        const items = obj.map(item => deterministicStringify(item));
        return "[" + items.join(",") + "]";
    }
    if (typeof obj === "object") {
        const keys = Object.keys(obj).sort();
        const pairs = keys.map(key => {
            const value = deterministicStringify(obj[key]);
            return JSON.stringify(key) + ":" + value;
        });
        return "{" + pairs.join(",") + "}";
    }
    return JSON.stringify(obj);
}
