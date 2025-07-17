/**
 * @fileoverview Safe contract threshold retrieval utility
 * @description This module provides functionality to query the threshold requirement
 * from Safe multisig contracts on-chain.
 */

import { ethers } from "ethers";

/**
 * @function getSafeThreshold
 * @description Retrieves the threshold (minimum number of required signatures) from a Safe multisig contract.
 * This function directly queries the Safe contract's getThreshold() method to determine
 * how many owner signatures are required to execute transactions or validate messages.
 * 
 * The threshold is a critical parameter for Safe operations as it determines the minimum
 * number of confirmations needed for any multisig action.
 * 
 * @param params - Configuration for querying the Safe threshold
 * @param params.provider - Ethers.js provider for blockchain interaction
 * @param params.safeAddress - Address of the Safe multisig contract
 * 
 * @returns Promise resolving to the threshold number (e.g., 2 for 2-of-3 multisig)
 * 
 * @throws {Error} When the contract call fails or the Safe address is invalid
 * @throws {Error} When the provider cannot connect to the blockchain
 * 
 * @example
 * ```typescript
 * const provider = new ethers.providers.JsonRpcProvider('https://...');
 * 
 * const threshold = await getSafeThreshold({
 *   provider,
 *   safeAddress: '0x123...'
 * });
 * 
 * console.log(threshold); // 2 (for a 2-of-3 multisig)
 * 
 * // Use threshold to validate if enough confirmations exist
 * if (confirmations.length >= threshold) {
 *   console.log('Enough signatures to execute');
 * }
 * ```
 * 
 * @see {@link https://docs.safe.global/safe-core-protocol/safe-core-protocol#threshold} Safe threshold documentation
 */
export async function getSafeThreshold(
    { provider, safeAddress }: { provider: ethers.providers.Provider, safeAddress: string }
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