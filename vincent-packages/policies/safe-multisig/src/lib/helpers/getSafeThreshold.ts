import { ethers } from "ethers";

/**
 * Get Safe threshold from contract
 */
export async function getSafeThreshold(
    provider: ethers.providers.Provider,
    safeAddress: string
): Promise<number> {
    try {
        const safeContract = new ethers.Contract(
            safeAddress,
            ["function getThreshold() view returns (uint256)"],
            provider
        );

        const threshold = await safeContract.getThreshold();
        return threshold.toNumber();
    } catch (error) {
        console.error("[getSafeThreshold] Error getting Safe threshold:", error);
        throw new Error(
            `[getSafeThreshold] Failed to get Safe threshold: ${error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}