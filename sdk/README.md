# Vincent Safe Multisig Policy SDK

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![npm version](https://img.shields.io/npm/v/@lit-protocol/vincent-policy-safe-multisig-sdk)

SDK for creating Safe messages compatible with Vincent Safe Multisig Policy. This library provides a comprehensive toolkit for creating and validating Safe multisig messages with EIP-712 compliance and seamless Lit Protocol integration.

## Installation

```bash
npm install @lit-protocol/vincent-policy-safe-multisig-sdk
```

## Features

- **Create EIP-712 Safe Messages**: Easily construct Vincent-compliant Safe messages for multisig execution
- **Validate Safe Messages**: Perform full validation of Safe messages, including signature, threshold, and EIP-712 structure checks
- **Chain Support Utilities**: Query which Lit chains are supported by Safe Transaction Service
- **SafeMessageTracker Contract Data**: Pre-configured contract address and ABI for message tracking
- **TypeScript Support**: Full TypeScript type definitions for all interfaces and functions

## Quick Start

```typescript
import {
  createVincentSafeMessage,
  validateSafeMessage,
  getSupportedSafeChains,
  isChainSupportedBySafe,
  safeMessageTrackerContractAddress,
  safeMessageTrackerContractData,
  safeMessageTrackerSignatures
} from '@lit-protocol/vincent-policy-safe-multisig-sdk';

// Create a new Safe message for Vincent tool execution
const message = createVincentSafeMessage({
  appId: 1,
  appVersion: 1,
  toolIpfsCid: 'QmXxx...',
  toolParameters: { amount: '1000', recipient: '0x...' },
  agentWalletAddress: '0x123...',
  expiryUnixTimestamp: 1234567890,
  safeConfig: {
    safeAddress: '0xabc...',
    litChainIdentifier: 'ethereum'
  }
});

// Validate a Safe message before execution
const result = await validateSafeMessage({
  safeRpcUrl: 'https://mainnet.infura.io/v3/...',
  safeAddress: '0x123...',
  litChainIdentifier: 'ethereum',
  safeApiKey: 'your-api-key',
  safeMessageHash: '0xabc...',
  executingToolParams: { amount: '1000', recipient: '0x...' },
  toolIpfsCid: 'QmXxx...',
  delegatorEthAddress: '0x123...',
  appId: 1,
  appVersion: 1
});

if (result.success) {
  console.log('Safe message is valid for execution');
} else {
  console.error('Validation failed:', result.error);
}
```

## API Reference

### Core Functions

#### `createVincentSafeMessage(params)`
Creates a new Vincent-compliant Safe message with EIP-712 structure.

**Parameters:**
- `appId` (number): Vincent application ID
- `appVersion` (number): Vincent application version
- `toolIpfsCid` (string): IPFS Content Identifier for the tool
- `toolParameters` (object): Parameters for tool execution
- `agentWalletAddress` (string): Ethereum address of the agent wallet
- `expiryUnixTimestamp` (number|string): Unix timestamp when message expires
- `safeConfig.safeAddress` (string): Address of the Safe multisig wallet
- `safeConfig.litChainIdentifier` (SupportedLitChainIdentifier): Lit chain identifier
- `nonce` (string, optional): Unique nonce (auto-generated if not provided)

**Returns:** `CreateVincentSafeMessageResult`
- `vincentToolExecution`: Structured tool execution data
- `safeMessageString`: Safe message as string
- `safeMessageHash`: Keccak256 hash of the message

#### `validateSafeMessage(params)`
Validates a Safe message against expected Vincent tool execution data.

**Parameters:**
- `safeRpcUrl` (string): RPC URL for blockchain network
- `safeAddress` (string): Address of the Safe multisig wallet
- `litChainIdentifier` (SupportedLitChainIdentifier): Lit chain identifier
- `safeApiKey` (string): API key for Safe Transaction Service
- `safeMessageHash` (string): Hash of the Safe message to validate
- `executingToolParams` (object): Parameters for the executing tool
- `toolIpfsCid` (string): IPFS CID for the tool
- `delegatorEthAddress` (string): Ethereum address of the delegator
- `appId` (number): Vincent application ID
- `appVersion` (number): Vincent application version
- `logPrefix` (string, optional): Prefix for logging messages

**Returns:** `ValidateSafeMessageResult`
- `success` (boolean): Whether validation was successful
- `error` (string, optional): Error message if validation failed
- `details` (object, optional): Additional validation details
- `safeMessage` (SafeMessageResponse, optional): Retrieved Safe message data

### Utility Functions

#### `getSupportedSafeChains()`
Returns an array of all Lit chain identifiers supported by Safe Transaction Service.

**Returns:** `SupportedLitChainIdentifier[]`

#### `isChainSupportedBySafe(chainId)`
Checks if a specific Lit chain identifier is supported by Safe Transaction Service.

**Parameters:**
- `chainId` (string): Lit chain identifier to check

**Returns:** `boolean`

### Contract Data

#### `safeMessageTrackerContractAddress`
The deployed address of the SafeMessageTracker contract.

**Type:** `string` (Ethereum address)

#### `safeMessageTrackerContractData`
The ABI data for the SafeMessageTracker contract, ready for use with ethers.js or other web3 libraries.

**Type:** `const` array containing contract ABI

#### `safeMessageTrackerSignatures`
Pre-formatted method signatures for the SafeMessageTracker contract, optimized for Vincent policy implementations.

**Type:** `const` object containing method and event signatures

**Contract Functions:**
- `consume(messageHashes: bytes32[])`: Mark message hashes as consumed
- `consumedMessages(address, bytes32)`: Check if a message has been consumed
- `getConsumedAt(consumer: address, messageHash: bytes32)`: Get timestamp when message was consumed

**Example Usage:**
```typescript
import { ethers } from 'ethers';
import { 
  safeMessageTrackerContractAddress,
  safeMessageTrackerContractData,
  safeMessageTrackerSignatures
} from '@lit-protocol/vincent-policy-safe-multisig-sdk';

// Using contract data for full ethers.js contract instance
const provider = new ethers.providers.JsonRpcProvider('...');
const contract = new ethers.Contract(
  safeMessageTrackerContractAddress,
  safeMessageTrackerContractData[0].SafeMessageTracker,
  provider
);

// Check if a message has been consumed
const consumedAt = await contract.getConsumedAt(consumerAddress, messageHash);

// Using method signatures for Vincent policy implementations
const consumeMethodSignature = safeMessageTrackerSignatures.SafeMessageTracker.methods.consume;
```

## Supported Chains

The SDK supports the following Lit Protocol chains that are compatible with Safe Transaction Service:

- arbitrum
- aurora
- avalanche
- base
- baseSepolia
- bsc
- celo
- chiado
- ethereum
- mantle
- optimism
- polygon
- scroll
- sepolia
- sonicMainnet
- zkEvm
- zksync

## Type Definitions

The SDK exports comprehensive TypeScript interfaces for all data structures:

- `VincentToolExecution`: Core tool execution parameters
- `EIP712Domain`: EIP-712 domain separator parameters
- `EIP712Message`: Complete EIP-712 typed data structure
- `SafeMessageResponse`: Response from Safe Transaction Service API
- `SupportedLitChainIdentifier`: Union type of supported chain identifiers

## Error Handling

All functions return structured results with success/error indicators. Validation functions provide detailed error messages and expected vs. received values for debugging.

## Peer Dependencies

- `ethers@^5.7.2`: Required for blockchain interactions

## License

MIT

## Contributing

Issues and pull requests are welcome. Please see the [repository](https://github.com/LIT-Protocol/vincent-safe-multisig-policy) for more information.