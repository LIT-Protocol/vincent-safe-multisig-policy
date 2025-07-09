import { createVincentPolicy } from "@lit-protocol/vincent-tool-sdk";
import { ethers } from "ethers";
import {
  commitAllowResultSchema,
  commitDenyResultSchema,
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  toolParamsSchema,
  userParamsSchema,
} from "./schemas";
import {
  checkSafeMessage,
  createEIP712Message,
  createParametersHash,
  generateSafeMessageHash,
  isValidSafeSignature,
  getSafeThreshold,
  generateNonce,
  generateExpiry,
  buildEIP712Signature,
  parseAndValidateEIP712Message,
} from "./helpers";

export const vincentPolicy = createVincentPolicy({
  packageName: "@lit-protocol/vincent-policy-safe-multisig" as const,

  toolParamsSchema,
  userParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

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
    console.log("SafeMultisigPolicy precheck", { toolParams, userParams });

    try {
      const rpcUrl = process.env.SEPOLIA_RPC_URL!;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      const safeMessage = await checkSafeMessage(
        provider,
        userParams.safeAddress,
        toolParams.safeMessageHash,
        toolParams.safeApiKey
      );
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
        messageString: safeMessage.message as string,
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

      const eip712Data = eip712ValidationResult.data!;

      console.log("[SafeMultisigPolicy precheck] EIP712 message validation passed");
      console.log("[SafeMultisigPolicy precheck] EIP712 message data:", eip712Data.message);

      // Get Safe threshold from contract
      const threshold = await getSafeThreshold(
        provider,
        userParams.safeAddress
      );
      console.log("[SafeMultisigPolicy precheck] Safe threshold:", threshold);

      if (safeMessage.confirmations.length < threshold) {
        return deny({
          reason: "Insufficient signatures",
          safeAddress: userParams.safeAddress,
          // currentSignatures: safeMessage.confirmations.length,
          // requiredSignatures: threshold,
        });
      }

      return allow({
        safeAddress: userParams.safeAddress,
        messageHash: toolParams.safeMessageHash,
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
    console.log("SafeMultisigPolicy evaluate");

    try {
      const rpcUrl = await Lit.Actions.getRpcUrl({ chain: "sepolia" });
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Get Safe threshold from contract
      const threshold = await getSafeThreshold(
        provider,
        userParams.safeAddress
      );

      // Generate expiry and nonce internally (same as precheck)
      const expiry = generateExpiry(1); // 1 hour from now
      const nonce = generateNonce();

      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (expiry <= currentTime) {
        return deny({
          reason: "Generated expiry is invalid",
          safeAddress: userParams.safeAddress,
        });
      }

      const parametersHash = createParametersHash(
        toolIpfsCid,
        {},
        delegatorPkpInfo.ethAddress
      );

      const vincentExecution = {
        appId: appId,
        appVersion: appVersion,
        toolIpfsCid: toolIpfsCid,
        cbor2EncodedParametersHash: parametersHash,
        agentWalletAddress: delegatorPkpInfo.ethAddress,
        expiry,
        nonce,
      };

      const eip712Message = createEIP712Message(vincentExecution);
      const messageString = JSON.stringify(eip712Message);
      const messageHash = generateSafeMessageHash(
        messageString,
        userParams.safeAddress,
        "11155111"
      );

      const safeMessage = await checkSafeMessage(
        provider,
        userParams.safeAddress,
        messageHash,
        toolParams.safeApiKey
      );

      console.log("🔍 Safe message:", safeMessage);

      if (!safeMessage || safeMessage.confirmations.length < threshold) {
        return deny({
          reason: `Insufficient signatures in Lit Action environment.  safeMessage: ${JSON.stringify(
            safeMessage
          )}`,
          safeAddress: userParams.safeAddress,
          currentSignatures: safeMessage?.confirmations.length || 0,
          requiredSignatures: threshold,
        });
      }

      const signature = buildEIP712Signature(safeMessage.confirmations);
      const isValid = await isValidSafeSignature(
        provider,
        userParams.safeAddress,
        messageHash,
        signature
      );

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
    } catch (error) {
      console.error("Evaluate error:", error);
      return deny({
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  commit: async (commitParams, { allow, deny }) => {
    console.log("SafeMultisigPolicy commit");

    try {
      const { txHash } = commitParams as any;
      console.log(`Tool execution completed with txHash: ${txHash}`);
      console.log(`Safe multisig execution recorded`);

      return allow({
        message: "Safe multisig execution recorded",
        txHash,
      });
    } catch (error) {
      console.error("Commit error:", error);
      return deny({
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});
