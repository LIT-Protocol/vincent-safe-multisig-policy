/**
 * @fileoverview Safe Transaction Service URL mapping utility
 * @description This module provides functionality to map Lit Protocol chain identifiers
 * to the corresponding Safe Transaction Service API URLs.
 */

import { LIT_CHAINS } from '@lit-protocol/constants';
import type { SupportedLitChainIdentifier } from '../types';

/**
 * @interface ChainMapping
 * @description Configuration for mapping Lit chain identifiers to Safe Transaction Service endpoints
 */
interface ChainMapping {
    /** @description The Safe Transaction Service chain identifier (may differ from Lit identifier) */
    safeIdentifier: string;
}

/**
 * @constant SAFE_CHAIN_MAPPINGS
 * @description Mapping configuration for Lit Protocol chains that are supported by Safe Transaction Service.
 * This centralizes the chain mapping logic and makes it easier to maintain when new chains are added.
 * Only supported chains are included in this mapping.
 * 
 * @example
 * ```typescript
 * // Chains with different identifiers
 * SAFE_CHAIN_MAPPINGS.ethereum.safeIdentifier // 'mainnet'
 * SAFE_CHAIN_MAPPINGS.baseSepolia.safeIdentifier // 'base-sepolia'
 * 
 * // Direct mappings
 * SAFE_CHAIN_MAPPINGS.arbitrum.safeIdentifier // 'arbitrum'
 * ```
 */
export const SAFE_CHAIN_MAPPINGS: Record<SupportedLitChainIdentifier, ChainMapping> = {
    // Supported chains with direct mapping (Lit identifier = Safe identifier)
    arbitrum: { safeIdentifier: 'arbitrum' },
    aurora: { safeIdentifier: 'aurora' },
    avalanche: { safeIdentifier: 'avalanche' },
    base: { safeIdentifier: 'base' },
    bsc: { safeIdentifier: 'bsc' },
    celo: { safeIdentifier: 'celo' },
    chiado: { safeIdentifier: 'chiado' },
    mantle: { safeIdentifier: 'mantle' },
    optimism: { safeIdentifier: 'optimism' },
    polygon: { safeIdentifier: 'polygon' },
    scroll: { safeIdentifier: 'scroll' },
    sepolia: { safeIdentifier: 'sepolia' },
    zkEvm: { safeIdentifier: 'zkEvm' },
    zksync: { safeIdentifier: 'zksync' },

    // Supported chains with different identifiers
    baseSepolia: { safeIdentifier: 'base-sepolia' },
    ethereum: { safeIdentifier: 'mainnet' },
    sonicMainnet: { safeIdentifier: 'sonic' },
};

/**
 * @function getSafeTransactionServiceUrl
 * @description Maps a Lit Protocol chain identifier to the corresponding Safe Transaction Service URL.
 * This function handles the translation between Lit's chain naming conventions and Safe's
 * Transaction Service API endpoints, using a configuration-based approach for better maintainability.
 * 
 * The function validates at runtime that the chain is supported by both Lit Protocol
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
 *   console.log(error.message); // 'Chain 'berachain' is not supported by Safe Transaction Service...'
 * }
 * ```
 * 
 * @see {@link https://docs.safe.global/safe-core-api/transaction-service-api} Safe Transaction Service API documentation
 * @see {@link SAFE_CHAIN_MAPPINGS} for the complete chain mapping configuration
 * @see {@link getSupportedSafeChains} for getting all supported chains
 * @see {@link isChainSupportedBySafe} for checking individual chain support
 * 
 * @note This function uses a configuration-based approach to make it easier to add support
 * for new chains without modifying the core logic.
 */
export function getSafeTransactionServiceUrl(
    { litChainIdentifier }: { litChainIdentifier: keyof typeof LIT_CHAINS }
): string {
    // Validate that the chain exists in Lit Protocol
    const litChain = LIT_CHAINS[litChainIdentifier];
    if (!litChain) {
        throw new Error(
            `[getSafeTransactionServiceUrl] Chain identifier '${litChainIdentifier}' is not supported by Lit Protocol`
        );
    }

    // Check if the chain is supported by Safe Transaction Service
    const chainMapping = SAFE_CHAIN_MAPPINGS[litChainIdentifier as SupportedLitChainIdentifier];
    if (!chainMapping) {
        throw new Error(
            `[getSafeTransactionServiceUrl] Chain '${litChainIdentifier}' is not supported by Safe Transaction Service. ` +
            `Use getSupportedSafeChains() to get a list of supported chains.`
        );
    }

    // Construct and return the Safe Transaction Service URL
    return `https://safe-transaction-${chainMapping.safeIdentifier}.safe.global`;
}

