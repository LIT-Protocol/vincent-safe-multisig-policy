import { createVincentPolicy } from "@lit-protocol/vincent-tool-sdk";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";
import { ethers } from "ethers";
import {
  commitAllowResultSchema,
  commitDenyResultSchema,
  commitParamsSchema,
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  toolParamsSchema,
  userParamsSchema,
} from "./schemas";
import {
  getSafeMessage,
  getSafeThreshold,
  parseAndValidateEIP712Message,
  getRpcUrlFromLitChainIdentifier,
  getSafeTransactionServiceUrl,
  isValidSafeSignature,
  buildEIP712Signature,
  createParametersString,
} from "./helpers";
import { safeMessageTrackerSignatures, safeMessageTrackerContractAddress } from "./safe-message-tracker-signatures";

export const vincentPolicy = createVincentPolicy({
  packageName: "@lit-protocol/vincent-policy-safe-multisig" as const,

  toolParamsSchema,
  userParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  commitParamsSchema,
  commitAllowResultSchema,
  commitDenyResultSchema,

  precheck: async (
    { toolParams, userParams },
    {
      allow,
      deny,
      appId,
      appVersion,
      toolIpfsCid,
      delegation: { delegatorPkpInfo },
    }
  ) => {
    console.log("[SafeMultisigPolicy precheck]", { toolParams, userParams });
    const { safeConfig, ...executingToolParams } = toolParams;

    try {
      const rpcUrl = getRpcUrlFromLitChainIdentifier(userParams.litChainIdentifier);
      const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

      const safeMessage = await getSafeMessage({
        safeTransactionServiceUrl: getSafeTransactionServiceUrl(userParams.litChainIdentifier),
        safeAddress: userParams.safeAddress,
        safeApiKey: safeConfig.safeApiKey,
        messageHash: safeConfig.safeMessageHash,
      });
      console.log(`[SafeMultisigPolicy precheck] Retrieved Safe message: ${JSON.stringify(safeMessage, null, 2)}`);

      if (safeMessage === null) {
        return deny({
          reason: "Safe message not found or not proposed",
          safeAddress: userParams.safeAddress,
          messageHash: safeConfig.safeMessageHash,
        });
      }

      const threshold = await getSafeThreshold(
        provider,
        userParams.safeAddress
      );
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
        messageString: safeMessage.message as string,
        expectedToolIpfsCid: toolIpfsCid,
        expectedAgentAddress: delegatorPkpInfo.ethAddress,
        expectedAppId: appId,
        expectedAppVersion: appVersion,
        expectedToolParametersString: createParametersString(executingToolParams),
      });

      if (!eip712ValidationResult.success) {
        return deny({
          reason: eip712ValidationResult.error || "EIP712 validation failed",
          safeAddress: userParams.safeAddress,
          messageHash: safeConfig.safeMessageHash,
          expected: eip712ValidationResult.expected,
          received: eip712ValidationResult.received,
        });
      }

      console.log(`[SafeMultisigPolicy precheck] safeMessage.message: ${safeMessage.message}`);
      const hashedSafeMessage = ethers.utils.hashMessage(
        ethers.utils.toUtf8Bytes(safeMessage.message as string)
      );
      console.log(`[SafeMultisigPolicy precheck] hashedSafeMessage: ${hashedSafeMessage}`);

      // Use the preparedSignature from Safe Transaction Service if available
      const eip712Signature = safeMessage.preparedSignature || buildEIP712Signature(safeMessage.confirmations);
      console.log(`[SafeMultisigPolicy precheck] eip712Signature: ${eip712Signature}`);

      const isValid = await isValidSafeSignature(
        {
          provider,
          safeAddress: userParams.safeAddress,
          dataHash: hashedSafeMessage,
          signature: eip712Signature,
        }
      );
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
        messageHash: safeConfig.safeMessageHash,
      });
    } catch (error) {
      console.error("Precheck error:", error);
      return deny({
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  evaluate: async (
    { toolParams, userParams },
    {
      allow,
      deny,
      appId,
      appVersion,
      toolIpfsCid,
      delegation: { delegatorPkpInfo },
    }
  ) => {
    console.log("[SafeMultisigPolicy evaluate]", { toolParams, userParams });
    const { safeConfig, ...executingToolParams } = toolParams;

    try {
      const rpcUrl = getRpcUrlFromLitChainIdentifier(userParams.litChainIdentifier);
      const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

      const safeMessage = await getSafeMessage({
        safeTransactionServiceUrl: getSafeTransactionServiceUrl(userParams.litChainIdentifier),
        safeAddress: userParams.safeAddress,
        safeApiKey: safeConfig.safeApiKey,
        messageHash: safeConfig.safeMessageHash,
      });
      console.log("[SafeMultisigPolicy evaluate] Retrieved Safe message:", JSON.stringify(safeMessage, null, 2));

      if (safeMessage === null) {
        return deny({
          reason: "Safe message not found or not proposed",
          safeAddress: userParams.safeAddress,
          messageHash: safeConfig.safeMessageHash,
        });
      }

      const threshold = await getSafeThreshold(
        provider,
        userParams.safeAddress
      );
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
        messageString: safeMessage.message as string,
        expectedToolIpfsCid: toolIpfsCid,
        expectedAgentAddress: delegatorPkpInfo.ethAddress,
        expectedAppId: appId,
        expectedAppVersion: appVersion,
        expectedToolParametersString: createParametersString(executingToolParams),
      });

      if (!eip712ValidationResult.success) {
        return deny({
          reason: eip712ValidationResult.error || "EIP712 validation failed",
          safeAddress: userParams.safeAddress,
          messageHash: safeConfig.safeMessageHash,
          expected: eip712ValidationResult.expected,
          received: eip712ValidationResult.received,
        });
      }

      console.log(`[SafeMultisigPolicy precheck] safeMessage.message: ${safeMessage.message}`);
      const hashedSafeMessage = ethers.utils.hashMessage(
        ethers.utils.toUtf8Bytes(safeMessage.message as string)
      );
      console.log(`[SafeMultisigPolicy precheck] hashedSafeMessage: ${hashedSafeMessage}`);

      // Use the preparedSignature from Safe Transaction Service if available
      const eip712Signature = safeMessage.preparedSignature || buildEIP712Signature(safeMessage.confirmations);
      console.log(`[SafeMultisigPolicy precheck] eip712Signature: ${eip712Signature}`);

      const isValid = await isValidSafeSignature(
        {
          provider,
          safeAddress: userParams.safeAddress,
          dataHash: hashedSafeMessage,
          signature: eip712Signature,
        }
      );
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
        messageHash: safeConfig.safeMessageHash,
      });
    } catch (error) {
      console.error("Evaluate error:", error);
      return deny({
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  commit: async (
    { safeMessageHash },
    { allow, deny, delegation: { delegatorPkpInfo } }
  ) => {
    console.log("SafeMultisigPolicy commit", { safeMessageHash });

    try {
      console.log(`[SafeMultisigPolicy commit] Consumer: ${delegatorPkpInfo.ethAddress}`);
      console.log(`[SafeMultisigPolicy commit] Consuming Safe message hash: ${safeMessageHash}`);
      console.log(`[SafeMultisigPolicy commit] SafeMessageTracker contract address: ${safeMessageTrackerContractAddress}`);

      const provider = new ethers.providers.JsonRpcProvider(
        "https://yellowstone-rpc.litprotocol.com/"
      );

      // Call contract directly without Lit.Actions.runOnce wrapper
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
    } catch (error) {
      console.error("Commit error:", error);
      return deny({
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});
