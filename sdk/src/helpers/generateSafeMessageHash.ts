/**
 * @fileoverview Safe message hash generation using EIP-712 standards
 * @description This module provides functionality to generate Safe-compatible message hashes
 * that follow the EIP-712 typed data standard for secure message signing.
 */

import { ethers } from "ethers";

import type { SafeMessageHashConfig } from "../types";

/**
 * @function generateSafeMessageHash
 * @description Generates an EIP-712 compliant hash for a Safe message that can be used for on-chain verification.
 * This function follows the Safe Protocol's message hashing specification, which involves:
 * 1. Hashing the message string using Ethereum's message hashing
 * 2. Creating an EIP-712 typed data structure with SafeMessage type
 * 3. Computing the final hash using EIP-712 encoding
 * 
 * The resulting hash can be used with Safe's isValidSignature function for verification.
 * 
 * @param config - Configuration for generating the Safe message hash
 * @param config.safeMessageString - The message content as a string
 * @param config.safeAddress - Address of the Safe multisig wallet (used as verifying contract)
 * @param config.chainId - Chain ID where the Safe is deployed (prevents cross-chain replay)
 * 
 * @returns The EIP-712 hash of the Safe message, suitable for signature verification
 * 
 * @example
 * ```typescript
 * const messageHash = generateSafeMessageHash({
 *   safeMessageString: 'Hello Safe!',
 *   safeAddress: '0x123...',
 *   chainId: 1
 * });
 * 
 * console.log(messageHash); // '0xabc123...' (32-byte hash)
 * 
 * // This hash can now be used with Safe's isValidSignature
 * const isValid = await safeContract.isValidSignature(messageHash, signature);
 * ```
 * 
 * @see {@link SafeMessageHashConfig} for parameter structure
 * 
 * @note This function includes console logging for debugging the EIP-712 payload,
 * which may be removed in production builds.
 */
export function generateSafeMessageHash({
  safeMessageString,
  safeAddress,
  chainId,
}: SafeMessageHashConfig): string {
  const messageHash = ethers.utils.hashMessage(
    ethers.utils.toUtf8Bytes(safeMessageString)
  );

  const safeMessageTypes = {
    EIP712Domain: [
      {
        type: "uint256",
        name: "chainId",
      },
      {
        type: "address",
        name: "verifyingContract",
      },
    ],
    SafeMessage: [{ type: "bytes", name: "message" }],
  };

  const domain = {
    chainId,
    verifyingContract: safeAddress,
  };

  const eip712Payload = ethers.utils._TypedDataEncoder.getPayload(
    domain,
    { SafeMessage: safeMessageTypes.SafeMessage },
    { message: messageHash }
  );
  console.log("[generateSafeMessageHash] eip712Payload: ", eip712Payload);

  return ethers.utils._TypedDataEncoder.hash(
    domain,
    { SafeMessage: safeMessageTypes.SafeMessage },
    { message: messageHash }
  );
}
