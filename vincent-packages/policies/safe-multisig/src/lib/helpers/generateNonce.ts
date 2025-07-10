/**
 * Generate a unique nonce based on current timestamp and random value
 */
export function generateNonce(): bigint {
    const timestamp = BigInt(Date.now());
    const random = BigInt(Math.floor(Math.random() * 1000000));
    return timestamp * 1000000n + random;
}