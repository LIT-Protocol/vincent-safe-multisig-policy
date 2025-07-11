export function buildEIP712Signature(confirmations) {
    const signatures = confirmations
        .filter((conf) => conf.signature)
        .map((conf) => conf.signature.slice(2))
        .sort()
        .join("");
    return "0x" + signatures;
}
