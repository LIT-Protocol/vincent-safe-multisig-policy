/**
 * @fileoverview Safe Transaction Service URL mapping utility
 * @description This module provides functionality to map Lit Protocol chain identifiers
 * to the corresponding Safe Transaction Service API URLs.
 */

import { LIT_CHAINS } from '@lit-protocol/constants';

/**
 * @interface ChainMapping
 * @description Configuration for mapping Lit chain identifiers to Safe Transaction Service endpoints
 */
interface ChainMapping {
    /** @description The Safe Transaction Service chain identifier (may differ from Lit identifier) */
    safeIdentifier: string;
    /** @description Whether this chain is supported by Safe Transaction Service */
    supported: boolean;
    /** @description Optional reason why a chain is not supported */
    unsupportedReason?: string;
}

/**
 * @constant SAFE_CHAIN_MAPPINGS
 * @description Mapping configuration for all Lit Protocol chains to Safe Transaction Service identifiers.
 * This centralizes the chain mapping logic and makes it easier to maintain when new chains are added.
 * 
 * @example
 * ```typescript
 * // Chains with different identifiers
 * SAFE_CHAIN_MAPPINGS.ethereum.safeIdentifier // 'mainnet'
 * SAFE_CHAIN_MAPPINGS.baseSepolia.safeIdentifier // 'base-sepolia'
 * 
 * // Unsupported chains
 * SAFE_CHAIN_MAPPINGS.berachain.supported // false
 * ```
 */
export const SAFE_CHAIN_MAPPINGS: Record<keyof typeof LIT_CHAINS, ChainMapping> = {
    // Supported chains with direct mapping (Lit identifier = Safe identifier)
    arbitrum: { safeIdentifier: 'arbitrum', supported: true },
    aurora: { safeIdentifier: 'aurora', supported: true },
    avalanche: { safeIdentifier: 'avalanche', supported: true },
    base: { safeIdentifier: 'base', supported: true },
    bsc: { safeIdentifier: 'bsc', supported: true },
    celo: { safeIdentifier: 'celo', supported: true },
    chiado: { safeIdentifier: 'chiado', supported: true },
    mantle: { safeIdentifier: 'mantle', supported: true },
    optimism: { safeIdentifier: 'optimism', supported: true },
    polygon: { safeIdentifier: 'polygon', supported: true },
    scroll: { safeIdentifier: 'scroll', supported: true },
    sepolia: { safeIdentifier: 'sepolia', supported: true },
    zkEvm: { safeIdentifier: 'zkEvm', supported: true },
    zksync: { safeIdentifier: 'zksync', supported: true },

    // Supported chains with different identifiers
    baseSepolia: { safeIdentifier: 'base-sepolia', supported: true },
    ethereum: { safeIdentifier: 'mainnet', supported: true },
    sonicMainnet: { safeIdentifier: 'sonic', supported: true },

    // Unsupported chains (Safe Transaction Service does not support these chains)
    ...Object.fromEntries([
        'berachain',
        'gnosis-chain',
        'hemi',
        'ink',
        'lens',
        'linea',
        'unichain',
        'worldchain',
        'xlayer'
    ].map(chain => [chain, {
        safeIdentifier: '',
        supported: false,
        unsupportedReason: `Safe Transaction Service does not support ${chain}`
    }])),
} as const;

/**
 * @function getSafeTransactionServiceUrl
 * @description Maps a Lit Protocol chain identifier to the corresponding Safe Transaction Service URL.
 * This function handles the translation between Lit's chain naming conventions and Safe's
 * Transaction Service API endpoints, using a configuration-based approach for better maintainability.
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
 *   console.log(error.message); // 'Safe Transaction Service does not support Berachain'
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

    // Get the Safe chain mapping configuration
    const chainMapping = SAFE_CHAIN_MAPPINGS[litChainIdentifier];
    if (!chainMapping) {
        throw new Error(
            `[getSafeTransactionServiceUrl] No mapping configuration found for chain '${litChainIdentifier}'`
        );
    }

    // Check if the chain is supported by Safe Transaction Service
    if (!chainMapping.supported) {
        const reason = chainMapping.unsupportedReason ||
            `Chain '${litChainIdentifier}' is not supported by Safe Transaction Service`;
        throw new Error(`[getSafeTransactionServiceUrl] ${reason}`);
    }

    // Construct and return the Safe Transaction Service URL
    return `https://safe-transaction-${chainMapping.safeIdentifier}.safe.global`;
}

