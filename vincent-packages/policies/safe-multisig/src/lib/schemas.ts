import { z } from "zod";

export const toolParamsSchema = z.object({
  safeConfig: z.object({
    safeApiKey: z
      .string()
      .describe("The Safe API key for Transaction Service access"),
    safeMessageHash: z.string().describe("The hash of the EIP-712 Safe message that's signed by the Safe multisig signers to permit Vincent Tool execution"),
  }),
}).passthrough();

export const userParamsSchema = z.object({
  safeAddress: z.string().describe("The Safe multisig contract address"),
  litChainIdentifier: z.string().describe("The chain identifier of the LIT chain where the Safe multisig contract is deployed"),
});

/**
 * Commit parameters schema - data passed to commit phase
 */
export const commitParamsSchema = z.object({
  safeMessageHash: z.string().describe("The hash of the EIP-712 Safe message that's signed by the Safe multisig signers to permit Vincent Tool execution"),
});

export const precheckAllowResultSchema = z.object({
  safeAddress: z.string(),
  litChainIdentifier: z.string(),
  messageHash: z.string(),
});

export const precheckDenyResultSchema = z.object({
  reason: z.string(),
  litChainIdentifier: z.string().optional(),
  safeAddress: z.string().optional(),
  messageHash: z.string().optional(),
  expected: z.any().optional(),
  received: z.any().optional(),
  currentNumberOfSignatures: z.number().optional(),
  requiredNumberOfSignatures: z.number().optional(),
  confirmations: z.array(z.object({
    signature: z.string().optional(),
    created: z.string().optional(),
    modified: z.string().optional(),
    owner: z.string().optional(),
    signatureType: z.string().optional(),
  })).optional(),
  safeMessageConsumer: z.string().optional(),
  safeMessageConsumedAt: z.number().optional(),
});

export const evalAllowResultSchema = z.object({
  safeAddress: z.string(),
  litChainIdentifier: z.string(),
  messageHash: z.string(),
});

export const evalDenyResultSchema = z.object({
  reason: z.string(),
  litChainIdentifier: z.string().optional(),
  safeAddress: z.string().optional(),
  messageHash: z.string().optional(),
  expected: z.any().optional(),
  received: z.any().optional(),
  currentNumberOfSignatures: z.number().optional(),
  requiredNumberOfSignatures: z.number().optional(),
  confirmations: z.array(z.object({
    signature: z.string().optional(),
    created: z.string().optional(),
    modified: z.string().optional(),
    owner: z.string().optional(),
    signatureType: z.string().optional(),
  })).optional(),
  safeMessageConsumer: z.string().optional(),
  safeMessageConsumedAt: z.number().optional(),
});

export const commitAllowResultSchema = z.object({
  txHash: z.string().describe("The transaction hash of the consume transaction"),
});

export const commitDenyResultSchema = z.object({
  reason: z.string(),
});

export const EIP712_DOMAIN = {
  name: "Vincent Safe Policy",
  version: "1",
  chainId: 11155111, // Sepolia
  verifyingContract: "0x0000000000000000000000000000000000000000", // Placeholder
} as const;

export const EIP712_MESSAGE_TYPES = {
  VincentToolExecution: [
    { name: "appId", type: "uint256" },
    { name: "appVersion", type: "uint256" },
    { name: "toolIpfsCid", type: "string" },
    { name: "toolParametersString", type: "string" },
    { name: "agentWalletAddress", type: "string" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export const safeMessageResponseSchema = z.object({
  created: z.string(),
  modified: z.string(),
  safe: z.string(),
  messageHash: z.string(),
  message: z.union([z.string(), z.record(z.any())]),
  proposedBy: z.string(),
  safeAppId: z.number().nullable(),
  confirmations: z.array(
    z.object({
      created: z.string().optional(),
      modified: z.string().optional(),
      owner: z.string().optional(),
      signature: z.string(),
      signatureType: z.string().optional(),
    })
  ),
  preparedSignature: z.string().optional(),
});

// Type exports
export type ToolParams = z.infer<typeof toolParamsSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type CommitParams = z.infer<typeof commitParamsSchema>;
export type PrecheckAllow = z.infer<typeof precheckAllowResultSchema>;
export type PrecheckDeny = z.infer<typeof precheckDenyResultSchema>;
export type EvalAllow = z.infer<typeof evalAllowResultSchema>;
export type EvalDeny = z.infer<typeof evalDenyResultSchema>;
export type CommitAllow = z.infer<typeof commitAllowResultSchema>;
export type CommitDeny = z.infer<typeof commitDenyResultSchema>;
export type SafeMessageResponse = z.infer<typeof safeMessageResponseSchema>;