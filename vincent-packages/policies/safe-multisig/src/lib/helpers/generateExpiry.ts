/**
 * Generate expiry timestamp (default: 1 hour from now)
 */
export function generateExpiry(hoursFromNow: number = 1): bigint {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + hoursFromNow * 3600;
    return BigInt(expiry);
}

export function buildEIP712Signature(
    confirmations: Array<{ signature?: string }>
): string {
    const signatures = confirmations
        .filter((conf) => conf.signature)
        .map((conf) => conf.signature!.slice(2))
        .sort()
        .join("");

    return "0x" + signatures;
}