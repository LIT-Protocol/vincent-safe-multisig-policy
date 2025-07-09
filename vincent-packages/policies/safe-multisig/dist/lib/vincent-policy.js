import { createVincentPolicy } from "@lit-protocol/vincent-tool-sdk";
import { ethers } from "ethers";
import { commitAllowResultSchema, commitDenyResultSchema, evalAllowResultSchema, evalDenyResultSchema, precheckAllowResultSchema, precheckDenyResultSchema, toolParamsSchema, userParamsSchema, } from "./schemas";
import { checkSafeMessage, createEIP712Message, createParametersHash, generateSafeMessageHash, isValidSafeSignature, getSafeThreshold, buildEIP712Signature, } from "./helpers";
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
            // Get Safe threshold from contract
            const threshold = await getSafeThreshold(provider, userParams.safeAddress);
            // Use expiry and nonce from toolParams
            const expiry = BigInt(toolParams.safeExpiry);
            const nonce = BigInt(toolParams.safeNonce);
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            if (expiry <= currentTime) {
                return deny({
                    reason: "Provided expiry has already passed",
                    safeAddress: userParams.safeAddress,
                });
            }
            const parametersHash = createParametersHash(toolIpfsCid, {}, delegatorPkpInfo.ethAddress);
            const vincentExecution = {
                appId,
                appVersion,
                toolIpfsCid,
                cbor2EncodedParametersHash: parametersHash,
                agentWalletAddress: delegatorPkpInfo.ethAddress,
                expiry: toolParams.safeExpiry,
                nonce: toolParams.safeNonce,
            };
            console.log(`vincentExecution in precheck: ${JSON.stringify(vincentExecution)}`);
            const eip712Message = createEIP712Message(vincentExecution);
            const messageString = JSON.stringify(eip712Message);
            const messageHash = generateSafeMessageHash(messageString, userParams.safeAddress, "11155111");
            const safeMessage = await checkSafeMessage(provider, userParams.safeAddress, messageHash, toolParams.safeApiKey);
            if (!safeMessage) {
                return deny({
                    reason: "Safe message not found or not proposed",
                    safeAddress: userParams.safeAddress,
                    requiredSignatures: threshold,
                    currentSignatures: 0,
                    messageHash,
                });
            }
            const confirmationsCount = safeMessage.confirmations.length;
            if (confirmationsCount < threshold) {
                return deny({
                    reason: "Insufficient signatures",
                    safeAddress: userParams.safeAddress,
                    currentSignatures: confirmationsCount,
                    requiredSignatures: threshold,
                    messageHash,
                });
            }
            return allow({
                safeAddress: userParams.safeAddress,
                threshold,
                messageHash,
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
        console.log("SafeMultisigPolicy evaluate");
        try {
            const rpcUrl = await Lit.Actions.getRpcUrl({ chain: "sepolia" });
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            // Get Safe threshold from contract
            const threshold = await getSafeThreshold(provider, userParams.safeAddress);
            // Use expiry and nonce from toolParams (same as precheck)
            const expiry = BigInt(toolParams.safeExpiry);
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            if (expiry <= currentTime) {
                return deny({
                    reason: "Provided expiry has already passed",
                    safeAddress: userParams.safeAddress,
                });
            }
            const parametersHash = createParametersHash(toolIpfsCid, {}, delegatorPkpInfo.ethAddress);
            const vincentExecution = {
                appId: appId,
                appVersion: appVersion,
                toolIpfsCid: toolIpfsCid,
                cbor2EncodedParametersHash: parametersHash,
                agentWalletAddress: delegatorPkpInfo.ethAddress,
                expiry: toolParams.safeExpiry,
                nonce: toolParams.safeNonce,
            };
            console.log(`vincentExecution in evaluate: ${JSON.stringify(vincentExecution)}`);
            const eip712Message = createEIP712Message(vincentExecution);
            const messageString = JSON.stringify(eip712Message);
            const messageHash = generateSafeMessageHash(messageString, userParams.safeAddress, "11155111");
            const safeMessage = await checkSafeMessage(provider, userParams.safeAddress, messageHash, toolParams.safeApiKey);
            console.log("🔍 Safe message:", safeMessage);
            if (!safeMessage || safeMessage.confirmations.length < threshold) {
                return deny({
                    reason: `Insufficient signatures in Lit Action environment.  safeMessage: ${JSON.stringify(safeMessage)}`,
                    safeAddress: userParams.safeAddress,
                    currentSignatures: safeMessage?.confirmations.length || 0,
                    requiredSignatures: threshold,
                });
            }
            console.log(`safeMessage.confirmations in evaluate: ${JSON.stringify(safeMessage.confirmations)}`);
            const signature = buildEIP712Signature(safeMessage.confirmations);
            console.log(`signature in evaluate: ${signature}`);
            const dataHash = ethers.utils.hashMessage(ethers.utils.toUtf8Bytes(messageString));
            console.log(`dataHash in evaluate: ${dataHash}`);
            const isValid = await isValidSafeSignature(provider, userParams.safeAddress, dataHash, signature);
            if (!isValid) {
                return deny({
                    reason: "Invalid Safe signature",
                    safeAddress: userParams.safeAddress,
                });
            }
            return allow({
                safeAddress: userParams.safeAddress,
                threshold,
                messageHash,
                isValidSignature: true,
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
            console.log(`Safe multisig execution recorded`);
            return allow({
                message: "Safe multisig execution recorded",
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
