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