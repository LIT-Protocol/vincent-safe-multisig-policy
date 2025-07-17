import { z } from "zod";
// Supported Lit chain identifiers that work with Safe Transaction Service
const supportedLitChainIdentifiers = [
    'arbitrum',
    'aurora',
    'avalanche',
    'base',
    'baseSepolia',
    'bsc',
    'celo',
    'chiado',
    'ethereum',
    'mantle',
    'optimism',
    'polygon',
    'scroll',
    'sepolia',
    'sonicMainnet',
    'zkEvm',
    'zksync'
];
// Zod schema for supported chain identifiers
const litChainIdentifierSchema = z.enum(supportedLitChainIdentifiers)
    .describe("The chain identifier of the LIT chain where the Safe multisig contract is deployed (must be supported by Safe Transaction Service)");
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
    litChainIdentifier: litChainIdentifierSchema,
});
/**
 * Commit parameters schema - data passed to commit phase
 */
export const commitParamsSchema = z.object({
    safeMessageHash: z.string().describe("The hash of the EIP-712 Safe message that's signed by the Safe multisig signers to permit Vincent Tool execution"),
});
export const precheckAllowResultSchema = z.object({
    safeAddress: z.string(),
    litChainIdentifier: litChainIdentifierSchema,
    messageHash: z.string(),
});
export const precheckDenyResultSchema = z.object({
    reason: z.string(),
    litChainIdentifier: litChainIdentifierSchema.optional(),
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
    litChainIdentifier: litChainIdentifierSchema,
    messageHash: z.string(),
});
export const evalDenyResultSchema = z.object({
    reason: z.string(),
    litChainIdentifier: litChainIdentifierSchema.optional(),
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
