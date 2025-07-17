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
 * @param params.appId - Vincent application identifier
 * @param params.appVersion - Version of the Vincent application
 * @param params.toolIpfsCid - IPFS Content Identifier for the tool to execute
 * @param params.toolParameters - Parameters object for the tool execution
 * @param params.agentWalletAddress - Ethereum address of the agent wallet
 * @param params.expiryUnixTimestamp - Unix timestamp when the execution expires
 * @param params.safeConfig - Safe wallet configuration
 * @param params.safeConfig.safeAddress - Address of the Safe multisig wallet
 * @param params.safeConfig.litChainIdentifier - Lit Protocol chain identifier
 * @param params.nonce - Optional unique nonce (generated if not provided)
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
 * 
 * @see {@link getSafeMessageString} for EIP-712 message string generation
 * @see {@link generateSafeMessageHash} for Safe message hash computation
 * @see {@link deterministicStringify} for parameter serialization
 */
export function createVincentSafeMessage(params: CreateVincentSafeMessageParams): CreateVincentSafeMessageResult {
  const {
    appId,
    appVersion,
    toolIpfsCid,
    toolParameters,
    agentWalletAddress,
    expiryUnixTimestamp,
    safeConfig,
    nonce = generateNonce(),
  } = params;

  // Serialize tool parameters
  const toolParametersString = deterministicStringify(toolParameters);

  // Create Vincent execution object
  const vincentToolExecution: VincentToolExecution = {
    appId,
    appVersion,
    toolIpfsCid,
    toolParametersString,
    agentWalletAddress,
    expiry: expiryUnixTimestamp.toString(),
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