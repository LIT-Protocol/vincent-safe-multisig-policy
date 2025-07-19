/**
 * @module @lit-protocol/vincent-safe-multisig-policy-sdk
 * @description
 * The Vincent Safe Multisig Policy SDK provides a comprehensive toolkit for creating and validating
 * Safe multisig messages with EIP-712 compliance and seamless Lit Protocol integration.
 * 
 * ## Features
 * - **Create EIP-712 Safe Messages:** Easily construct Vincent-compliant Safe messages for multisig execution.
 * - **Validate Safe Messages:** Perform full validation of Safe messages, including signature, threshold, and EIP-712 structure checks.
 * - **Chain Support Utilities:** Query which Lit chains are supported by Safe Transaction Service.
 * 
 * ## Usage Example
 * ```typescript
 * import {
 *   createVincentSafeMessage,
 *   validateSafeMessage,
 *   getSupportedSafeChains,
 *   isChainSupportedBySafe
 * } from '@lit-protocol/vincent-safe-multisig-policy-sdk';
 * 
 * // Create a new Safe message for Vincent tool execution
 * const message = createVincentSafeMessage({
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
 * // Validate a Safe message before execution
 * const result = await validateSafeMessage({
 *   safeRpcUrl: 'https://mainnet.infura.io/v3/...',
 *   safeAddress: '0x123...',
 *   litChainIdentifier: 'ethereum',
 *   safeApiKey: 'your-api-key',
 *   safeMessageHash: '0xabc...',
 *   executingToolParams: { amount: '1000', recipient: '0x...' },
 *   toolIpfsCid: 'QmXxx...',
 *   delegatorEthAddress: '0x123...',
 *   appId: 1,
 *   appVersion: 1
 * });
 * 
 * if (result.success) {
 *   console.log('Safe message is valid for execution');
 * } else {
 *   console.error('Validation failed:', result.error);
 * }
 * 
 * // Query supported chains
 * const supportedChains = getSupportedSafeChains();
 * const isEthereumSupported = isChainSupportedBySafe('ethereum'); // true
 * 
 * // Access SafeMessageTracker contract data
 * import { 
 *   safeMessageTrackerContractAddress,
 *   safeMessageTrackerContractData,
 *   safeMessageTrackerSignatures
 * } from '@lit-protocol/vincent-safe-multisig-policy-sdk';
 * 
 * console.log('Contract Address:', safeMessageTrackerContractAddress);
 * // Use contract data for ethers.js interactions
 * // Use method signatures for Vincent policy implementations
 * const consumeMethod = safeMessageTrackerSignatures.SafeMessageTracker.methods.consume;
 * ```
 * 
 * @see {@link createVincentSafeMessage} for message creation
 * @see {@link validateSafeMessage} for message validation
 * @see {@link getSupportedSafeChains} for supported chain list
 * @see {@link isChainSupportedBySafe} for individual chain support check
 * @see {@link safeMessageTrackerContractAddress} for SafeMessageTracker contract address
 * @see {@link safeMessageTrackerContractData} for SafeMessageTracker contract ABI
 * @see {@link safeMessageTrackerSignatures} for SafeMessageTracker method signatures
 */

export * from './helpers/createVincentSafeMessage';
export * from './helpers/validateSafeMessage';
export * from './helpers/getSupportedSafeChains';
export * from './helpers/isChainSupportedBySafe';
export * from './helpers/getSafeMessageString';
export * from './helpers/generateSafeMessageHash';
export * from './helpers/deterministicStringify';
export * from './helpers/getSafeTransactionServiceUrl';
export type {
    EIP712Domain,
    EIP712Message,
    VincentToolExecution,
    SupportedLitChainIdentifier,
    ValidateSafeMessageParams,
    ValidateSafeMessageResult
} from './types';

export * from './safe-message-tracker-contract-data';
export { safeMessageTrackerSignatures } from './safe-message-tracker-signatures';
