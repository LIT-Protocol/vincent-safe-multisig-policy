/**
 * @module @lit-protocol/vincent-safe-multisig-policy-sdk
 * @description SDK for Vincent Safe Multisig Policy - A comprehensive toolkit for creating and validating
 * Safe multisig messages with EIP-712 compliance and Lit Protocol integration.
 * 
 * @example
 * ```typescript
 * import { createVincentSafeMessage, validateSafeMessage } from '@lit-protocol/vincent-safe-multisig-policy-sdk';
 * 
 * // Create a new Safe message
 * const message = await createVincentSafeMessage({
 *   safeAddress: '0x...',
 *   chainId: 1,
 *   message: 'Hello Safe!',
 *   signer: wallet
 * });
 * 
 * // Validate a Safe message
 * const isValid = await validateSafeMessage({
 *   safeAddress: '0x...',
 *   chainId: 1,
 *   message: 'Hello Safe!',
 *   signature: '0x...'
 * });
 * ```
 */

export * from './helpers/createVincentSafeMessage';
export * from './helpers/validateSafeMessage';
