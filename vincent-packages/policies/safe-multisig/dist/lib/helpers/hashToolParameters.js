import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
export function hashToolParameters(params) {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
    }, {});
    return keccak256(toUtf8Bytes(JSON.stringify(sortedParams)));
}
