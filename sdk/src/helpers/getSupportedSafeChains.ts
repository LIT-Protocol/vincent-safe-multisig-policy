/**
 * @fileoverview Safe chain support utilities
 * @description This module provides utility functions for checking Safe Transaction Service chain support.
 */
import type { SupportedLitChainIdentifier } from '../types';
import { SAFE_CHAIN_MAPPINGS } from './getSafeTransactionServiceUrl';

/**
 * @function getSupportedSafeChains
 * @description Returns a list of all Lit Protocol chain identifiers that are supported by Safe Transaction Service.
 * This utility function can be used for validation or UI purposes.
 * 
 * @returns Array of supported chain identifiers
 * 
 * @example
 * ```typescript
 * import { getSupportedSafeChains } from '@lit-protocol/vincent-safe-multisig-policy-sdk';
 * 
 * const supportedChains = getSupportedSafeChains();
 * console.log(supportedChains); // ['ethereum', 'polygon', 'arbitrum', ...]
 * 
 * // Check if a chain is supported
 * const isSupported = supportedChains.includes('ethereum'); // true
 * const isUnsupported = supportedChains.includes('berachain'); // false
 * ```
 * 
 * @see {@link isChainSupportedBySafe} for checking individual chain support
 */
export function getSupportedSafeChains(): SupportedLitChainIdentifier[] {
  return Object.keys(SAFE_CHAIN_MAPPINGS) as SupportedLitChainIdentifier[];
}