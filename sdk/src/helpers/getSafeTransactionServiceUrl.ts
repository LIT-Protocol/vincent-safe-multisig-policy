/**
 * @fileoverview Safe Transaction Service URL mapping utility
 * @description This module provides functionality to map Lit Protocol chain identifiers
 * to the corresponding Safe Transaction Service API URLs.
 */

import { LIT_CHAINS } from '@lit-protocol/constants';

/**
 * @function getSafeTransactionServiceUrl
 * @description Maps a Lit Protocol chain identifier to the corresponding Safe Transaction Service URL.
 * This function handles the translation between Lit's chain naming conventions and Safe's
 * Transaction Service API endpoints, including special cases where the naming differs.
 * 
 * The function performs validation to ensure the chain is supported by both Lit Protocol
 * and Safe's Transaction Service, throwing descriptive errors for unsupported chains.
 * 
 * @param params - Configuration for URL generation
 * @param params.litChainIdentifier - The Lit Protocol chain identifier (must be a valid key from LIT_CHAINS)
 * 
 * @returns The complete Safe Transaction Service URL for the specified chain
 * 
 * @throws {Error} When the chain identifier is not supported by Lit Protocol
 * @throws {Error} When the chain is not supported by Safe's Transaction Service
 * 
 * @example
 * ```typescript
 * // Standard mapping
 * const mainnetUrl = getSafeTransactionServiceUrl({ litChainIdentifier: 'ethereum' });
 * console.log(mainnetUrl); // 'https://safe-transaction-mainnet.safe.global'
 * 
 * // Special case mapping
 * const baseSepoliaUrl = getSafeTransactionServiceUrl({ litChainIdentifier: 'baseSepolia' });
 * console.log(baseSepoliaUrl); // 'https://safe-transaction-base-sepolia.safe.global'
 * 
 * // Unsupported chain
 * try {
 *   getSafeTransactionServiceUrl({ litChainIdentifier: 'berachain' });
 * } catch (error) {
 *   console.log(error.message); // 'Berachain is not supported by Lit'
 * }
 * ```
 * 
 * @see {@link https://docs.safe.global/safe-core-api/transaction-service-api} Safe Transaction Service API documentation
 * 
 * @note This function includes a comprehensive mapping for all major EVM chains supported
 * by both Lit Protocol and Safe, with explicit error handling for unsupported chains.
 */
export function getSafeTransactionServiceUrl(
    { litChainIdentifier }: { litChainIdentifier: keyof typeof LIT_CHAINS }
): string {
    const chain = LIT_CHAINS[litChainIdentifier];
    if (!chain) {
        throw new Error(`[getSafeTransactionServiceUrl] Chain identifier '${litChainIdentifier}' not supported by Lit`);
    }

    // This switch case is handling the cases where the chain identifier used by Safe
    // is different from the chain identifier used by Lit, and unsupported chains by Lit.
    let safeChainIdentifier = litChainIdentifier;
    switch (litChainIdentifier) {
        case "arbitrum":
            break;
        case "aurora":
            break;
        case "avalanche":
            break;
        case "base":
            break;
        case "baseSepolia":
            safeChainIdentifier = "base-sepolia";
            break;
        case "berachain":
            throw new Error("[getSafeTransactionServiceUrl] Berachain is not supported by Lit");
        case "bsc":
            break;
        case "celo":
            break;
        case "chiado":
            break;
        case "gnosis-chain":
            throw new Error("[getSafeTransactionServiceUrl] Gnosis Chain is not supported by Lit");
        case "hemi":
            throw new Error("[getSafeTransactionServiceUrl] Hemi is not supported by Lit");
        case "ink":
            throw new Error("[getSafeTransactionServiceUrl] Ink is not supported by Lit");
        case "lens":
            throw new Error("[getSafeTransactionServiceUrl] Lens is not supported by Lit");
        case "linea":
            throw new Error("[getSafeTransactionServiceUrl] Linea is not supported by Lit");
        case "ethereum":
            safeChainIdentifier = "mainnet";
            break;
        case "mantle":
            break;
        case "optimism":
            break;
        case "polygon":
            break;
        case "scroll":
            break;
        case "sepolia":
            break;
        case "sonicMainnet":
            safeChainIdentifier = "sonic";
            break;
        case "unichain":
            throw new Error("[getSafeTransactionServiceUrl] Unichain is not supported by Lit");
        case "worldchain":
            throw new Error("[getSafeTransactionServiceUrl] Worldchain is not supported by Lit");
        case "xlayer":
            throw new Error("[getSafeTransactionServiceUrl] Xlayer is not supported by Lit");
        case "zkEvm":
            break;
        case "zksync":
            break;
        default:
            throw new Error(`[getSafeTransactionServiceUrl] Safe Transaction Service is not supported for chain identifier '${litChainIdentifier}'`);
    }

    return `https://safe-transaction-${safeChainIdentifier}.safe.global`;
}
