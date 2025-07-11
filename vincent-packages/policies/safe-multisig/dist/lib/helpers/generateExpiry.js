/**
 * Generate expiry timestamp (default: 1 hour from now)
 */
export function generateExpiry(hoursFromNow = 1) {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + hoursFromNow * 3600;
    return BigInt(expiry);
}
