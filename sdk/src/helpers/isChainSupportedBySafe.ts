/**
 * @fileoverview Safe chain support validation utility
 * @description This module provides functionality to check if a chain is supported by Safe Transaction Service.
 */

import { LIT_CHAINS } from './LIT_CHAINS';
import { getSupportedSafeChains } from './getSupportedSafeChains';
import { SupportedLitChainIdentifier } from '../types';

/**
 * @function isChainSupportedBySafe
 * @description Checks if a given Lit Protocol chain identifier is supported by Safe Transaction Service.
 * This function provides a quick way to validate chain support before attempting to use Safe-related operations.
 * 
 * @param litChainIdentifier - The Lit Protocol chain identifier to check
 * @returns True if the chain is supported, false otherwise
 * 
 * @example
 * ```typescript
 * import { isChainSupportedBySafe } from '@lit-protocol/vincent-safe-multisig-policy-sdk';
 * 
 * // Check supported chains
 * const isEthereumSupported = isChainSupportedBySafe('ethereum'); // true
 * const isPolygonSupported = isChainSupportedBySafe('polygon'); // true
 * 
 * // Check unsupported chains
 * const isBerachainSupported = isChainSupportedBySafe('berachain'); // false
 * 
 * // Use in conditional logic
 * if (isChainSupportedBySafe(chainId)) {
 *   // Proceed with Safe operations
 *   const url = getSafeTransactionServiceUrl({ litChainIdentifier: chainId });
 * } else {
 *   throw new Error(`Chain ${chainId} is not supported by Safe`);
 * }
 * ```
 * 
 * @see {@link getSupportedSafeChains} for getting all supported chains
 * @see {@link getSafeTransactionServiceUrl} for getting Safe service URLs
 */
export function isChainSupportedBySafe(
  litChainIdentifier: keyof typeof LIT_CHAINS
): boolean {
  const supportedChains = getSupportedSafeChains();
  return supportedChains.includes(litChainIdentifier as SupportedLitChainIdentifier);
}