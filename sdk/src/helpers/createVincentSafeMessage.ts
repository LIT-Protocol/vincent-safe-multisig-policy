/**
 * @fileoverview High-level function for creating Vincent Safe multisig messages
 * @description This module provides the main entry point for creating EIP-712 compliant
 * Safe messages that contain Vincent tool execution data.
 */

import { LIT_CHAINS } from '@lit-protocol/constants';

import type { CreateVincentSafeMessageParams, CreateVincentSafeMessageResult, VincentToolExecution } from '../types';
import { deterministicStringify } from './deterministicStringify';
import { generateNonce } from './generateNonce';
import { getSafeMessageString } from './getSafeMessageString';
import { generateSafeMessageHash } from './generateSafeMessageHash';

/**
 * @function createVincentSafeMessage
 * @description Creates a complete Vincent Safe message with all necessary components for Safe multisig execution.
 * This is a high-level convenience function that orchestrates the entire message creation process,
 * from parameter serialization to hash generation.
 * 
 * The function performs the following operations:
 * 1. Serializes tool parameters using deterministic JSON stringification
 * 2. Creates a VincentToolExecution object with all required fields
 * 3. Generates an EIP-712 compliant Safe message string
 * 4. Computes the Safe message hash for on-chain verification
 * 
 * @param params - Configuration parameters for creating the Vincent Safe message
 * @param appId - Vincent application identifier
 * @param appVersion - Version of the Vincent application
 * @param toolIpfsCid - IPFS Content Identifier for the tool to execute
 * @param toolParameters - Parameters object for the tool execution
 * @param agentWalletAddress - Ethereum address of the agent wallet
 * @param expiryUnixTimestamp - Unix timestamp when the execution expires
 * @param safeConfig - Safe wallet configuration
 * @param safeConfig.safeAddress - Address of the Safe multisig wallet
 * @param safeConfig.litChainIdentifier - Lit Protocol chain identifier for where the Safe is deployed
 * @param nonce - Optional unique nonce (generated if not provided)
 * 
 * @returns Object containing the complete Vincent Safe message components
 * @returns returns.vincentToolExecution - The structured Vincent tool execution data
 * @returns returns.safeMessageString - The EIP-712 compliant Safe message as a string
 * @returns returns.safeMessageHash - Keccak256 hash of the Safe message for verification
 * 
 * @example
 * ```typescript
 * const result = createVincentSafeMessage({
 *   appId: 1,
 *   appVersion: 1,
 *   toolIpfsCid: 'QmXxx...',
 *   toolParameters: { amount: '1000', recipient: '0x...' },
 *   agentWalletAddress: '0x123...',
 *   expiryUnixTimestamp: 1234567890,
 *   safeConfig: {
 *     safeAddress: '0xabc...',
 *     litChainIdentifier: 'ethereum'
 *   }
 * });
 * 
 * console.log(result.safeMessageHash); // Can be used for Safe API operations
 * ```
 * 
 * @throws {Error} When litChainIdentifier is not found in LIT_CHAINS
 * @throws {Error} When required parameters are missing or invalid
 * @throws {Error} When expiryUnixTimestamp is not a valid Unix timestamp (must be positive integer)
 * 
 * @see {@link getSafeMessageString} for EIP-712 message string generation
 * @see {@link generateSafeMessageHash} for Safe message hash computation
 * @see {@link deterministicStringify} for parameter serialization
 */
export function createVincentSafeMessage({
  appId,
  appVersion,
  toolIpfsCid,
  toolParameters,
  agentWalletAddress,
  expiryUnixTimestamp,
  safeConfig,
  nonce = generateNonce(),
}: CreateVincentSafeMessageParams): CreateVincentSafeMessageResult {
  // Validate and convert expiry timestamp to string
  const expiryString = validateAndConvertExpiry(expiryUnixTimestamp);
  
  // Serialize tool parameters
  const toolParametersString = deterministicStringify(toolParameters);

  // Create Vincent execution object
  const vincentToolExecution: VincentToolExecution = {
    appId,
    appVersion,
    toolIpfsCid,
    toolParametersString,
    agentWalletAddress,
    expiry: expiryString,
    nonce,
  };

  // Generate Safe message string
  const safeMessageString = getSafeMessageString({
    vincentToolExecution,
    eip712ChainId: LIT_CHAINS[safeConfig.litChainIdentifier].chainId,
    eip712VerifyingContract: safeConfig.safeAddress,
  });

  // Generate Safe message hash
  const safeMessageHash = generateSafeMessageHash({
    safeMessageString,
    safeAddress: safeConfig.safeAddress,
    chainId: LIT_CHAINS[safeConfig.litChainIdentifier].chainId,
  });

  return {
    vincentToolExecution,
    safeMessageString,
    safeMessageHash,
  };
}

/**
 * @function validateAndConvertExpiry
 * @description Validates and converts expiry timestamp to a string with proper type checking.
 * This function ensures that the expiry value is a valid number or string representing
 * a Unix timestamp, and safely converts it to a string format.
 * 
 * @param expiry - The expiry timestamp as number or string
 * @returns A string representation of the Unix timestamp
 * 
 * @throws {Error} When the expiry value is invalid or cannot be converted
 * 
 * @example
 * ```typescript
 * validateAndConvertExpiry(1234567890); // '1234567890'
 * validateAndConvertExpiry('1234567890'); // '1234567890'
 * validateAndConvertExpiry(null); // throws Error
 * ```
 * 
 * @internal This is an internal helper function used by createVincentSafeMessage
 */
function validateAndConvertExpiry(expiry: number | string): string {
  // Handle null, undefined, or other falsy values
  if (expiry === null || expiry === undefined) {
    throw new Error('[createVincentSafeMessage] Expiry timestamp cannot be null or undefined');
  }

  // Handle number type
  if (typeof expiry === 'number') {
    // Validate it's a finite number
    if (!Number.isFinite(expiry)) {
      throw new Error('[createVincentSafeMessage] Expiry timestamp must be a finite number');
    }
    
    // Validate it's a positive integer (Unix timestamps should be positive)
    if (expiry < 0) {
      throw new Error('[createVincentSafeMessage] Expiry timestamp must be a positive number');
    }
    
    // Validate it's not a decimal (Unix timestamps are integers)
    if (!Number.isInteger(expiry)) {
      throw new Error('[createVincentSafeMessage] Expiry timestamp must be an integer');
    }
    
    return expiry.toString();
  }

  // Handle string type
  if (typeof expiry === 'string') {
    // Check if string is empty
    if (expiry.trim() === '') {
      throw new Error('[createVincentSafeMessage] Expiry timestamp string cannot be empty');
    }
    
    // Validate it's a valid numeric string
    const numericValue = Number(expiry);
    if (Number.isNaN(numericValue)) {
      throw new Error('[createVincentSafeMessage] Expiry timestamp string must represent a valid number');
    }
    
    // Apply same validations as for numbers
    if (!Number.isFinite(numericValue)) {
      throw new Error('[createVincentSafeMessage] Expiry timestamp must represent a finite number');
    }
    
    if (numericValue < 0) {
      throw new Error('[createVincentSafeMessage] Expiry timestamp must represent a positive number');
    }
    
    if (!Number.isInteger(numericValue)) {
      throw new Error('[createVincentSafeMessage] Expiry timestamp must represent an integer');
    }
    
    // Return the original string to preserve any specific formatting
    return expiry.trim();
  }

  // Handle any other type
  throw new Error(`[createVincentSafeMessage] Expiry timestamp must be a number or string, received: ${typeof expiry}`);
}