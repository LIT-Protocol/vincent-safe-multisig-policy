import { ethers } from "ethers";
import { LIT_CHAINS } from "@lit-protocol/constants";

import { buildEIP712Signature } from "./buildEIP712Signature";
import { getSafeMessage } from "./getSafeMessage";
import { getSafeThreshold } from "./getSafeThreshold";
import { getSafeTransactionServiceUrl } from "./getSafeTransactionServiceUrl";
import { isValidSafeSignature } from "./isValidSafeSignature";
import { parseAndValidateEIP712Message } from "./parseAndValidateEIP712Message";
import { deterministicStringify } from "./deterministicStringify";
import { EIP712Message, ValidateSafeMessageParams, ValidateSafeMessageResult, VincentToolExecution } from "../types";
import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES } from "../constants";

export async function validateSafeMessage({
  safeRpcUrl,
  safeAddress,
  litChainIdentifier,
  safeApiKey,
  safeMessageHash,
  executingToolParams,
  toolIpfsCid,
  delegatorEthAddress,
  appId,
  appVersion,
  logPrefix,
}: ValidateSafeMessageParams): Promise<ValidateSafeMessageResult> {
  /**
   * ====================================
   * Get the Safe message from Safe Transaction Service
   * ====================================
   */
  const safeProvider = new ethers.providers.StaticJsonRpcProvider(safeRpcUrl);

  const retrievedSafeMessage = await getSafeMessage({
    safeTransactionServiceUrl: getSafeTransactionServiceUrl({ litChainIdentifier }),
    safeAddress,
    safeApiKey,
    messageHash: safeMessageHash,
  });
  console.log(`[SafeMultisigPolicy precheck] Retrieved Safe message: ${JSON.stringify(retrievedSafeMessage, null, 2)}`);

  /**
   * ====================================
   * Check if the number of signatures is equal to or greater than the Safe's threshold
   * ====================================
   */
  const threshold = await getSafeThreshold({ provider: safeProvider, safeAddress });
  console.log(`[${logPrefix}] Safe threshold: ${threshold}`);

  if (retrievedSafeMessage.confirmations.length < threshold) {
    return {
      success: false,
      error: "Insufficient signatures",
      details: {
        safeAddress,
        currentNumberOfSignatures: retrievedSafeMessage.confirmations.length,
        requiredNumberOfSignatures: threshold,
      }
    };
  }

  /**
   * ====================================
   * Validate the structure of the signed EIP-712 message.
   * Also validate the parsed values match the App Id, App Version, Tool IPFS CID, and Tool parameters.
   * ====================================
   */
  const retrievedEip712Message = JSON.parse(retrievedSafeMessage.message) as EIP712Message;

  const eip712ValidationResult = parseAndValidateEIP712Message({
    expectedEip712Message: {
      types: {
        VincentToolExecution: [...EIP712_MESSAGE_TYPES.VincentToolExecution]
      },
      domain: {
        ...EIP712_DOMAIN,
        chainId: LIT_CHAINS[litChainIdentifier].chainId,
        verifyingContract: safeAddress,
      },
      primaryType: "VincentToolExecution",
      message: {
        appId,
        appVersion,
        toolIpfsCid,
        toolParametersString: deterministicStringify(executingToolParams),
        agentWalletAddress: delegatorEthAddress,
        expiry: retrievedEip712Message.message.expiry,
        nonce: retrievedEip712Message.message.nonce,
      },
    },
    retrievedEip712Message,
  });

  if (!eip712ValidationResult.success) {
    return {
      success: false,
      error: eip712ValidationResult.error || "EIP712 validation failed",
      details: {
        safeAddress,
        messageHash: safeMessageHash,
        expected: eip712ValidationResult.expected,
        received: eip712ValidationResult.received,
      }
    };
  }

  /**
   * ====================================
   * Validate the signature returned by Safe Transaction Service against the Safe contract
   * ====================================
   */
  console.log(`[${logPrefix}] retrievedSafeMessage.message: ${retrievedSafeMessage.message}`);
  const hashedSafeMessage = ethers.utils.hashMessage(
    ethers.utils.toUtf8Bytes(JSON.stringify(retrievedSafeMessage.message))
  );
  console.log(`[${logPrefix}] hashedSafeMessage: ${hashedSafeMessage}`);

  // Use the preparedSignature from Safe Transaction Service if available
  const eip712Signature = retrievedSafeMessage.preparedSignature || buildEIP712Signature(retrievedSafeMessage.confirmations);
  console.log(`[${logPrefix}] eip712Signature: ${eip712Signature}`);

  const isValid = await isValidSafeSignature({
    provider: safeProvider,
    safeAddress,
    dataHash: hashedSafeMessage,
    signature: eip712Signature,
  });
  console.log(`[${logPrefix}] isValidSafeSignature: ${isValid}`);

  if (!isValid) {
    return {
      success: false,
      error: "Invalid Safe signature",
      details: {
        confirmations: retrievedSafeMessage.confirmations,
      }
    };
  }

  return {
    success: true,
    safeMessage: retrievedSafeMessage,
  };
}