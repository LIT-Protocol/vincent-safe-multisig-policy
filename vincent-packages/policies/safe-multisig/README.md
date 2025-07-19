# Vincent Policy Safe Multisig

A policy that can be attached to Vincent tools to require Safe multisig approval before tool execution.

## Overview

This Safe Multisig Vincent Policy is part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK. It ensures that Vincent tools can only be executed after a Safe multisig wallet has approved the operation utilizing a signed EIP-712 message, providing an additional layer of security and governance for tool execution using a Vincent Agent Wallet.

## Features

- Requires Safe multisig approval via EIP-712 message signatures
- Validates signatures against the Safe Transaction Service
- Prevents replay attacks by tracking consumed message hashes
- Supports all chains compatible with Safe Transaction Service and Lit Protocol
- Integrates with the Safe API for real-time validation

## Installation

```bash
npm install @lit-protocol/vincent-policy-safe-multisig
```

## Usage

This policy can be integrated with Vincent Tools to enforce Safe multisig approval:

```typescript
import {
  createVincentToolPolicy,
  createVincentTool,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-safe-multisig';

const toolParamsSchema = z.object({
  amount: z.string(),
  recipient: z.string(),
  safeConfig: z.object({
    safeApiKey: z.string(),
    safeMessageHash: z.string(),
  }),
});

const safeMultisigPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: { 
    safeConfig: 'safeConfig'
  },
});

export const mySecureTool = createVincentTool({
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([safeMultisigPolicy]),
  // ... rest of tool implementation
});
```

## Policy Configuration

### User Parameters

- `safeAddress`: The Safe multisig contract address
- `litChainIdentifier`: The blockchain where the Safe is deployed (must be supported by Safe Transaction Service)

### Tool Parameters

- `safeConfig.safeApiKey`: API key for Safe Transaction Service access
- `safeConfig.safeMessageHash`: Hash of the EIP-712 Safe message signed by multisig owners

## Supported Chains

The policy supports all chains compatible with the Safe Transaction Service:

- Arbitrum
- Aurora
- Avalanche
- Base
- Base Sepolia
- BSC
- Celo
- Chiado
- Ethereum
- Mantle
- Optimism
- Polygon
- Scroll
- Sepolia
- Sonic Mainnet
- zkEVM
- zkSync

## Building and Testing

### Setup the `.env` File

Create a `.env` file in the root of the project by copying the sample file:

```bash
cp .env.vincent-sample .env
```

Then configure the following required environment variables:

1. **PINATA_JWT**: JWT token from Pinata for IPFS pinning
2. **SAFE_WALLET_ADDRESS**: Address of your Safe multisig wallet

The following environment variables are required for running the e2e tests:

1. **TEST_FUNDER_PRIVATE_KEY**: Private key of an account with testnet funds
2. **SAFE_API_KEY**: API key from Safe Transaction Service
3. **SAFE_SIGNER_PRIVATE_KEY_1**: Private key of Safe signer 1 for testing
4. **SAFE_SIGNER_PRIVATE_KEY_2**: Private key of Safe signer 2 for testing

### Building

Run `npm run vincent:build` to build the policy.

### Testing

Run `npm run vincent:e2e:safe` to run the e2e tests.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.