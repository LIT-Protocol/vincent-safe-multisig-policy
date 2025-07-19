/**
 * @fileoverview Type definitions for Vincent Safe Multisig Policy SDK
 * @description This module contains all TypeScript interfaces and types used throughout the SDK
 * for Safe multisig message creation, validation, and EIP-712 compliance.
 */

import type { ethers } from "ethers";

// Re-export serialization types for external use
export type {
  SerializableValue,
  SerializableObject,
  SerializableArray
} from './helpers/deterministicStringify';

/**
 * @type SupportedLitChainIdentifier
 * @category Interfaces
 * @description Union type of all Lit Protocol chain identifiers that are supported by Safe Transaction Service.
 * This type ensures compile-time validation of chain identifiers and prevents usage of unsupported chains.
 * 
 * @example
 * ```typescript
 * // Valid chain identifiers
 * const validChain: SupportedLitChainIdentifier = 'ethereum'; // ✓
 * const anotherValid: SupportedLitChainIdentifier = 'polygon'; // ✓
 * 
 * // Invalid chain identifier (TypeScript error)
 * const invalidChain: SupportedLitChainIdentifier = 'unsupported-chain'; // ✗
 * ```
 * 
 * @see {@link getSupportedSafeChains} for runtime list of supported chains
 * @see {@link isChainSupportedBySafe} for runtime validation
 */
export type SupportedLitChainIdentifier =
  | 'arbitrum'
  | 'aurora'
  | 'avalanche'
  | 'base'
  | 'baseSepolia'
  | 'bsc'
  | 'celo'
  | 'chiado'
  | 'ethereum'
  | 'mantle'
  | 'optimism'
  | 'polygon'
  | 'scroll'
  | 'sepolia'
  | 'sonicMainnet'
  | 'zkEvm'
  | 'zksync';

/**
 * @interface VincentToolExecution
 * @category Interfaces
 * @description Represents the core parameters for a Vincent tool execution within a Safe multisig context.
 * This structure defines the essential data that gets signed and validated in the multisig workflow.
 */
export interface VincentToolExecution {
  /** @description Unique identifier for the Vincent application */
  appId: number;
  /** @description Version number of the Vincent application */
  appVersion: number;
  /** @description IPFS Content Identifier for the tool being executed */
  toolIpfsCid: string;
  /** @description JSON-stringified parameters for the tool execution */
  toolParametersString: string;
  /** @description Ethereum address of the agent wallet executing the tool */
  agentWalletAddress: string;
  /** @description Unix timestamp string indicating when the execution expires */
  expiry: string;
  /** @description Unique nonce to prevent replay attacks */
  nonce: string;
}

/**
 * @interface EIP712Domain
 * @category Interfaces
 * @description EIP-712 domain separator parameters that uniquely identify the signing context.
 * These parameters prevent signature replay attacks across different contracts or chains.
 */
export interface EIP712Domain {
  /** @description Human-readable name of the signing domain */
  name: string;
  /** @description Version of the domain separator */
  version: string;
  /** @description Chain ID where the signature is intended to be used */
  chainId: number;
  /** @description Address of the contract that will verify the signature */
  verifyingContract: string;
}

/**
 * @interface EIP712Message
 * @category Interfaces
 * @description Complete EIP-712 typed data structure for Vincent tool execution signatures.
 * This follows the EIP-712 standard for structured data signing.
 */
export interface EIP712Message {
  /** @description Type definitions for the structured data */
  types: {
    /** @description Array of field definitions for VincentToolExecution type */
    VincentToolExecution: Array<{
      /** @description Name of the field */
      name: string;
      /** @description Solidity type of the field */
      type: string;
    }>;
  };
  /** @description Domain separator parameters */
  domain: EIP712Domain;
  /** @description Primary type being signed (should be 'VincentToolExecution') */
  primaryType: string;
  /** @description The actual message data being signed */
  message: VincentToolExecution;
}

/**
 * @interface SafeMessageConfig
 * @description Configuration parameters for creating a Safe message from Vincent tool execution data.
 */
export interface SafeMessageConfig {
  /** @description The Vincent tool execution data to be included in the Safe message */
  vincentToolExecution: VincentToolExecution;
  /** @description Chain ID for EIP-712 domain separator */
  eip712ChainId: number;
  /** @description Contract address for EIP-712 domain separator */
  eip712VerifyingContract: string;
}

/**
 * @interface SafeMessageHashConfig
 * @description Configuration for generating a Safe message hash.
 */
export interface SafeMessageHashConfig {
  /** @description The Safe message content as a string */
  safeMessageString: string;
  /** @description Address of the Safe multisig wallet */
  safeAddress: string;
  /** @description Chain ID where the Safe is deployed */
  chainId: number;
}

/**
 * @interface SafeConfirmation
 * @description Represents a confirmation/signature from a Safe owner for a message.
 */
export interface SafeConfirmation {
  /** @description ISO timestamp when the confirmation was created */
  created?: string;
  /** @description ISO timestamp when the confirmation was last modified */
  modified?: string;
  /** @description Ethereum address of the Safe owner who provided the signature */
  owner?: string;
  /** @description The cryptographic signature provided by the owner */
  signature: string;
  /** @description Type of signature (e.g., 'EOA', 'CONTRACT_SIGNATURE') */
  signatureType?: string;
}

/**
 * @interface SafeMessageResponse
 * @description Response structure from Safe Transaction Service API for a message.
 */
export interface SafeMessageResponse {
  /** @description ISO timestamp when the message was created */
  created: string;
  /** @description ISO timestamp when the message was last modified */
  modified: string;
  /** @description Address of the Safe multisig wallet */
  safe: string;
  /** @description Keccak256 hash of the message */
  messageHash: string;
  /** @description The actual message content */
  message: string;
  /** @description Address of the account that proposed the message */
  proposedBy: string;
  /** @description ID of the Safe App that created the message, if any */
  safeAppId: number | null;
  /** @description Array of confirmations/signatures from Safe owners */
  confirmations: Array<SafeConfirmation>;
  /** @description Pre-prepared signature for execution, if available */
  preparedSignature?: string;
}

/**
 * @interface ValidateSafeMessageParams
 * @description Parameters required for validating a Safe message against expected Vincent tool execution data.
 */
export interface ValidateSafeMessageParams {
  /** @description RPC URL for the blockchain network where the Safe is deployed */
  safeRpcUrl: string;
  /** @description Address of the Safe multisig wallet */
  safeAddress: string;
  /** @description Lit Protocol chain identifier (must be supported by Safe Transaction Service) */
  litChainIdentifier: SupportedLitChainIdentifier;
  /** @description API key for Safe Transaction Service */
  safeApiKey: string;
  /** @description Hash of the Safe message to validate */
  safeMessageHash: string;
  /** @description Parameters for the tool being executed */
  executingToolParams: Record<string, any>;
  /** @description IPFS Content Identifier for the tool */
  toolIpfsCid: string;
  /** @description Ethereum address of the delegator */
  delegatorEthAddress: string;
  /** @description Vincent application ID */
  appId: number;
  /** @description Vincent application version */
  appVersion: number;
  /** @description Optional prefix for logging messages */
  logPrefix?: string;
}

/**
 * @interface ValidateSafeMessageResult
 * @description Result of Safe message validation operation.
 */
export interface ValidateSafeMessageResult {
  /** @description Whether the validation was successful */
  success: boolean;
  /** @description Error message if validation failed */
  error?: string;
  /** @description Additional details about the validation result */
  details?: Record<string, any>;
  /** @description The retrieved Safe message data, if validation was successful */
  safeMessage?: SafeMessageResponse;
}

/**
 * @interface GetSafeMessageParams
 * @description Parameters for retrieving a Safe message from the Transaction Service API.
 */
export interface GetSafeMessageParams {
  /** @description Base URL for the Safe Transaction Service API */
  safeTransactionServiceUrl: string;
  /** @description Address of the Safe multisig wallet */
  safeAddress: string;
  /** @description Hash of the message to retrieve */
  messageHash: string;
  /** @description API key for Safe Transaction Service authentication */
  safeApiKey: string;
}

/**
 * @interface ParseAndValidateEIP712MessageParams
 * @description Parameters for comparing expected vs retrieved EIP-712 messages.
 */
export interface ParseAndValidateEIP712MessageParams {
  /** @description The EIP-712 message that was expected */
  expectedEip712Message: EIP712Message;
  /** @description The EIP-712 message that was actually retrieved */
  retrievedEip712Message: EIP712Message;
}

/**
 * @interface ParseAndValidateEIP712MessageResult
 * @description Result of EIP-712 message comparison and validation.
 */
export interface ParseAndValidateEIP712MessageResult {
  /** @description Whether the messages match and validation was successful */
  success: boolean;
  /** @description Error message if validation failed */
  error?: string;
  /** @description Expected value for the field that failed validation */
  expected?: string | number;
  /** @description Actual received value for the field that failed validation */
  received?: string | number;
  /** @description The validated EIP-712 message if successful */
  validatedEip712Message?: EIP712Message;
}

/**
 * @interface IsValidSafeSignatureParams
 * @description Parameters for validating a signature against a Safe multisig wallet.
 */
export interface IsValidSafeSignatureParams {
  /** @description Ethers.js provider for blockchain interaction */
  provider: ethers.providers.Provider;
  /** @description Address of the Safe multisig wallet */
  safeAddress: string;
  /** @description Hash of the data that was signed */
  dataHash: string;
  /** @description The signature to validate */
  signature: string;
}

/**
 * @interface CreateVincentSafeMessageParams
 * @description Parameters for creating a new Vincent Safe message with EIP-712 compliance.
 */
export interface CreateVincentSafeMessageParams {
  /** @description Vincent application ID */
  appId: number;
  /** @description Vincent application version */
  appVersion: number;
  /** @description IPFS Content Identifier for the tool */
  toolIpfsCid: string;
  /** @description Parameters object for the tool execution */
  toolParameters: Record<string, any>;
  /** @description Ethereum address of the agent wallet */
  agentWalletAddress: string;
  /** @description Unix timestamp when the message expires */
  expiryUnixTimestamp: number | string;
  /** @description Safe wallet configuration */
  safeConfig: {
    /** @description Address of the Safe multisig wallet */
    safeAddress: string;
    /** @description Lit Protocol chain identifier (must be supported by Safe Transaction Service) */
    litChainIdentifier: SupportedLitChainIdentifier;
  };
  /** @description Optional nonce - will be generated if not provided */
  nonce?: string;
}

/**
 * @interface CreateVincentSafeMessageResult
 * @description Result of creating a Vincent Safe message.
 */
export interface CreateVincentSafeMessageResult {
  /** @description The structured Vincent tool execution data */
  vincentToolExecution: VincentToolExecution;
  /** @description The Safe message as a string */
  safeMessageString: string;
  /** @description Keccak256 hash of the Safe message */
  safeMessageHash: string;
}
