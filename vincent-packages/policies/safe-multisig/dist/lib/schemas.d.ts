import { z } from "zod";
export declare const toolParamsSchema: z.ZodObject<{
    safeConfig: z.ZodObject<{
        safeApiKey: z.ZodString;
        safeMessageHash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        safeApiKey?: string;
        safeMessageHash?: string;
    }, {
        safeApiKey?: string;
        safeMessageHash?: string;
    }>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    safeConfig: z.ZodObject<{
        safeApiKey: z.ZodString;
        safeMessageHash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        safeApiKey?: string;
        safeMessageHash?: string;
    }, {
        safeApiKey?: string;
        safeMessageHash?: string;
    }>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    safeConfig: z.ZodObject<{
        safeApiKey: z.ZodString;
        safeMessageHash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        safeApiKey?: string;
        safeMessageHash?: string;
    }, {
        safeApiKey?: string;
        safeMessageHash?: string;
    }>;
}, z.ZodTypeAny, "passthrough">>;
export declare const userParamsSchema: z.ZodObject<{
    safeAddress: z.ZodString;
    litChainIdentifier: z.ZodEnum<["arbitrum", "aurora", "avalanche", "base", "baseSepolia", "bsc", "celo", "chiado", "ethereum", "mantle", "optimism", "polygon", "scroll", "sepolia", "sonicMainnet", "zkEvm", "zksync"]>;
}, "strip", z.ZodTypeAny, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    safeAddress?: string;
}, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    safeAddress?: string;
}>;
/**
 * Commit parameters schema - data passed to commit phase
 */
export declare const commitParamsSchema: z.ZodObject<{
    safeMessageHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    safeMessageHash?: string;
}, {
    safeMessageHash?: string;
}>;
export declare const precheckAllowResultSchema: z.ZodObject<{
    safeAddress: z.ZodString;
    litChainIdentifier: z.ZodEnum<["arbitrum", "aurora", "avalanche", "base", "baseSepolia", "bsc", "celo", "chiado", "ethereum", "mantle", "optimism", "polygon", "scroll", "sepolia", "sonicMainnet", "zkEvm", "zksync"]>;
    messageHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    safeAddress?: string;
    messageHash?: string;
}, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    safeAddress?: string;
    messageHash?: string;
}>;
export declare const precheckDenyResultSchema: z.ZodObject<{
    reason: z.ZodString;
    litChainIdentifier: z.ZodOptional<z.ZodEnum<["arbitrum", "aurora", "avalanche", "base", "baseSepolia", "bsc", "celo", "chiado", "ethereum", "mantle", "optimism", "polygon", "scroll", "sepolia", "sonicMainnet", "zkEvm", "zksync"]>>;
    safeAddress: z.ZodOptional<z.ZodString>;
    messageHash: z.ZodOptional<z.ZodString>;
    expected: z.ZodOptional<z.ZodAny>;
    received: z.ZodOptional<z.ZodAny>;
    currentNumberOfSignatures: z.ZodOptional<z.ZodNumber>;
    requiredNumberOfSignatures: z.ZodOptional<z.ZodNumber>;
    confirmations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        signature: z.ZodOptional<z.ZodString>;
        created: z.ZodOptional<z.ZodString>;
        modified: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        signatureType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        signature?: string;
        created?: string;
        modified?: string;
        owner?: string;
        signatureType?: string;
    }, {
        signature?: string;
        created?: string;
        modified?: string;
        owner?: string;
        signatureType?: string;
    }>, "many">>;
    safeMessageConsumer: z.ZodOptional<z.ZodString>;
    safeMessageConsumedAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    expected?: any;
    received?: any;
    safeAddress?: string;
    messageHash?: string;
    reason?: string;
    currentNumberOfSignatures?: number;
    requiredNumberOfSignatures?: number;
    confirmations?: {
        signature?: string;
        created?: string;
        modified?: string;
        owner?: string;
        signatureType?: string;
    }[];
    safeMessageConsumer?: string;
    safeMessageConsumedAt?: number;
}, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    expected?: any;
    received?: any;
    safeAddress?: string;
    messageHash?: string;
    reason?: string;
    currentNumberOfSignatures?: number;
    requiredNumberOfSignatures?: number;
    confirmations?: {
        signature?: string;
        created?: string;
        modified?: string;
        owner?: string;
        signatureType?: string;
    }[];
    safeMessageConsumer?: string;
    safeMessageConsumedAt?: number;
}>;
export declare const evalAllowResultSchema: z.ZodObject<{
    safeAddress: z.ZodString;
    litChainIdentifier: z.ZodEnum<["arbitrum", "aurora", "avalanche", "base", "baseSepolia", "bsc", "celo", "chiado", "ethereum", "mantle", "optimism", "polygon", "scroll", "sepolia", "sonicMainnet", "zkEvm", "zksync"]>;
    messageHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    safeAddress?: string;
    messageHash?: string;
}, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    safeAddress?: string;
    messageHash?: string;
}>;
export declare const evalDenyResultSchema: z.ZodObject<{
    reason: z.ZodString;
    litChainIdentifier: z.ZodOptional<z.ZodEnum<["arbitrum", "aurora", "avalanche", "base", "baseSepolia", "bsc", "celo", "chiado", "ethereum", "mantle", "optimism", "polygon", "scroll", "sepolia", "sonicMainnet", "zkEvm", "zksync"]>>;
    safeAddress: z.ZodOptional<z.ZodString>;
    messageHash: z.ZodOptional<z.ZodString>;
    expected: z.ZodOptional<z.ZodAny>;
    received: z.ZodOptional<z.ZodAny>;
    currentNumberOfSignatures: z.ZodOptional<z.ZodNumber>;
    requiredNumberOfSignatures: z.ZodOptional<z.ZodNumber>;
    confirmations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        signature: z.ZodOptional<z.ZodString>;
        created: z.ZodOptional<z.ZodString>;
        modified: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        signatureType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        signature?: string;
        created?: string;
        modified?: string;
        owner?: string;
        signatureType?: string;
    }, {
        signature?: string;
        created?: string;
        modified?: string;
        owner?: string;
        signatureType?: string;
    }>, "many">>;
    safeMessageConsumer: z.ZodOptional<z.ZodString>;
    safeMessageConsumedAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    expected?: any;
    received?: any;
    safeAddress?: string;
    messageHash?: string;
    reason?: string;
    currentNumberOfSignatures?: number;
    requiredNumberOfSignatures?: number;
    confirmations?: {
        signature?: string;
        created?: string;
        modified?: string;
        owner?: string;
        signatureType?: string;
    }[];
    safeMessageConsumer?: string;
    safeMessageConsumedAt?: number;
}, {
    litChainIdentifier?: "arbitrum" | "aurora" | "avalanche" | "base" | "baseSepolia" | "bsc" | "celo" | "chiado" | "ethereum" | "mantle" | "optimism" | "polygon" | "scroll" | "sepolia" | "sonicMainnet" | "zkEvm" | "zksync";
    expected?: any;
    received?: any;
    safeAddress?: string;
    messageHash?: string;
    reason?: string;
    currentNumberOfSignatures?: number;
    requiredNumberOfSignatures?: number;
    confirmations?: {
        signature?: string;
        created?: string;
        modified?: string;
        owner?: string;
        signatureType?: string;
    }[];
    safeMessageConsumer?: string;
    safeMessageConsumedAt?: number;
}>;
export declare const commitAllowResultSchema: z.ZodObject<{
    txHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    txHash?: string;
}, {
    txHash?: string;
}>;
export declare const commitDenyResultSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason?: string;
}, {
    reason?: string;
}>;
export type ToolParams = z.infer<typeof toolParamsSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type CommitParams = z.infer<typeof commitParamsSchema>;
export type PrecheckAllow = z.infer<typeof precheckAllowResultSchema>;
export type PrecheckDeny = z.infer<typeof precheckDenyResultSchema>;
export type EvalAllow = z.infer<typeof evalAllowResultSchema>;
export type EvalDeny = z.infer<typeof evalDenyResultSchema>;
export type CommitAllow = z.infer<typeof commitAllowResultSchema>;
export type CommitDeny = z.infer<typeof commitDenyResultSchema>;
//# sourceMappingURL=schemas.d.ts.map