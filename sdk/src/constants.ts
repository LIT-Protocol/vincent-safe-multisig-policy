/**
 * @fileoverview Constants for EIP-712 typed data structures used in Vincent Safe Multisig Policy
 * @description This module defines the standard EIP-712 domain and message type structures
 * that are used for creating and validating Safe multisig messages.
 */

/**
 * @constant EIP712_DOMAIN
 * @description Default EIP-712 domain parameters for Vincent Safe Multisig Policy.
 * The chainId and verifyingContract are placeholders that get overridden at runtime
 * based on the specific Safe configuration.
 * 
 * @example
 * ```typescript
 * const domain = {
 *   ...EIP712_DOMAIN,
 *   chainId: 1, // Ethereum mainnet
 *   verifyingContract: "0x..." // Actual Safe address
 * };
 * ```
 */
export const EIP712_DOMAIN = {
  /** @description Human-readable name identifying this domain */
  name: "@lit-protocol/vincent-policy-safe-multisig",
  /** @description Version of the domain specification */
  version: "1",
  /** @description Placeholder chain ID - will be overridden with actual chain ID */
  chainId: 0,
  /** @description Placeholder contract address - will be overridden with actual Safe address */
  verifyingContract: "0x0000000000000000000000000000000000000000",
} as const;

/**
 * @constant EIP712_MESSAGE_TYPES
 * @description EIP-712 type definitions for VincentToolExecution messages.
 * This defines the structure and Solidity types for each field in the message.
 * 
 * @example
 * ```typescript
 * const typedData = {
 *   types: EIP712_MESSAGE_TYPES,
 *   domain: EIP712_DOMAIN,
 *   primaryType: 'VincentToolExecution',
 *   message: vincentToolExecution
 * };
 * ```
 */
export const EIP712_MESSAGE_TYPES = {
  /** @description Type definition for VincentToolExecution structured data */
  VincentToolExecution: [
    /** @description Vincent application identifier */
    { name: "appId", type: "uint256" },
    /** @description Vincent application version */
    { name: "appVersion", type: "uint256" },
    /** @description IPFS Content Identifier for the tool */
    { name: "toolIpfsCid", type: "string" },
    /** @description JSON-stringified tool parameters */
    { name: "toolParametersString", type: "string" },
    /** @description Ethereum address of the agent wallet */
    { name: "agentWalletAddress", type: "string" },
    /** @description Unix timestamp string for expiration */
    { name: "expiry", type: "string" },
    /** @description Unique nonce to prevent replay attacks */
    { name: "nonce", type: "string" },
  ],
} as const;