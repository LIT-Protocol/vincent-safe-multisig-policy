import { createVincentPolicy } from "@lit-protocol/vincent-tool-sdk";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";
import { ethers } from "ethers";
import { commitResultSchema, evaluateResultSchema, precheckResultSchema, toolParamsSchema, userParamsSchema, } from "./schemas";
import { checkSafeMessage, createEIP712Message, createParametersHash, generateSafeMessageHash, isValidSafeSignature, getSafeThreshold, generateNonce, generateExpiry, buildEIP712Signature, } from "./helpers";
const SAFE_TRANSACTION_SERVICE_URL = "https://safe-transaction-sepolia.safe.global";
export const vincentPolicy = createVincentPolicy({
    packageName: "@lit-protocol/vincent-policy-safe-multisig",
    toolParamsSchema,
    userParamsSchema,
    precheckAllowResultSchema: precheckResultSchema._def.options[0],
    precheckDenyResultSchema: precheckResultSchema._def.options[1],
    evalAllowResultSchema: evaluateResultSchema._def.options[0],
    evalDenyResultSchema: evaluateResultSchema._def.options[1],
    commitAllowResultSchema: commitResultSchema._def.options[0],
    commitDenyResultSchema: commitResultSchema._def.options[1],
    precheck: async ({ toolParams, userParams }, { allow, deny, appId, appVersion, toolIpfsCid, delegation: { delegatorPkpInfo }, }) => {
        console.log("SafeMultisigPolicy precheck", { toolParams, userParams });
        try {
            const rpcUrl = process.env.SEPOLIA_RPC_URL;
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            // Get Safe threshold from contract
            const threshold = await getSafeThreshold(provider, userParams.safeAddress);
            // Generate expiry and nonce internally
            const expiry = generateExpiry(1); // 1 hour from now
            const nonce = generateNonce();
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            if (expiry <= currentTime) {
                return deny({
                    context: {
                        reason: "Generated expiry is invalid",
                        safeAddress: userParams.safeAddress,
                    },
                });
            }
            const parametersHash = createParametersHash(toolIpfsCid, toolParams, delegatorPkpInfo.ethAddress);
            const vincentExecution = {
                appId,
                appVersion,
                toolIpfsCid,
                cbor2EncodedParametersHash: parametersHash,
                agentWalletAddress: delegatorPkpInfo.ethAddress,
                expiry,
                nonce,
            };
            const eip712Message = createEIP712Message(vincentExecution);
            const messageString = JSON.stringify(eip712Message);
            const messageHash = generateSafeMessageHash(messageString);
            const safeMessage = await checkSafeMessage(provider, userParams.safeAddress, messageHash, SAFE_TRANSACTION_SERVICE_URL);
            if (!safeMessage) {
                return deny({
                    context: {
                        reason: "Safe message not found or not proposed",
                        safeAddress: userParams.safeAddress,
                        requiredSignatures: threshold,
                        currentSignatures: 0,
                        // Expose the generated values for testing
                        generatedExpiry: expiry,
                        generatedNonce: nonce,
                        messageHash,
                    },
                });
            }
            const confirmationsCount = safeMessage.confirmations.length;
            if (confirmationsCount < threshold) {
                return deny({
                    context: {
                        reason: "Insufficient signatures",
                        safeAddress: userParams.safeAddress,
                        currentSignatures: confirmationsCount,
                        requiredSignatures: threshold,
                        generatedExpiry: expiry,
                        generatedNonce: nonce,
                        messageHash,
                    },
                });
            }
            return allow({
                context: {
                    safeAddress: userParams.safeAddress,
                    threshold,
                    messageHash,
                    generatedExpiry: expiry,
                    generatedNonce: nonce,
                },
            });
        }
        catch (error) {
            console.error("Precheck error:", error);
            return deny({
                context: {
                    reason: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    },
    evaluate: async ({ toolParams, userParams }, { allow, deny }) => {
        console.log("SafeMultisigPolicy evaluate");
        try {
            const rpcUrl = await Lit.Actions.getRpcUrl({ chain: "sepolia" });
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            // Get Safe threshold from contract
            const threshold = await getSafeThreshold(provider, userParams.safeAddress);
            // Generate expiry and nonce internally (same as precheck)
            const expiry = generateExpiry(1); // 1 hour from now
            const nonce = generateNonce();
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            if (expiry <= currentTime) {
                return deny({
                    context: {
                        reason: "Generated expiry is invalid",
                        safeAddress: userParams.safeAddress,
                    },
                });
            }
            // Access vincent context properly
            const context = laUtils.vincentContext || laUtils.context;
            if (!context) {
                throw new Error("Vincent context not available in Lit Action environment");
            }
            const parametersHash = createParametersHash(context.toolIpfsCid, toolParams, context.agentWalletAddress);
            const vincentExecution = {
                appId: context.appId,
                appVersion: context.appVersion,
                toolIpfsCid: context.toolIpfsCid,
                cbor2EncodedParametersHash: parametersHash,
                agentWalletAddress: context.agentWalletAddress,
                expiry,
                nonce,
            };
            const eip712Message = createEIP712Message(vincentExecution);
            const messageString = JSON.stringify(eip712Message);
            const messageHash = generateSafeMessageHash(messageString);
            const safeMessage = await checkSafeMessage(provider, userParams.safeAddress, messageHash, SAFE_TRANSACTION_SERVICE_URL);
            if (!safeMessage ||
                safeMessage.confirmations.length < threshold) {
                return deny({
                    context: {
                        reason: "Insufficient signatures in Lit Action environment",
                        safeAddress: userParams.safeAddress,
                        currentSignatures: safeMessage?.confirmations.length || 0,
                        requiredSignatures: threshold,
                    },
                });
            }
            const signature = buildEIP712Signature(safeMessage.confirmations);
            const isValid = await isValidSafeSignature(provider, userParams.safeAddress, messageHash, signature);
            if (!isValid) {
                return deny({
                    context: {
                        reason: "Invalid Safe signature",
                        safeAddress: userParams.safeAddress,
                    },
                });
            }
            return allow({
                context: {
                    safeAddress: userParams.safeAddress,
                    threshold,
                    messageHash,
                    isValidSignature: true,
                },
            });
        }
        catch (error) {
            console.error("Evaluate error:", error);
            return deny({
                context: {
                    reason: error instanceof Error ? error.message : "Unknown error",
                },
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
                context: {
                    message: "Safe multisig execution recorded",
                    txHash,
                },
            });
        }
        catch (error) {
            console.error("Commit error:", error);
            return deny({
                context: {
                    reason: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    },
});
