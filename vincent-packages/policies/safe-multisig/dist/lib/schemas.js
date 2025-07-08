import { z } from "zod";
export const toolParamsSchema = z.object({
    to: z.string().describe("The address to send to"),
    amount: z.string().describe("The amount to send"),
});
export const userParamsSchema = z.object({
    safeAddress: z.string().describe("The Safe multisig contract address"),
});
export const EIP712_DOMAIN = {
    name: "Vincent Safe Policy",
    version: "1",
    chainId: 11155111, // Sepolia
    verifyingContract: "0x0000000000000000000000000000000000000000", // Placeholder
};
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
};
export const vincentToolExecutionSchema = z.object({
    appId: z.bigint(),
    appVersion: z.bigint(),
    toolIpfsCid: z.string(),
    cbor2EncodedParametersHash: z.string(),
    agentWalletAddress: z.string(),
    expiry: z.bigint(),
    nonce: z.bigint(),
});
export const precheckResultSchema = z.discriminatedUnion("allowed", [
    z.object({
        allowed: z.literal(true),
        context: z.object({
            safeAddress: z.string(),
            threshold: z.number(),
            messageHash: z.string(),
            generatedExpiry: z.bigint(),
            generatedNonce: z.bigint(),
        }),
    }),
    z.object({
        allowed: z.literal(false),
        context: z.object({
            reason: z.string(),
            safeAddress: z.string().optional(),
            currentSignatures: z.number().optional(),
            requiredSignatures: z.number().optional(),
            generatedExpiry: z.bigint().optional(),
            generatedNonce: z.bigint().optional(),
            messageHash: z.string().optional(),
        }),
    }),
]);
export const evaluateResultSchema = z.discriminatedUnion("allowed", [
    z.object({
        allowed: z.literal(true),
        context: z.object({
            safeAddress: z.string(),
            threshold: z.number(),
            messageHash: z.string(),
            isValidSignature: z.boolean(),
        }),
    }),
    z.object({
        allowed: z.literal(false),
        context: z.object({
            reason: z.string(),
            safeAddress: z.string().optional(),
            currentSignatures: z.number().optional(),
            requiredSignatures: z.number().optional(),
        }),
    }),
]);
export const commitResultSchema = z.discriminatedUnion("allowed", [
    z.object({
        allowed: z.literal(true),
        context: z.object({
            message: z.string(),
            txHash: z.string().optional(),
        }),
    }),
    z.object({
        allowed: z.literal(false),
        context: z.object({
            reason: z.string(),
        }),
    }),
]);
export const safeMessageResponseSchema = z.object({
    created: z.string(),
    modified: z.string(),
    safe: z.string(),
    messageHash: z.string(),
    message: z.union([z.string(), z.record(z.any())]),
    proposedBy: z.string(),
    safeAppId: z.number().nullable(),
    confirmations: z.array(z.object({
        created: z.string().optional(),
        modified: z.string().optional(),
        owner: z.string().optional(),
        signature: z.string(),
        signatureType: z.string().optional(),
    })),
    preparedSignature: z.string().optional(),
});
