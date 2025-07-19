# Vincent App Owner Guide

This guide will cover how to execute a Vincent Tool that supports the Safe Multisig Policy. After following this guide, you will know how to execute Vincent Tools that are governed by your Vincent App User's Safe Multisig.

## Getting Started

Included in this repository is a end-to-end test ([e2e-safe.ts](../../vincent-e2e/src/e2e-safe.ts)) that tests in entire flow of creating a Vincent App, permitting a Vincent Tool that supports the Safe Multisig Policy, and executing the Tool with the Safe Multisig validation logic.

This guide will be referencing code from this end-to-end test to demonstrate the steps required to execute a Vincent Tool that supports the Safe Multisig Policy.

## Installing the Vincent Policy Safe Multisig SDK

An SDK is available to help you create the Safe message that will be used to validate the Tool execution request. The SDK is published to NPM as [@lit-protocol/vincent-policy-safe-multisig-sdk](https://www.npmjs.com/package/@lit-protocol/vincent-policy-safe-multisig-sdk) and can be installed using your preferred package manager:

```
npm i --save @lit-protocol/vincent-policy-safe-multisig-sdk
```

### Other Required Dependencies

In addition to the Multisig Policy SDK, the following dependencies are required to build, sign, and submit the Safe message to the Safe Transaction Service:

- [@safe-global/protocol-kit](https://www.npmjs.com/package/@safe-global/protocol-kit)
- [@safe-global/api-kit](https://www.npmjs.com/package/@safe-global/api-kit)

## Prerequisites

Before creating the Safe message to be signed by your Vincent App Users, you will need to have the following setup:

### Required Environment Variables

- **A Safe API key**: Your own API key which can be obtained from Safe after signing up with the [Safe Developer Dashboard](https://developer.safe.global/login)
- **Safe Ethereum Address**: The address of the Vincent App User's Safe Multisig
- **Lit Chain Identifier**: The chain identifier of the blockchain the Vincent App User's Safe Multisig is deployed on. The following are the chains currently supported by both Safe and Lit Protocol:

```typescript
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
```

- **RPC Url**: An RPC URL for the blockchain the Vincent App User's Safe Multisig is deployed on
- **Chain Id**: The chain id of the blockchain the Vincent App User's Safe Multisig is deployed on

```typescript
import { LIT_CHAINS } from "@lit-protocol/constants";
import { SupportedLitChainIdentifier } from "@lit-protocol/vincent-policy-safe-multisig-sdk";

const safeAddress = process.env.SAFE_WALLET_ADDRESS as string;
const safeApiKey = process.env.SAFE_API_KEY as string;
const safeChainLitIdentifier = process.env.SAFE_CHAIN_LIT_IDENTIFIER as SupportedLitChainIdentifier;
const safeRpcUrl = LIT_CHAINS[safeChainLitIdentifier].rpcUrls[0];
const safeChainId = LIT_CHAINS[safeChainLitIdentifier].chainId;
```

### Creating a Contract Instance to Read From the `SafeMessageTracker` Contract

Exported from the Multisig Policy SDK, are the contract address and ABI for the `SafeMessageTracker` contract:

```typescript
import { ethers } from "ethers";
import { LIT_CHAINS } from "@lit-protocol/constants";
import { safeMessageTrackerContractAddress, safeMessageTrackerContractData } from "@lit-protocol/vincent-policy-safe-multisig-sdk";

const yellowStoneProvider = new ethers.providers.JsonRpcProvider(LIT_CHAINS["yellowstone"].rpcUrls[0]);

const safeMessageTrackerContract = new ethers.Contract(
    safeMessageTrackerContractAddress,
    safeMessageTrackerContractData[0].SafeMessageTracker,
    yellowStoneProvider
);
```

The `SafeMessageTracker` contract is used to check if a Safe message hash has been marked as consumed by the Vincent Agent Wallet.

### Setting up the Safe Protocol and API Kit

The Safe Protocol and API Kit are used to build, sign, and submit the Safe message to the Safe Transaction Service. The following is how to initialize them:

```typescript
import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";

const protocolKit = await Safe.init({
    provider: safeRpcUrl,
    signer: safeSignerPrivateKey_1,
    safeAddress,
});

const apiKit = new SafeApiKit({
    chainId: BigInt(safeChainId),
    apiKey: safeApiKey,
});
```

As mentioned, these code snippets are taken from the end-to-end test ([e2e-safe.ts](../../vincent-e2e/src/e2e-safe.ts)) which uses a private key to sign the Safe message (`safeSignerPrivateKey_1`). For your Vincent App, you'd replace this with however your Vincent App Users choose to sign messages.

## Creating the Safe Message

The Safe Multisig Policy works by having Safe signers sign a Safe message that contains an EIP-712 message that contains properties that define a Vincent Tool execution. The Multisig Policy SDK exports a helper function to help you create the Safe message data that must be signed by your Vincent App Users and submitted to the Safe Transaction Service:

```typescript
import { createVincentSafeMessage, SupportedLitChainIdentifier } from "@lit-protocol/vincent-policy-safe-multisig-sdk";

const TEST_TOOL_PARAMS = {
    to: process.env.RECIPIENT_ADDRESS as string,
    amount: "0.00001",
    rpcUrl: safeRpcUrl,
};

const { vincentToolExecution, safeMessageString, safeMessageHash } = createVincentSafeMessage({
    appId: Number(appId),
    appVersion: Number(appVersion),
    toolIpfsCid: nativeSendTool.ipfsCid,
    toolParameters: TEST_TOOL_PARAMS,
    agentWalletAddress: agentWalletPkp.ethAddress,
    expiryUnixTimestamp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
    safeConfig: {
      safeAddress,
      litChainIdentifier: safeChainLitIdentifier as SupportedLitChainIdentifier,
    },
});
```

The properties given to the `createVincentSafeMessage` function are what the Safe signers are agreeing to when they sign the Safe message, and will be what's used to execute a Vincent Tool.

- `appId`: The ID of your Vincent App
- `appVersion`: The version of your Vincent App that has been permitted by the Vincent App User
- `toolIpfsCid`: The IPFS CID of the Tool you'd like to execute on behalf of the Vincent App User
- `toolParameters`: The parameters to be used to execute the Vincent Tool
  - In the case of the end-to-end test, the Tool being executed is the Native Send Tool which transfers the native token of a blockchain. The `TEST_TOOL_PARAMS` object are the parameters required by the Native Send Tool to execute it's logic
- `agentWalletAddress`: The address of the Vincent Agent Wallet that will be signing the blockchain transaction to send the native token
- `expiryUnixTimestamp`: A UNIX timestamp that configured when the Safe message will expire and is no longer valid for Tool executions, even if a sufficient number of Safe signers have signed the Safe message
- `safeConfig`: An object containing the address of the Safe Multisig and the chain identifier of the blockchain the Safe Multisig is deployed on

Returned from this function are the following:

- `vincentToolExecution`: An object representing the Tool execution request that will be signed by the Safe signers (this is basically the same object you're passing to the `createVincentSafeMessage` function)
- `safeMessageString`: The Safe message string that will be signed by the Safe signers
- `safeMessageHash`: The hash of the Safe message string used to identify the Safe message in the Safe Transaction Service

## Signing the Safe Message

After creating the Safe message, the next step is for the Safe signers to sign the Safe message. This is done using the instance of Safe's `protocolKit` we created earlier:

```typescript
const safeMessage = protocolKit.createMessage(safeMessageString);
const signedMessage = await protocolKit.signMessage(safeMessage);
const signerSignature = signedMessage.signatures.get(
    safeSigner_1.address.toLowerCase()
);
if (!signerSignature) {
    throw new Error("Failed to get signature for signer");
}
```

## Submitting the Safe Message to the Safe Transaction Service

After signing the Safe message, next is submitting the Safe message to the Safe Transaction Service. This is done using the instance of Safe's `apiKit` we created earlier:

```typescript
try {
    await apiKit.addMessage(safeAddress, {
      message: safeMessageString,
      signature: signerSignature.data,
    });

    console.log("⏳ Waiting for message to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("✅ Message successfully proposed to Safe Transaction Service");
} catch (error) {
    console.error("❌ Error proposing message:", error);
    throw error;
}
```

### Repeating the Process for Each Safe Signer

Before being able to execute the Tool, you'll need to repeat the process for each Safe signer until the configured threshold of signatures is reached for the Vincent App User's Safe Multisig.

You can query the required threshold of signatures for a Safe Multisig by calling the `getThreshold` function on the Safe contract:

```typescript
import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider(safeRpcUrl);

const safeContract = new ethers.Contract(
    safeAddress,
    ["function getThreshold() view returns (uint256)"],
    provider
);
const threshold = await safeContract.getThreshold();
```

## Executing the Tool's `precheck` Function

At any point in time, you can execute the Vincent Tool's `precheck` function to run the Multisig Policy's validation logic to test if running the Tool's `execute` function will be permitted by the Safe Multisig Policy.

```typescript
import { ethers } from "ethers";
import { LIT_CHAINS } from "@lit-protocol/constants";
import { getVincentToolClient } from "@lit-protocol/vincent-app-sdk";

// Locally sourced for the end-to-end test, but the Vincent Tool package would typically be installed from NPM
import { bundledVincentTool as nativeSendTool } from "../../vincent-packages/tools/native-send/dist/index.js";

const yellowStoneProvider = new ethers.providers.JsonRpcProvider(LIT_CHAINS["yellowstone"].rpcUrls[0]);
const delegateeWallet = new ethers.Wallet(process.env.DELEGATEE_PRIVATE_KEY as string, yellowStoneProvider);

const nativeSendToolClient = getVincentToolClient({
    bundledVincentTool: nativeSendTool,
    ethersSigner: delegateeWallet,
});

const precheckResult = await nativeSendToolClient.precheck({
    ...TEST_TOOL_PARAMS,
    safeConfig: {
        safeApiKey,
        safeMessageHash,
    },
}, {
    delegatorPkpEthAddress: agentWalletPkp.ethAddress,
});
```

The result of the `precheck` function will contain the result of the Tool's `precheck` function, including the result of the Multisig Policy's validation logic.

Part of the input parameters for the `precheck` function is the `safeConfig` object which contains your Safe API key used to communicate with the Safe Transaction Service and the hash of the Safe message generated by the `createVincentSafeMessage` function.

## Executing the Tool's `execute` Function

After the `precheck` function has been executed successfully, you can execute the Tool's `execute` function to execute the Tool's logic.

```typescript
const executeResult = await nativeSendToolClient.execute({
    ...TEST_TOOL_PARAMS,
    safeConfig: {
        safeApiKey,
        safeMessageHash,
    },
}, {
    delegatorPkpEthAddress: agentWalletPkp.ethAddress,
});
```

The result of the `execute` function will contain the result of the Tool's `execute` function, including the result of the Multisig Policy's validation logic and the transaction hash of the transaction sent to Lit's Chronicle Yellowstone blockchain to mark the Safe message as consumed in the `SafeMessageTracker` contract.

### Validating the Safe Message Was Consumed

After executing the Tool's `execute` function, you can validate that the Safe message was consumed by the Vincent Agent Wallet by reading from the `SafeMessageTracker` contract:

```typescript
const consumedAtTimestamp = await safeMessageTrackerContract.getConsumedAt(agentWalletPkp.ethAddress, safeMessageHash);
```

If the returned `consumedAtTimestamp` is not `0`, then the Safe message was marked as consumed by the Vincent Agent Wallet.

## Wrapping Up

At this point, you've successfully created a Safe message to be signed by your Vincent App Users and executed a Vincent Tool that utilized the Safe Multisig Policy to govern the execution of the Tool.
