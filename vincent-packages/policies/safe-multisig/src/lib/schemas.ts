import { z } from "zod";

export const toolParamsSchema = z.object({
  safeApiKey: z
    .string()
    .describe("The Safe API key for Transaction Service access"),
});

export type ToolParams = z.infer<typeof toolParamsSchema>;

export const userParamsSchema = z.object({
  safeAddress: z.string().describe("The Safe multisig contract address"),
});

export type UserParams = z.infer<typeof userParamsSchema>;

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
    { name: "cbor2EncodedParametersHash", type: "string" },
    { name: "agentWalletAddress", type: "string" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export const vincentToolExecutionSchema = z.object({
  appId: z.bigint(),
  appVersion: z.bigint(),
  toolIpfsCid: z.string(),
  cbor2EncodedParametersHash: z.string(),
  agentWalletAddress: z.string(),
  expiry: z.bigint(),
  nonce: z.bigint(),
});

export type VincentToolExecution = z.infer<typeof vincentToolExecutionSchema>;

export const precheckAllowResultSchema = z.object({
  safeAddress: z.string(),
  threshold: z.number(),
  messageHash: z.string(),
  generatedExpiry: z.bigint(),
  generatedNonce: z.bigint(),
});

export const precheckDenyResultSchema = z.object({
  reason: z.string(),
  safeAddress: z.string().optional(),
  currentSignatures: z.number().optional(),
  requiredSignatures: z.number().optional(),
  generatedExpiry: z.bigint().optional(),
  generatedNonce: z.bigint().optional(),
  messageHash: z.string().optional(),
});

export const evalAllowResultSchema = z.object({
  safeAddress: z.string(),
  threshold: z.number(),
  messageHash: z.string(),
  isValidSignature: z.boolean(),
});

export const evalDenyResultSchema = z.object({
  reason: z.string(),
  safeAddress: z.string().optional(),
  currentSignatures: z.number().optional(),
  requiredSignatures: z.number().optional(),
});

export const commitAllowResultSchema = z.object({
  message: z.string(),
  txHash: z.string().optional(),
});

export const commitDenyResultSchema = z.object({
  reason: z.string(),
});

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

export type SafeMessageResponse = z.infer<typeof safeMessageResponseSchema>;
