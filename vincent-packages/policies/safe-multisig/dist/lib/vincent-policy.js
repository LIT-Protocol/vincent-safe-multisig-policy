import { createVincentPolicy } from "@lit-protocol/vincent-tool-sdk";
import { ethers } from "ethers";
import { commitAllowResultSchema, commitDenyResultSchema, evalAllowResultSchema, evalDenyResultSchema, precheckAllowResultSchema, precheckDenyResultSchema, toolParamsSchema, userParamsSchema, } from "./schemas";
import { checkSafeMessage, getSafeThreshold, parseAndValidateEIP712Message, } from "./helpers";
export const vincentPolicy = createVincentPolicy({
    packageName: "@lit-protocol/vincent-policy-safe-multisig",
    toolParamsSchema,
    userParamsSchema,
    precheckAllowResultSchema,
    precheckDenyResultSchema,
    evalAllowResultSchema,
    evalDenyResultSchema,
    commitAllowResultSchema,
    commitDenyResultSchema,
    precheck: async ({ toolParams, userParams }, { allow, deny, appId, appVersion, toolIpfsCid, delegation: { delegatorPkpInfo }, }) => {
        console.log("SafeMultisigPolicy precheck", { toolParams, userParams });
        try {
            const rpcUrl = process.env.SEPOLIA_RPC_URL;
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const safeTransactionServiceUrl = "https://safe-transaction-sepolia.safe.global";
            const safeMessage = await checkSafeMessage(provider, safeTransactionServiceUrl, userParams.safeAddress, toolParams.safeMessageHash, toolParams.safeApiKey);
            console.log("[SafeMultisigPolicy precheck] Retrieved Safe message:", safeMessage);
            if (safeMessage === null) {
                return deny({
                    reason: "Safe message not found or not proposed",
                    safeAddress: userParams.safeAddress,
                    messageHash: toolParams.safeMessageHash,
                });
            }
            // Parse and validate the EIP712 message using helper function
            const eip712ValidationResult = parseAndValidateEIP712Message({
                messageString: safeMessage.message,
                expectedToolIpfsCid: toolIpfsCid,
                expectedAgentAddress: delegatorPkpInfo.ethAddress,
                expectedAppId: appId,
                expectedAppVersion: appVersion,
            });
            if (!eip712ValidationResult.success) {
                return deny({
                    reason: eip712ValidationResult.error || "EIP712 validation failed",
                    safeAddress: userParams.safeAddress,
                    messageHash: toolParams.safeMessageHash,
                    expected: eip712ValidationResult.expected,
                    received: eip712ValidationResult.received,
                });
            }
            const eip712Data = eip712ValidationResult.data;
            console.log("[SafeMultisigPolicy precheck] EIP712 message validation passed");
            console.log("[SafeMultisigPolicy precheck] EIP712 message data:", eip712Data.message);
            // Get Safe threshold from contract
            const threshold = await getSafeThreshold(provider, userParams.safeAddress);
            console.log("[SafeMultisigPolicy precheck] Safe threshold:", threshold);
            if (safeMessage.confirmations.length < threshold) {
                return deny({
                    reason: "Insufficient signatures",
                    safeAddress: userParams.safeAddress,
                    currentNumberOfSignatures: safeMessage.confirmations.length,
                    requiredNumberOfSignatures: threshold,
                });
            }
            return allow({
                safeAddress: userParams.safeAddress,
                messageHash: toolParams.safeMessageHash,
            });
        }
        catch (error) {
            console.error("Precheck error:", error);
            return deny({
                reason: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    evaluate: async ({ toolParams, userParams }, { allow, deny, appId, appVersion, toolIpfsCid, delegation: { delegatorPkpInfo }, }) => {
        console.log("SafeMultisigPolicy evaluate", { toolParams, userParams });
        try {
            const rpcUrl = process.env.SEPOLIA_RPC_URL;
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const safeTransactionServiceUrl = "https://safe-transaction-sepolia.safe.global";
            const safeMessage = await checkSafeMessage(provider, safeTransactionServiceUrl, userParams.safeAddress, toolParams.safeMessageHash, toolParams.safeApiKey);
            console.log("[SafeMultisigPolicy evaluate] Retrieved Safe message:", safeMessage);
            if (safeMessage === null) {
                return deny({
                    reason: "Safe message not found or not proposed",
                    safeAddress: userParams.safeAddress,
                    messageHash: toolParams.safeMessageHash,
                });
            }
            // Parse and validate the EIP712 message using helper function
            const eip712ValidationResult = parseAndValidateEIP712Message({
                messageString: safeMessage.message,
                expectedToolIpfsCid: toolIpfsCid,
                expectedAgentAddress: delegatorPkpInfo.ethAddress,
                expectedAppId: appId,
                expectedAppVersion: appVersion,
            });
            if (!eip712ValidationResult.success) {
                return deny({
                    reason: eip712ValidationResult.error || "EIP712 validation failed",
                    safeAddress: userParams.safeAddress,
                    messageHash: toolParams.safeMessageHash,
                    expected: eip712ValidationResult.expected,
                    received: eip712ValidationResult.received,
                });
            }
            const eip712Data = eip712ValidationResult.data;
            console.log("[SafeMultisigPolicy evaluate] EIP712 message validation passed");
            console.log("[SafeMultisigPolicy evaluate] EIP712 message data:", eip712Data.message);
            // Get Safe threshold from contract
            const threshold = await getSafeThreshold(provider, userParams.safeAddress);
            console.log("[SafeMultisigPolicy evaluate] Safe threshold:", threshold);
            if (safeMessage.confirmations.length < threshold) {
                return deny({
                    reason: "Insufficient signatures",
                    safeAddress: userParams.safeAddress,
                    currentNumberOfSignatures: safeMessage.confirmations.length,
                    requiredNumberOfSignatures: threshold,
                });
            }
            return allow({
                safeAddress: userParams.safeAddress,
                messageHash: toolParams.safeMessageHash,
            });
        }
        catch (error) {
            console.error("Evaluate error:", error);
            return deny({
                reason: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    commit: async (commitParams, { allow, deny }) => {
        console.log("SafeMultisigPolicy commit");
        try {
            const { txHash } = commitParams;
            console.log(`Tool execution completed with txHash: ${txHash}`);
            console.log(`Safe message should be recorded as executed`);
            return allow({
                message: "Safe message should be recorded as executed",
                txHash,
            });
        }
        catch (error) {
            console.error("Commit error:", error);
            return deny({
                reason: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
});
