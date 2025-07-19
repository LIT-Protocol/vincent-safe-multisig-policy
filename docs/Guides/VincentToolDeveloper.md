# Vincent Tool Developer Guide

This guide will cover how to configure a Vincent Tool to support the Safe Multisig Policy. After following this guide, Vincent App Owners whom enable your Tool for the App will be able to enable the Safe Multisig Policy to allow their Vincent App Users to govern the execution of your Tool with their Safe Multisig.

## Getting Started

Included in this repository is the tool [@lit-protocol/vincent-tool-native-send](../../vincent-packages/tools/native-send/) which is a reference Tool for sending a blockchain's native token.

This Tool is configured to support the Safe Multisig Policy as a reference implementation, and for use in the Policy's [end-to-end tests](../../vincent-e2e/src/e2e-safe.ts). This guide will be referencing this Tool as an example, but the steps are applicable to any Vincent Tool.

## Installing the Policy

The Multisig Policy is published to NPM as [@lit-protocol/vincent-policy-safe-multisig](https://www.npmjs.com/package/@lit-protocol/vincent-policy-safe-multisig) and can be installed using your preferred package manager:

```
npm i --save @lit-protocol/vincent-policy-safe-multisig
```

## Updating Your Tool's Schema

The following sections will cover how to update your Tool's schema to support the Safe Multisig Policy. The code snippets are taken from the Native Send Tool's [schema.ts](../../vincent-packages/tools/native-send/src/lib/schemas.ts) file.

### Updating the `toolParamsSchema`

The `toolParamsSchema` is the schema that defines the parameters that are passed to your Tool. The Policy requires the following parameters to be provided to the Tool:

- `safeConfig`: An object containing the Safe API key using the query the Safe Transaction Service for the Safe message, and the Safe message hash

```typescript
import { z } from "zod";

/**
 * Tool parameters schema - defines the input parameters for the native send tool
 */
export const toolParamsSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  amount: z
    .string()
    .regex(/^\d*\.?\d+$/, "Invalid amount format")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  rpcUrl: z.string().url("Invalid RPC URL format").optional(),
  safeConfig: z.object({
    safeApiKey: z.string().optional(),
    safeMessageHash: z.string().optional(),
  }).optional(),
});
```

The additional parameters:

- `to`: The address of the recipient of the native token
- `amount`: The amount of native token to send
- `rpcUrl`: The RPC URL of the blockchain to send the native token to

are the parameters that are used in the Native Send Tool's logic. These parameters are also forwarded to the Policy, and are what's used by the Policy to validate the Tool is being executed with only the parameters approved by the signed EIP-712 Safe message.

### Updating the `executeSuccessSchema`

The `executeSuccessSchema` is the schema that defines the object that is returned from the Tool's `execute` function. The Policy requires the following parameters to be returned from the Tool:

- `safeMultisigPolicyCommitTxHash`: The hash of the transaction sent to Lit's Chronicle Yellowstone blockchain to mark the Safe message as consumed in the `SafeMessageTracker` contract

```typescript
import { z } from "zod";

/**
 * Execute success result schema
 */
export const executeSuccessSchema = z.object({
  txHash: z.string(),
  safeMultisigPolicyCommitTxHash: z.string().optional(),
  to: z.string(),
  amount: z.string(),
  timestamp: z.number(),
});
```

The additional properties:

- `txHash`: The hash of the transaction sent to the blockchain to execute the Tool's logic
- `to`: The address of the recipient of the native token
- `amount`: The amount of native token to send
- `timestamp`: The timestamp of the transaction

are the properties that are returned by the Native Send Tool's `execute` function.

## Creating the `VincentToolPolicy`

The `VincentToolPolicy` is the object that defines how to connect your Tool to the Policy. The following code snippets are taken from the Native Send Tool's [vincent-tool.ts](../../vincent-packages/tools/native-send/src/lib/vincent-tool.ts) file.

As with any Vincent Policy, the first step is to import the Policy's `bundledVincentPolicy` and create a `VincentToolPolicy` object:

```typescript
import { createVincentToolPolicy } from "@lit-protocol/vincent-tool-sdk";
import { bundledVincentPolicy as safeMultisigPolicy } from "@lit-protocol/vincent-policy-safe-multisig";

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

### Defining the `toolParameterMappings`

The `toolParameterMappings` is the object that maps your Tool's parameters (as defined by your `toolParamsSchema`) to the Policy's parameters.

- `safeConfig`: Should be mapped to the `safeConfig` parameter in the Policy's schema

The additional parameters specified in the `toolParameterMappings` are the parameters that are used to execute your Tool's logic. These parameters are forwarded to the Policy, and are what's used by the Policy to validate the Tool is being executed with only the parameters approved by the signed EIP-712 Safe message.

So, whatever parameters your Tool needs to execute it's logic **MUST** be specified in the `toolParameterMappings` object so that they are passed to the Policy. This is a key requirement of the security model and functionality of the Policy.

The following parameters are what's used by the Native Send Tool to execute it's logic:

- `to`: The address of the recipient of the native token
- `amount`: The amount of native token to send
- `rpcUrl`: The RPC URL of the blockchain to send the native token to

## Adding the `VincentToolPolicy` as a Supported Policy

Like any other Vincent Policy, the `VincentToolPolicy` must be added to the Tool's `supportedPolicies` array:

```typescript
export const vincentTool = createVincentTool({
  packageName: "@lit-protocol-test-multisig/vincent-tool-native-send" as const,
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([SafeMultisigPolicy]),

  // ...
```

## Calling the Multisig Policy's `commit` Function

The `VincentToolPolicy` has a `commit` function that is used to mark the Safe message as consumed in the `SafeMessageTracker` contract. This is used to prevent replay attacks and **MUST** be called by the Tool's `execute` function, as it's a core requirement of the Policy's security model.

The following code snippet is taken from the Native Send Tool's [execute.ts](../../vincent-packages/tools/native-send/src/lib/vincent-tool.ts) file.

```typescript
let safeMultisigPolicyCommitTxHash: string | undefined;
try {
  const safeMultisigPolicyContext =
    policiesContext.allowedPolicies[
    "@lit-protocol/vincent-policy-safe-multisig"
    ];

  if (
    safeMultisigPolicyContext &&
    safeMultisigPolicyContext.commit &&
    safeMultisigPolicyContext.result
  ) {
    console.log(
      "[@lit-protocol/vincent-tool-native-send/execute] ✅ Found safe multisig policy context, calling commit..."
    );
    console.log(
      "[@lit-protocol/vincent-tool-native-send/execute] ✅ Policy evaluation result:",
      safeMultisigPolicyContext.result
    );

    const commitResult = await safeMultisigPolicyContext.commit(
      // @ts-ignore - TypeScript signature is wrong, framework actually expects parameters
      {
        safeMessageHash: toolParams.safeConfig!.safeMessageHash!,
      }
    );
    console.log(
      "[@lit-protocol/vincent-tool-native-send/execute] ✅ Policy commit result:",
      commitResult
    );

    // @ts-ignore
    if (commitResult.allow && commitResult.result && 'txHash' in commitResult.result) {
      // @ts-ignore
      safeMultisigPolicyCommitTxHash = commitResult.result.txHash;
    } else {
      console.log(
        "[@lit-protocol/vincent-tool-native-send/execute] ❌ Safe multisig policy consume transaction failed",
      );
    }
  } else {
    console.log(
      "[@lit-protocol/vincent-tool-native-send/execute] ❌ Safe multisig policy context not found in policiesContext.allowedPolicies"
    );
    console.log(
      "[@lit-protocol/vincent-tool-native-send/execute] ❌ Available policies:",
      Object.keys(policiesContext.allowedPolicies || {})
    );
  }
} catch (commitError) {
  console.error(
    "[@lit-protocol/vincent-tool-native-send/execute] ❌ Error calling policy commit:",
    commitError
  );
}
```

When the Policy's `commit` function is successfully executed, it will return the transaction hash of the transaction sent to Lit's Chronicle Yellowstone blockchain to mark the Safe message as consumed in the `SafeMessageTracker` contract.

In the above code snippet, we assigned this transaction hash to the variable `safeMultisigPolicyCommitTxHash` and return it in the object passed to the Tool's `succeed` function, along with the other properties that are returned by the Tool's `execute` function:

```typescript
return succeed({
    txHash,
    safeMultisigPolicyCommitTxHash,
    to,
    amount,
    timestamp: Date.now(),
});
```

## Wrapping Up

At this point, your Tool is configured to support the Safe Multisig Policy, and Vincent App Owners can enable the Policy for their App Users to govern the execution of your Tool with their Safe Multisig.
