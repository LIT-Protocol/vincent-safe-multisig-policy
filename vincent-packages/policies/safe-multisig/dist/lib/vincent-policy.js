import { createVincentPolicy } from "@lit-protocol/vincent-tool-sdk";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";
import { ethers } from "ethers";
import { validateSafeMessage } from "@lit-protocol/vincent-safe-multisig-sdk";
import { getRpcUrlFromLitChainIdentifier } from "./helpers/getRpcUrlFromLitChainIdentifier";
import { commitAllowResultSchema, commitDenyResultSchema, commitParamsSchema, evalAllowResultSchema, evalDenyResultSchema, precheckAllowResultSchema, precheckDenyResultSchema, toolParamsSchema, userParamsSchema, } from "./schemas";
import { safeMessageTrackerSignatures, safeMessageTrackerContractAddress } from "./safe-message-tracker-signatures";
import { safeMessageTrackerContractData } from "./safe-message-tracker-contract-data";
export const vincentPolicy = createVincentPolicy({
    packageName: "@lit-protocol/vincent-policy-safe-multisig",
    toolParamsSchema,
    userParamsSchema,
    precheckAllowResultSchema,
    precheckDenyResultSchema,
    evalAllowResultSchema,
    evalDenyResultSchema,
    commitParamsSchema,
    commitAllowResultSchema,
    commitDenyResultSchema,
    precheck: async ({ toolParams, userParams }, { allow, deny, appId, appVersion, toolIpfsCid, delegation: { delegatorPkpInfo }, }) => {
        console.log("[SafeMultisigPolicy precheck]", { toolParams, userParams });
        const { safeConfig, ...executingToolParams } = toolParams;
        try {
            /**
             * ====================================
             * Check if the Safe message has been marked as consumed in the SafeMessageTracker contract
             * ====================================
             */
            const safeMessageTrackerContract = new ethers.Contract(safeMessageTrackerContractAddress, safeMessageTrackerContractData[0].SafeMessageTracker, new ethers.providers.StaticJsonRpcProvider("https://yellowstone-rpc.litprotocol.com/"));
            const consumedAt = await safeMessageTrackerContract.getConsumedAt(delegatorPkpInfo.ethAddress, safeConfig.safeMessageHash);
            if (consumedAt.gt(ethers.BigNumber.from(0))) {
                return deny({
                    reason: `[SafeMultisigPolicy precheck] Safe message already marked as consumed in SafeMessageTracker contract`,
                    safeMessageConsumer: delegatorPkpInfo.ethAddress,
                    safeMessageConsumedAt: consumedAt.toNumber(),
                });
            }
            console.log(`[SafeMultisigPolicy precheck] Safe message not marked as consumed in SafeMessageTracker contract`);
            /**
             * ====================================
             * Validate the Safe message
             * ====================================
             */
            const validationResult = await validateSafeMessage({
                safeRpcUrl: getRpcUrlFromLitChainIdentifier({ litChainIdentifier: userParams.litChainIdentifier }),
                safeAddress: userParams.safeAddress,
                litChainIdentifier: userParams.litChainIdentifier,
                safeApiKey: safeConfig.safeApiKey,
                safeMessageHash: safeConfig.safeMessageHash,
                executingToolParams,
                toolIpfsCid,
                delegatorEthAddress: delegatorPkpInfo.ethAddress,
                appId,
                appVersion,
                logPrefix: "SafeMultisigPolicy precheck",
            });
            if (!validationResult.success) {
                return deny({
                    reason: validationResult.error,
                    ...validationResult.details,
                });
            }
            /**
             * ====================================
             * Allow the Tool execution
             * ====================================
             */
            return allow({
                safeAddress: userParams.safeAddress,
                litChainIdentifier: userParams.litChainIdentifier,
                messageHash: safeConfig.safeMessageHash,
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
        const { safeConfig, ...executingToolParams } = toolParams;
        try {
            /**
             * ====================================
             * Check if the Safe message has been marked as consumed in the SafeMessageTracker contract
             * ====================================
             */
            const getConsumedAtResponse = await Lit.Actions.runOnce({ waitForResponse: true, name: "getConsumedAt" }, async () => {
                const yellowStoneProvider = new ethers.providers.StaticJsonRpcProvider("https://yellowstone-rpc.litprotocol.com/");
                const safeMessageTrackerContract = new ethers.Contract(safeMessageTrackerContractAddress, safeMessageTrackerContractData[0].SafeMessageTracker, yellowStoneProvider);
                const consumedAt = await safeMessageTrackerContract.getConsumedAt(delegatorPkpInfo.ethAddress, safeConfig.safeMessageHash);
                return JSON.stringify({ consumedAt: consumedAt.toNumber() });
            });
            const parsedGetConsumedAtResponse = JSON.parse(getConsumedAtResponse);
            if (parsedGetConsumedAtResponse.consumedAt !== 0) {
                return deny({
                    reason: `[SafeMultisigPolicy evaluate] Safe message already marked as consumed in SafeMessageTracker contract`,
                    safeMessageConsumer: delegatorPkpInfo.ethAddress,
                    safeMessageConsumedAt: parsedGetConsumedAtResponse.consumedAt,
                });
            }
            console.log(`[SafeMultisigPolicy evaluate] Safe message not marked as consumed in SafeMessageTracker contract`);
            /**
             * ====================================
             * Validate the Safe message
             * ====================================
             */
            const validationResult = await validateSafeMessage({
                safeRpcUrl: await Lit.Actions.getRpcUrl({ chain: userParams.litChainIdentifier }),
                safeAddress: userParams.safeAddress,
                litChainIdentifier: userParams.litChainIdentifier,
                safeApiKey: safeConfig.safeApiKey,
                safeMessageHash: safeConfig.safeMessageHash,
                executingToolParams,
                toolIpfsCid,
                delegatorEthAddress: delegatorPkpInfo.ethAddress,
                appId,
                appVersion,
                logPrefix: "SafeMultisigPolicy evaluate",
            });
            if (!validationResult.success) {
                return deny({
                    reason: validationResult.error,
                    ...validationResult.details,
                });
            }
            /**
             * ====================================
             * Allow the Tool execution
             * ====================================
             */
            return allow({
                safeAddress: userParams.safeAddress,
                litChainIdentifier: userParams.litChainIdentifier,
                messageHash: safeConfig.safeMessageHash,
            });
        }
        catch (error) {
            console.error("Evaluate error:", error);
            return deny({
                reason: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    commit: async ({ safeMessageHash }, { allow, deny, delegation: { delegatorPkpInfo } }) => {
        console.log("SafeMultisigPolicy commit", { safeMessageHash });
        try {
            console.log(`[SafeMultisigPolicy commit] Consumer: ${delegatorPkpInfo.ethAddress}`);
            console.log(`[SafeMultisigPolicy commit] Consuming Safe message hash: ${safeMessageHash}`);
            console.log(`[SafeMultisigPolicy commit] SafeMessageTracker contract address: ${safeMessageTrackerContractAddress}`);
            const provider = new ethers.providers.JsonRpcProvider("https://yellowstone-rpc.litprotocol.com/");
            /**
             * ====================================
             * Mark the Safe message as consumed in the SafeMessageTracker contract
             * ====================================
             */
            const txHash = await laUtils.transaction.handler.contractCall({
                provider,
                pkpPublicKey: delegatorPkpInfo.publicKey,
                callerAddress: delegatorPkpInfo.ethAddress,
                abi: [safeMessageTrackerSignatures.SafeMessageTracker.methods.consume],
                contractAddress: safeMessageTrackerContractAddress,
                functionName: "consume",
                args: [[safeMessageHash]],
                overrides: {
                    gasLimit: 100000,
                },
            });
            console.log(`[SafeMultisigPolicy commit] Safe message consumed successfully. Tx Hash: ${txHash}`);
            return allow({ txHash });
        }
        catch (error) {
            console.error("Commit error:", error);
            return deny({
                reason: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
});
