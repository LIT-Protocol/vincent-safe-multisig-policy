# Vincent Safe Multisig Policy

A policy for the Vincent Framework that enforces Safe multisig wallet governance over Vincent Tool executions, with replay protection and validation that the Tool is executing with the approved parameters.

## Overview

The Vincent Safe Multisig Policy integrates with Safe wallets to provide multi-signature governance for Vincent Tool executions. It validates that Tool execution requests have been properly signed by the required number of Safe signers before allowing operations to proceed.

### Key Features

- **Multi-signature Validation**: Requires threshold signatures from Safe wallet owners
- **EIP-712 Message Signing**: Uses typed structured data to define the Vincent Tool execution request
- **Replay Protection**: Implements nonce-based replay attack prevention and tracks message consumption via the [SafeMessageTracker](./contracts/src/SafeMessageTracker.sol) contract
- **Chain-agnostic**: Supports the blockchain networks that are supported by both Lit and Safe

## How It Works

### Policy Workflow

1. **Message Creation**: Vincent Tool execution parameters are encoded into an EIP-712 typed message
2. **Signature Collection**: Safe owners sign the message using their wallets
3. **Validation**: The policy validates signatures meet the Safe's threshold requirement, the Tool is executing with the approved parameters, and the message hasn't been consumed
4. **Replay Prevention**: Once validated, the authorized Tool executes, and the message is marked as consumed in the `SafeMessageTracker` contract to prevent message reuse

### Policy Phases

The policy operates in three distinct phases:

#### 1. Precheck Phase

Ran locally by the Vincent Tool executor to validate the Policy will permit Tool execution:

- Verifies the Safe message hasn't been consumed
- Retrieves message details from Safe Transaction Service
- Validates the number of signatures is equal to or greater than the Safe's threshold
- Validates the signed EIP-712 message structure
- Validates the Tool parameters signed in the EIP-712 message match what was provided to the Vincent Tool
- Validates the Tool is being executed for the Vincent App Id, App Version, and Agent Wallet Address as defined in the EIP-712 message
- Verifies the signature validity against the Safe contract

#### 2. Evaluate Phase

Performs the same checks as the precheck phase, but in the decentralized Lit Action environment. The result of this execution is what permits or denies Tool execution.

#### 3. Commit Phase

- Records message consumption in the `SafeMessageTracker` contract to prevent replay attacks
- Returns the Lit Chronicle Yellowstone transaction hash for audit trail

## Configuration

### Tool Parameters

These are the parameters that must be provided by the Vincent Tool to support this policy:

```typescript
{
  safeConfig: {
    safeApiKey: string;        // API key for Safe Transaction Service
    safeMessageHash: string;   // Hash of the signed EIP-712 message
  }
}
```

In addition to the above parameters, the Tool must also provide the parameters it's using to execute the Tool's logic.

For example, in the [Native Send Tool](./vincent-packages/tools/native-send/src/lib/vincent-tool.ts), the following is specified when configuring the Tool to use this policy:

```typescript
const SafeMultisigPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy: safeMultisigPolicy,
  toolParameterMappings: {
    safeConfig: "safeConfig",
    to: "to",
    amount: "amount",
    rpcUrl: "rpcUrl",
  },
});
```

`to`, `amount`, and `rpcUrl` are the parameters that are used to execute the Native Token Send Tool's logic. The parameters are forwarded to the Policy, and are what's used by the Policy to validate the Tool is being executed with only the parameters approved by the signed EIP-712 message.

### User Parameters

These parameters are set on-chain in the Vincent Registry contract by the Vincent App User when permitting a Vincent App to use the Vincent Tool with this Policy.

```typescript
{
  safeAddress: string;         // Safe multisig contract address
  litChainIdentifier: string;  // Chain identifier for where the Safe multisig contract is deployed
}
```

## EIP-712 Message Structure

The Policy uses an EIP-712 typed structured data for specifying the Tool execution request. This is the message that is signed by Safe owners, and the message structure is as follows:

```typescript
{
  types: {
    VincentToolExecution: [
      { name: "appId", type: "uint256" }, // Vincent App Id the Tool is being executed for
      { name: "appVersion", type: "uint256" }, // Vincent App Version the Tool is being executed for
      { name: "toolIpfsCid", type: "string" }, // The IPFS CID of the Tool being executed
      { name: "toolParametersString", type: "string" }, // The approved Tool parameters encoded as a stringified JSON object
      { name: "agentWalletAddress", type: "string" }, // The Agent wallet address the Tool is being executed on behalf of
      { name: "expiry", type: "uint256" }, // The expiry timestamp of the message
      { name: "nonce", type: "uint256" } // A unique identifier for the message to prevent replay attacks
    ]
  }
}
```

## Testing

The policy includes [comprehensive E2E tests](./vincent-e2e/src/e2e-safe.ts) that demonstrate:

1. **Insufficient Signatures**: The Policy correctly denies execution when there are fewer signatures than the Safe's threshold
2. **Threshold Met**: The Policy allows Vincent Tool execution when the threshold number of signatures are submitted to Safe's Transaction Service
3. **Replay Prevention**: Messages cannot be reused after consumption
4. **Successful Vincent Tool execution**: Validates the Vincent Tool was successfully executed by checking the transaction hash for the executed Native Token Send Tool

### Environment Variables

Copy the [.env.example](.env.example) file to `.env` and update the values with the appropriate values for your environment. All of these ENVS are required for running the tests:

- `TEST_FUNDER_PRIVATE_KEY`: Private key used for funding the various account with Lit test tokens (get some [here](https://chronicle-yellowstone-faucet.getlit.dev/)), as well as the test Agent Wallet address with native tokens on the chain corresponding to `SAFE_CHAIN_LIT_IDENTIFIER`
- `SAFE_WALLET_ADDRESS`: Address of the Safe multisig wallet
- `SAFE_API_KEY`: API key for Safe Transaction Service (get one [here](https://docs.safe.global/core-api/transaction-service-overview))
- `SAFE_CHAIN_LIT_IDENTIFIER`: Lit chain identifier for where the Safe multisig contract is deployed (see supported chains [here](https://developer.litprotocol.com/resources/supported-chains))
- `SAFE_SIGNER_PRIVATE_KEY_1`: Private key of the first Safe signer
- `SAFE_SIGNER_PRIVATE_KEY_2`: Private key of the second Safe signer

### Building

```bash
# Build all components
npm run vincent:build
```

### Running Tests

```bash
# Run Safe multisig policy tests
npm run vincent:e2e:safe
```
