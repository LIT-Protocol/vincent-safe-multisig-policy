/**
 * @fileoverview EIP-712 message string generation for Safe messages
 * @description This module creates EIP-712 compliant message strings from Vincent tool execution data.
 */

import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES } from '../constants';
import type { VincentToolExecution, EIP712Message, SafeMessageConfig } from '../types';
import { deterministicStringify, type SerializableObject } from './deterministicStringify';

/**
 * @function getSafeMessageString
 * @description Generates an EIP-712 compliant message string from Vincent tool execution data.
 * This function creates a structured EIP-712 message that can be signed by Safe owners
 * and verified on-chain using the Safe Protocol's message verification mechanisms.
 * 
 * The function performs the following operations:
 * 1. Creates an EIP-712 message structure with proper types and domain
 * 2. Applies the provided chain ID and verifying contract address
 * 3. Serializes the complete message to a deterministic JSON string
 * 
 * @param config - Configuration for creating the Safe message string
 * @param config.vincentToolExecution - The Vincent tool execution data to be signed
 * @param config.eip712ChainId - Chain ID for the EIP-712 domain separator
 * @param config.eip712VerifyingContract - Contract address for the EIP-712 domain (typically the Safe address)
 * 
 * @returns A deterministic JSON string representation of the EIP-712 message
 * 
 * @example
 * ```typescript
 * const messageString = getSafeMessageString({
 *   vincentToolExecution: {
 *     appId: 1,
 *     appVersion: 1,
 *     toolIpfsCid: 'QmXxx...',
 *     toolParametersString: '{"amount":"1000"}',
 *     agentWalletAddress: '0x123...',
 *     expiry: '1234567890',
 *     nonce: '1672531200000123456'
 *   },
 *   eip712ChainId: 1,
 *   eip712VerifyingContract: '0xabc...'
 * });
 * 
 * console.log(messageString); // Deterministic JSON string
 * ```
 * 
 * @see {@link createEIP712Message} for the internal message structure creation
 * @see {@link deterministicStringify} for the serialization process
 */
export function getSafeMessageString({
  vincentToolExecution,
  eip712ChainId,
  eip712VerifyingContract,
}: SafeMessageConfig): string {
  // Safe type assertion: EIP712 message structure contains only primitive types and plain objects
  // which are all serializable (strings, numbers, arrays, and plain objects)
  return deterministicStringify(
    createEIP712Message(
      eip712ChainId,
      eip712VerifyingContract,
      vincentToolExecution
    ) as unknown as SerializableObject
  );
}

/**
 * @function createEIP712Message
 * @description Creates a complete EIP-712 message structure from Vincent tool execution data.
 * This internal helper function assembles all the components needed for EIP-712 compliance,
 * including type definitions, domain parameters, and the actual message data.
 * 
 * @param eip712ChainId - Chain ID for the EIP-712 domain separator
 * @param eip712VerifyingContract - Contract address for the EIP-712 domain
 * @param message - The Vincent tool execution data to be structured
 * 
 * @returns Complete EIP-712 message structure ready for signing or hashing
 * 
 * @internal This is an internal helper function used by getSafeMessageString
 */
function createEIP712Message(
  eip712ChainId: number,
  eip712VerifyingContract: string,
  message: VincentToolExecution
): Omit<EIP712Message, "message"> & { message: VincentToolExecution } {
  return {
    types: {
      VincentToolExecution: [...EIP712_MESSAGE_TYPES.VincentToolExecution]
    },
    domain: {
      ...EIP712_DOMAIN,
      chainId: eip712ChainId,
      verifyingContract: eip712VerifyingContract,
    },
    primaryType: "VincentToolExecution",
    message,
  };
}