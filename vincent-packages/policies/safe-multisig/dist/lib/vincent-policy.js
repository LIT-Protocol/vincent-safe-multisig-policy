import { createVincentPolicy } from "@lit-protocol/vincent-tool-sdk";
import { ethers } from "ethers";
import { commitAllowResultSchema, commitDenyResultSchema, evalAllowResultSchema, evalDenyResultSchema, precheckAllowResultSchema, precheckDenyResultSchema, toolParamsSchema, userParamsSchema, } from "./schemas";
import { getSafeMessage, createParametersHash, getSafeThreshold, parseAndValidateEIP712Message, getRpcUrlFromLitChainIdentifier, getSafeTransactionServiceUrl, isValidSafeSignature, buildEIP712Signature, } from "./helpers";
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
        console.log("[SafeMultisigPolicy precheck]", { toolParams, userParams });
        try {
            const rpcUrl = getRpcUrlFromLitChainIdentifier(userParams.litChainIdentifier);
            const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
            const safeMessage = await getSafeMessage({
                safeTransactionServiceUrl: getSafeTransactionServiceUrl(userParams.litChainIdentifier),
                safeAddress: userParams.safeAddress,
                safeApiKey: toolParams.safeApiKey,
                messageHash: toolParams.safeMessageHash,
            });
            console.log(`[SafeMultisigPolicy precheck] Retrieved Safe message: ${safeMessage}`);
            if (safeMessage === null) {
                return deny({
                    reason: "Safe message not found or not proposed",
                    safeAddress: userParams.safeAddress,
                    messageHash: toolParams.safeMessageHash,
                });
            }
            const threshold = await getSafeThreshold(provider, userParams.safeAddress);
            console.log(`[SafeMultisigPolicy precheck] Safe threshold: ${threshold}`);
            if (safeMessage.confirmations.length < threshold) {
                return deny({
                    reason: "Insufficient signatures",
                    safeAddress: userParams.safeAddress,
                    currentNumberOfSignatures: safeMessage.confirmations.length,
                    requiredNumberOfSignatures: threshold,
                });
            }
            const eip712ValidationResult = parseAndValidateEIP712Message({
                messageString: safeMessage.message,
                expectedToolIpfsCid: toolIpfsCid,
                expectedAgentAddress: delegatorPkpInfo.ethAddress,
                expectedAppId: appId,
                expectedAppVersion: appVersion,
                expectedToolParametersHash: createParametersHash({
                    toolIpfsCid,
                    toolParams: toolParams.executingToolParams,
                    agentWalletAddress: delegatorPkpInfo.ethAddress,
                }),
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
            console.log(`[SafeMultisigPolicy precheck] safeMessage.message: ${safeMessage.message}`);
            const hashedSafeMessage = ethers.utils.hashMessage(ethers.utils.toUtf8Bytes(safeMessage.message));
            console.log(`[SafeMultisigPolicy precheck] hashedSafeMessage: ${hashedSafeMessage}`);
            const eip712Signature = buildEIP712Signature(safeMessage.confirmations);
            console.log(`[SafeMultisigPolicy precheck] eip712Signature: ${eip712Signature}`);
            const isValid = await isValidSafeSignature({
                provider,
                safeAddress: userParams.safeAddress,
                dataHash: hashedSafeMessage,
                signature: eip712Signature,
            });
            console.log(`[SafeMultisigPolicy precheck] isValidSafeSignature: ${isValid}`);
            if (!isValid) {
                return deny({
                    reason: "Invalid signature",
                    confirmations: safeMessage.confirmations,
                });
            }
            return allow({
                safeAddress: userParams.safeAddress,
                litChainIdentifier: userParams.litChainIdentifier,
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
        console.log("[SafeMultisigPolicy evaluate]", { toolParams, userParams });
        try {
            const rpcUrl = getRpcUrlFromLitChainIdentifier(userParams.litChainIdentifier);
            const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
            const safeMessage = await getSafeMessage({
                safeTransactionServiceUrl: getSafeTransactionServiceUrl(userParams.litChainIdentifier),
                safeAddress: userParams.safeAddress,
                safeApiKey: toolParams.safeApiKey,
                messageHash: toolParams.safeMessageHash,
            });
            console.log("[SafeMultisigPolicy evaluate] Retrieved Safe message:", safeMessage);
            if (safeMessage === null) {
                return deny({
                    reason: "Safe message not found or not proposed",
                    safeAddress: userParams.safeAddress,
                    messageHash: toolParams.safeMessageHash,
                });
            }
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
            const eip712ValidationResult = parseAndValidateEIP712Message({
                messageString: safeMessage.message,
                expectedToolIpfsCid: toolIpfsCid,
                expectedAgentAddress: delegatorPkpInfo.ethAddress,
                expectedAppId: appId,
                expectedAppVersion: appVersion,
                expectedToolParametersHash: createParametersHash({
                    toolIpfsCid,
                    toolParams: toolParams.executingToolParams,
                    agentWalletAddress: delegatorPkpInfo.ethAddress,
                }),
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
            console.log(`[SafeMultisigPolicy precheck] safeMessage.message: ${safeMessage.message}`);
            const hashedSafeMessage = ethers.utils.hashMessage(ethers.utils.toUtf8Bytes(safeMessage.message));
            console.log(`[SafeMultisigPolicy precheck] hashedSafeMessage: ${hashedSafeMessage}`);
            const eip712Signature = buildEIP712Signature(safeMessage.confirmations);
            console.log(`[SafeMultisigPolicy precheck] eip712Signature: ${eip712Signature}`);
            const isValid = await isValidSafeSignature({
                provider,
                safeAddress: userParams.safeAddress,
                dataHash: hashedSafeMessage,
                signature: eip712Signature,
            });
            console.log(`[SafeMultisigPolicy precheck] isValidSafeSignature: ${isValid}`);
            if (!isValid) {
                return deny({
                    reason: "Invalid signature",
                    confirmations: safeMessage.confirmations,
                });
            }
            return allow({
                safeAddress: userParams.safeAddress,
                litChainIdentifier: userParams.litChainIdentifier,
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
            // const { txHash } = commitParams as any;
            // console.log(`Tool execution completed with txHash: ${txHash}`);
            console.log(`Safe message should be recorded as executed`);
            return allow({
                message: "Safe message should be recorded as executed",
                // txHash,
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
