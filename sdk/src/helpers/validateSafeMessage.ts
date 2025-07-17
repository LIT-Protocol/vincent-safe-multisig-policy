/**
 * @fileoverview Comprehensive Safe message validation orchestrator
 * @description This module provides the main validation function that orchestrates
 * all aspects of Safe message verification including signature validation, threshold checks,
 * EIP-712 compliance, and expiration validation.
 */

import { ethers } from "ethers";
import { LIT_CHAINS } from "@lit-protocol/constants";

import { buildEIP712Signature } from "./buildEIP712Signature";
import { getSafeMessage } from "./getSafeMessage";
import { getSafeThreshold } from "./getSafeThreshold";
import { getSafeTransactionServiceUrl } from "./getSafeTransactionServiceUrl";
import { isValidSafeSignature } from "./isValidSafeSignature";
import { parseAndValidateEIP712Message } from "./parseAndValidateEIP712Message";
import { deterministicStringify, type SerializableValue } from "./deterministicStringify";
import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES } from "../constants";
import type { EIP712Message, ValidateSafeMessageParams, ValidateSafeMessageResult } from "../types";

/**
 * @function validateSafeMessage
 * @description Performs comprehensive validation of a Safe message for Vincent tool execution.
 * This is the main validation function that orchestrates multiple validation steps to ensure
 * a Safe message is authentic, properly signed, and safe for execution.
 * 
 * The validation process includes:
 * 1. **Message Retrieval**: Fetches the Safe message from Transaction Service API
 * 2. **Threshold Validation**: Ensures sufficient owner confirmations exist
 * 3. **EIP-712 Validation**: Validates message structure and content against expected parameters
 * 4. **Signature Validation**: Verifies the cryptographic signature using Safe's isValidSignature
 * 5. **Expiration Check**: Ensures the message hasn't expired
 * 
 * @param params - Configuration parameters for Safe message validation
 * @param params.safeRpcUrl - RPC URL for blockchain interaction
 * @param params.safeAddress - Address of the Safe multisig wallet
 * @param params.litChainIdentifier - Lit Protocol chain identifier
 * @param params.safeApiKey - API key for Safe Transaction Service
 * @param params.safeMessageHash - Hash of the message to validate
 * @param params.executingToolParams - Expected tool parameters for validation
 * @param params.toolIpfsCid - Expected IPFS CID of the tool
 * @param params.delegatorEthAddress - Expected agent wallet address
 * @param params.appId - Expected Vincent application ID
 * @param params.appVersion - Expected Vincent application version
 * @param params.logPrefix - Optional prefix for logging messages
 * 
 * @returns Promise resolving to validation result with success status and details
 * @returns returns.success - Whether the validation passed completely
 * @returns returns.error - Error message if validation failed
 * @returns returns.details - Additional validation details (signatures, thresholds, etc.)
 * @returns returns.safeMessage - The validated Safe message (if successful)
 * 
 * @throws {Error} When network requests fail or blockchain interactions error
 * @throws {Error} When the Safe address is invalid or not accessible
 * 
 * @example
 * ```typescript
 * const result = await validateSafeMessage({
 *   safeRpcUrl: 'https://mainnet.infura.io/v3/...',
 *   safeAddress: '0x123...',
 *   litChainIdentifier: 'ethereum',
 *   safeApiKey: 'your-api-key',
 *   safeMessageHash: '0xabc...',
 *   executingToolParams: { amount: '1000', recipient: '0x456...' },
 *   toolIpfsCid: 'QmXxx...',
 *   delegatorEthAddress: '0x789...',
 *   appId: 1,
 *   appVersion: 1
 * });
 * 
 * if (result.success) {
 *   console.log('Message is valid - proceed with execution');
 *   const safeMessage = result.safeMessage;
 * } else {
 *   console.error('Validation failed:', result.error);
 *   console.log('Details:', result.details);
 * }
 * ```
 * 
 * @see {@link ValidateSafeMessageParams} for detailed parameter descriptions
 * @see {@link ValidateSafeMessageResult} for complete result structure
 * 
 * @note This function includes comprehensive logging for debugging and audit purposes.
 * All validation steps are performed sequentially with early returns on failure.
 */
export async function validateSafeMessage({
  safeRpcUrl,
  safeAddress,
  litChainIdentifier,
  safeApiKey,
  safeMessageHash,
  executingToolParams,
  toolIpfsCid,
  delegatorEthAddress,
  appId,
  appVersion,
  logPrefix,
}: ValidateSafeMessageParams): Promise<ValidateSafeMessageResult> {
  logPrefix = logPrefix || "validateSafeMessage";

  /**
   * ====================================
   * Get the Safe message from Safe Transaction Service
   * ====================================
   */
  const safeProvider = new ethers.providers.StaticJsonRpcProvider(safeRpcUrl);

  const retrievedSafeMessage = await getSafeMessage({
    safeTransactionServiceUrl: getSafeTransactionServiceUrl({ litChainIdentifier }),
    safeAddress,
    safeApiKey,
    messageHash: safeMessageHash,
  });
  console.log(`[${logPrefix}] Retrieved Safe message: ${JSON.stringify(retrievedSafeMessage, null, 2)}`);

  /**
   * ====================================
   * Check if the number of signatures is equal to or greater than the Safe's threshold
   * ====================================
   */
  const threshold = await getSafeThreshold({ provider: safeProvider, safeAddress });
  console.log(`[${logPrefix}] Safe threshold: ${threshold}`);

  if (retrievedSafeMessage.confirmations.length < threshold) {
    return {
      success: false,
      error: "Insufficient signatures",
      details: {
        safeAddress,
        currentNumberOfSignatures: retrievedSafeMessage.confirmations.length,
        requiredNumberOfSignatures: threshold,
      }
    };
  }

  /**
   * ====================================
   * Validate the structure of the signed EIP-712 message.
   * Also validate the parsed values match the App Id, App Version, Tool IPFS CID, and Tool parameters.
   * ====================================
   */
  const retrievedEip712Message = JSON.parse(retrievedSafeMessage.message) as EIP712Message;

  const eip712ValidationResult = parseAndValidateEIP712Message({
    expectedEip712Message: {
      types: {
        VincentToolExecution: [...EIP712_MESSAGE_TYPES.VincentToolExecution]
      },
      domain: {
        ...EIP712_DOMAIN,
        chainId: LIT_CHAINS[litChainIdentifier].chainId,
        verifyingContract: safeAddress,
      },
      primaryType: "VincentToolExecution",
      message: {
        appId,
        appVersion,
        toolIpfsCid,
        toolParametersString: deterministicStringify(executingToolParams as SerializableValue),
        agentWalletAddress: delegatorEthAddress,
        expiry: retrievedEip712Message.message.expiry,
        nonce: retrievedEip712Message.message.nonce,
      },
    },
    retrievedEip712Message,
  });

  if (!eip712ValidationResult.success) {
    return {
      success: false,
      error: eip712ValidationResult.error || "EIP712 validation failed",
      details: {
        safeAddress,
        messageHash: safeMessageHash,
        expected: eip712ValidationResult.expected,
        received: eip712ValidationResult.received,
      }
    };
  }

  /**
   * ====================================
   * Validate the signature returned by Safe Transaction Service against the Safe contract
   * ====================================
   */
  console.log(`[${logPrefix}] retrievedSafeMessage.message: ${retrievedSafeMessage.message}`);
  const hashedSafeMessage = ethers.utils.hashMessage(
    ethers.utils.toUtf8Bytes(retrievedSafeMessage.message as string)
  );
  console.log(`[${logPrefix}] hashedSafeMessage: ${hashedSafeMessage}`);

  // Use the preparedSignature from Safe Transaction Service if available
  const eip712Signature = retrievedSafeMessage.preparedSignature || buildEIP712Signature(retrievedSafeMessage.confirmations);
  console.log(`[${logPrefix}] eip712Signature: ${eip712Signature}`);

  const isValid = await isValidSafeSignature({
    provider: safeProvider,
    safeAddress,
    dataHash: hashedSafeMessage,
    signature: eip712Signature,
  });
  console.log(`[${logPrefix}] isValidSafeSignature: ${isValid}`);

  if (!isValid) {
    return {
      success: false,
      error: "Invalid Safe signature",
      details: {
        confirmations: retrievedSafeMessage.confirmations,
      }
    };
  }

  return {
    success: true,
    safeMessage: retrievedSafeMessage,
  };
}