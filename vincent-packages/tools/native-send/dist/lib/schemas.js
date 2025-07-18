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
/**
 * Precheck success result schema
 */
export const precheckSuccessSchema = z.object({
    addressValid: z.boolean(),
    amountValid: z.boolean(),
    estimatedGas: z.number().optional(),
});
/**
 * Precheck failure result schema
 */
export const precheckFailSchema = z.object({
    error: z.string(),
});
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
/**
 * Execute failure result schema
 */
export const executeFailSchema = z.object({
    error: z.string(),
}).optional();
