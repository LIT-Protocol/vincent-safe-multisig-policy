import { createVincentTool, createVincentToolPolicy, supportedPoliciesForTool, } from "@lit-protocol/vincent-tool-sdk";
import "@lit-protocol/vincent-tool-sdk/internal";
import { bundledVincentPolicy as safeMultisigPolicy } from "../../../../policies/safe-multisig/dist/index.js";
import { executeFailSchema, executeSuccessSchema, precheckFailSchema, precheckSuccessSchema, toolParamsSchema, } from "./schemas";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";
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
export const vincentTool = createVincentTool({
    packageName: "@lit-protocol/vincent-tool-native-send",
    toolParamsSchema,
    supportedPolicies: supportedPoliciesForTool([
        SafeMultisigPolicy,
    ]),
    precheckSuccessSchema,
    precheckFailSchema,
    executeSuccessSchema,
    executeFailSchema,
    precheck: async ({ toolParams }, { succeed, fail }) => {
        console.log("[@lit-protocol/vincent-tool-native-send/precheck]");
        console.log("[@lit-protocol/vincent-tool-native-send/precheck] params:", {
            toolParams,
        });
        const { to, amount, rpcUrl } = toolParams;
        // Basic validation without using ethers directly
        if (!to || !to.startsWith("0x") || to.length !== 42) {
            return fail({
                error: "[@lit-protocol/vincent-tool-native-send/precheck] Invalid recipient address format",
            });
        }
        // Validate the amount
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return fail({
                error: "[@lit-protocol/vincent-tool-native-send/precheck] Invalid amount format or amount must be greater than 0",
            });
        }
        // Validate RPC URL if provided
        if (rpcUrl && typeof rpcUrl === "string") {
            try {
                new URL(rpcUrl);
            }
            catch {
                return fail({
                    error: "[@lit-protocol/vincent-tool-native-send/precheck] Invalid RPC URL format",
                });
            }
        }
        // Additional validation: check if amount is too large
        const amountFloat = parseFloat(amount);
        if (amountFloat > 1.0) {
            return fail({
                error: "[@lit-protocol/vincent-tool-native-send/precheck] Amount too large (maximum 1.0 ETH per transaction)",
            });
        }
        // Precheck succeeded
        const successResult = {
            addressValid: true,
            amountValid: true,
        };
        console.log("[@lit-protocol/vincent-tool-native-send/precheck] Success result:", successResult);
        const successResponse = succeed(successResult);
        console.log("[NativeSendTool/precheck] Success response:", JSON.stringify(successResponse, null, 2));
        return successResponse;
    },
    execute: async ({ toolParams }, { succeed, fail, delegation, policiesContext }) => {
        try {
            const { to, amount, rpcUrl } = toolParams;
            console.log("[@lit-protocol/vincent-tool-native-send/execute] Executing Native Send Tool", {
                to,
                amount,
                rpcUrl,
            });
            // Get provider - use provided RPC URL or default to Yellowstone
            const finalRpcUrl = rpcUrl || "https://yellowstone-rpc.litprotocol.com/";
            const provider = new ethers.providers.JsonRpcProvider(finalRpcUrl);
            console.log("[@lit-protocol/vincent-tool-native-send/execute] Using RPC URL:", finalRpcUrl);
            // Get PKP public key from delegation context
            const pkpPublicKey = delegation.delegatorPkpInfo.publicKey;
            if (!pkpPublicKey) {
                return fail({
                    error: "PKP public key not available from delegation context",
                });
            }
            // Execute the native send
            const txHash = await laUtils.transaction.handler.nativeSend({
                provider,
                pkpPublicKey,
                amount,
                to,
            });
            console.log("[@lit-protocol/vincent-tool-native-send/execute] Native send successful", {
                txHash,
                to,
                amount,
            });
            // Manually call policy commit function using the correct pattern
            console.log("[@lit-protocol/vincent-tool-native-send/execute] Manually calling policy commit function...");
            let safeMultisigPolicyCommitTxHash;
            try {
                const safeMultisigPolicyContext = policiesContext.allowedPolicies["@lit-protocol/vincent-policy-safe-multisig"];
                if (safeMultisigPolicyContext &&
                    safeMultisigPolicyContext.commit &&
                    safeMultisigPolicyContext.result) {
                    console.log("[@lit-protocol/vincent-tool-native-send/execute] ✅ Found safe multisig policy context, calling commit...");
                    console.log("[@lit-protocol/vincent-tool-native-send/execute] ✅ Policy evaluation result:", safeMultisigPolicyContext.result);
                    const commitResult = await safeMultisigPolicyContext.commit(
                    // @ts-ignore - TypeScript signature is wrong, framework actually expects parameters
                    {
                        safeMessageHash: toolParams.safeConfig.safeMessageHash,
                    });
                    console.log("[@lit-protocol/vincent-tool-native-send/execute] ✅ Policy commit result:", commitResult);
                    // @ts-ignore
                    if (commitResult.allow && commitResult.result && 'txHash' in commitResult.result) {
                        // @ts-ignore
                        safeMultisigPolicyCommitTxHash = commitResult.result.txHash;
                    }
                    else {
                        console.log("[@lit-protocol/vincent-tool-native-send/execute] ❌ Safe multisig policy consume transaction failed");
                    }
                }
                else {
                    console.log("[@lit-protocol/vincent-tool-native-send/execute] ❌ Safe multisig policy context not found in policiesContext.allowedPolicies");
                    console.log("[@lit-protocol/vincent-tool-native-send/execute] ❌ Available policies:", Object.keys(policiesContext.allowedPolicies || {}));
                }
            }
            catch (commitError) {
                console.error("[@lit-protocol/vincent-tool-native-send/execute] ❌ Error calling policy commit:", commitError);
            }
            return succeed({
                txHash,
                safeMultisigPolicyCommitTxHash,
                to,
                amount,
                timestamp: Date.now(),
            });
        }
        catch (error) {
            console.error("[@lit-protocol/vincent-tool-native-send/execute] Native send failed", error);
            return fail({
                error: error instanceof Error ? error.message : "Unknown error occurred",
            });
        }
    },
});
