import { ethers } from "ethers";
import { buildEIP712Signature } from "./buildEIP712Signature";
import { createParametersString } from "./createParametersString";
import { getRpcUrlFromLitChainIdentifier } from "./getRpcUrlFromLitChainIdentifier";
import { getSafeMessage } from "./getSafeMessage";
import { getSafeThreshold } from "./getSafeThreshold";
import { getSafeTransactionServiceUrl } from "./getSafeTransactionServiceUrl";
import { isValidSafeSignature } from "./isValidSafeSignature";
import { parseAndValidateEIP712Message } from "./parseAndValidateEIP712Message";
export async function validateSafeMessage({ safeAddress, litChainIdentifier, safeApiKey, safeMessageHash, executingToolParams, toolIpfsCid, delegatorEthAddress, appId, appVersion, logPrefix, }) {
    /**
     * ====================================
     * Get the Safe message from Safe Transaction Service
     * ====================================
     */
    const rpcUrl = getRpcUrlFromLitChainIdentifier(litChainIdentifier);
    const safeProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
    const safeMessage = await getSafeMessage({
        safeTransactionServiceUrl: getSafeTransactionServiceUrl(litChainIdentifier),
        safeAddress,
        safeApiKey,
        messageHash: safeMessageHash,
    });
    console.log(`[SafeMultisigPolicy precheck] Retrieved Safe message: ${JSON.stringify(safeMessage, null, 2)}`);
    if (safeMessage === null) {
        return {
            success: false,
            error: "Safe message not found or not proposed",
            details: {
                safeAddress,
                messageHash: safeMessageHash,
            }
        };
    }
    /**
     * ====================================
     * Check if the number of signatures is equal to or greater than the Safe's threshold
     * ====================================
     */
    const threshold = await getSafeThreshold(safeProvider, safeAddress);
    console.log(`[${logPrefix}] Safe threshold: ${threshold}`);
    if (safeMessage.confirmations.length < threshold) {
        return {
            success: false,
            error: "Insufficient signatures",
            details: {
                safeAddress,
                currentNumberOfSignatures: safeMessage.confirmations.length,
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
    const eip712ValidationResult = parseAndValidateEIP712Message({
        messageString: safeMessage.message,
        expectedToolIpfsCid: toolIpfsCid,
        expectedAgentAddress: delegatorEthAddress,
        expectedAppId: appId,
        expectedAppVersion: appVersion,
        expectedToolParametersString: createParametersString(executingToolParams),
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
    console.log(`[${logPrefix}] safeMessage.message: ${safeMessage.message}`);
    const hashedSafeMessage = ethers.utils.hashMessage(ethers.utils.toUtf8Bytes(safeMessage.message));
    console.log(`[${logPrefix}] hashedSafeMessage: ${hashedSafeMessage}`);
    // Use the preparedSignature from Safe Transaction Service if available
    const eip712Signature = safeMessage.preparedSignature || buildEIP712Signature(safeMessage.confirmations);
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
                confirmations: safeMessage.confirmations,
            }
        };
    }
    return {
        success: true,
        safeMessage,
    };
}
