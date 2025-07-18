import { z } from "zod";
/**
 * Tool parameters schema - defines the input parameters for the native send tool
 */
export declare const toolParamsSchema: z.ZodObject<{
    to: z.ZodString;
    amount: z.ZodEffects<z.ZodString, string, string>;
    rpcUrl: z.ZodOptional<z.ZodString>;
    safeConfig: z.ZodOptional<z.ZodObject<{
        safeApiKey: z.ZodOptional<z.ZodString>;
        safeMessageHash: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        safeApiKey?: string;
        safeMessageHash?: string;
    }, {
        safeApiKey?: string;
        safeMessageHash?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    to?: string;
    amount?: string;
    rpcUrl?: string;
    safeConfig?: {
        safeApiKey?: string;
        safeMessageHash?: string;
    };
}, {
    to?: string;
    amount?: string;
    rpcUrl?: string;
    safeConfig?: {
        safeApiKey?: string;
        safeMessageHash?: string;
    };
}>;
/**
 * Precheck success result schema
 */
export declare const precheckSuccessSchema: z.ZodObject<{
    addressValid: z.ZodBoolean;
    amountValid: z.ZodBoolean;
    estimatedGas: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    addressValid?: boolean;
    amountValid?: boolean;
    estimatedGas?: number;
}, {
    addressValid?: boolean;
    amountValid?: boolean;
    estimatedGas?: number;
}>;
/**
 * Precheck failure result schema
 */
export declare const precheckFailSchema: z.ZodObject<{
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error?: string;
}, {
    error?: string;
}>;
/**
 * Execute success result schema
 */
export declare const executeSuccessSchema: z.ZodObject<{
    txHash: z.ZodString;
    safeMultisigPolicyCommitTxHash: z.ZodOptional<z.ZodString>;
    to: z.ZodString;
    amount: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    to?: string;
    amount?: string;
    txHash?: string;
    safeMultisigPolicyCommitTxHash?: string;
    timestamp?: number;
}, {
    to?: string;
    amount?: string;
    txHash?: string;
    safeMultisigPolicyCommitTxHash?: string;
    timestamp?: number;
}>;
/**
 * Execute failure result schema
 */
export declare const executeFailSchema: z.ZodOptional<z.ZodObject<{
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error?: string;
}, {
    error?: string;
}>>;
export type ToolParams = z.infer<typeof toolParamsSchema>;
export type PrecheckSuccess = z.infer<typeof precheckSuccessSchema>;
export type PrecheckFail = z.infer<typeof precheckFailSchema>;
export type ExecuteSuccess = z.infer<typeof executeSuccessSchema>;
export type ExecuteFail = z.infer<typeof executeFailSchema>;
//# sourceMappingURL=schemas.d.ts.map