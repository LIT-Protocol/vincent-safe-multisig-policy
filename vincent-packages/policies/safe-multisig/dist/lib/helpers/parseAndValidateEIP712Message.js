import { ethers } from "ethers";
/**
 * Parse and validate an EIP712 message using ethers.js
 * @param messageString - The stringified EIP712 message
 * @param expectedToolIpfsCid - Expected tool IPFS CID for validation
 * @param expectedAgentAddress - Expected agent wallet address for validation
 * @returns Validation result with parsed data or error
 */
export function parseAndValidateEIP712Message({ messageString, expectedToolIpfsCid, expectedAgentAddress, expectedAppId, expectedAppVersion, expectedToolParametersString, }) {
    try {
        const parsedMessage = JSON.parse(messageString);
        console.log("[parseAndValidateEIP712Message] Parsed EIP712 message:", parsedMessage);
        if (!parsedMessage.types || !parsedMessage.domain || !parsedMessage.message) {
            return {
                success: false,
                error: "Invalid EIP712 message structure - missing types, domain, or message"
            };
        }
        const domain = parsedMessage.domain;
        const types = parsedMessage.types;
        const message = parsedMessage.message;
        if (!types.VincentToolExecution) {
            return {
                success: false,
                error: "Missing VincentToolExecution type in EIP712 message"
            };
        }
        const encodedData = ethers.utils._TypedDataEncoder.encode(domain, types, message);
        console.log("[parseAndValidateEIP712Message] EIP712 encoded data:", encodedData);
        const requiredFields = ['appId', 'appVersion', 'toolIpfsCid', 'toolParametersString', 'agentWalletAddress', 'expiry', 'nonce'];
        for (const field of requiredFields) {
            if (!(field in message)) {
                return {
                    success: false,
                    error: `Missing required field in EIP712 message: ${field}`
                };
            }
        }
        if (message.appId !== expectedAppId.toString()) {
            return {
                success: false,
                error: "EIP712 message appId does not match expected appId",
                expected: expectedAppId.toString(),
                received: message.appId
            };
        }
        if (message.appVersion !== expectedAppVersion.toString()) {
            return {
                success: false,
                error: "EIP712 message appVersion does not match expected appVersion",
                expected: expectedAppVersion.toString(),
                received: message.appVersion
            };
        }
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const expiry = BigInt(message.expiry);
        if (expiry <= currentTime) {
            return {
                success: false,
                error: "EIP712 message has expired",
                expected: `> ${currentTime.toString()}`,
                received: expiry.toString()
            };
        }
        if (message.toolIpfsCid !== expectedToolIpfsCid) {
            return {
                success: false,
                error: "EIP712 message toolIpfsCid does not match expected tool",
                expected: expectedToolIpfsCid,
                received: message.toolIpfsCid
            };
        }
        if (message.agentWalletAddress !== expectedAgentAddress) {
            return {
                success: false,
                error: "EIP712 message agentWalletAddress does not match expected agent address",
                expected: expectedAgentAddress,
                received: message.agentWalletAddress
            };
        }
        if (message.toolParametersString !== expectedToolParametersString) {
            return {
                success: false,
                error: "EIP712 message toolParametersString does not match expected tool parameters hash",
                expected: expectedToolParametersString,
                received: message.toolParametersString
            };
        }
        console.log("[parseAndValidateEIP712Message] EIP712 message validation passed");
        return {
            success: true,
            domain,
            types,
            message,
            encodedData
        };
    }
    catch (parseError) {
        console.error("[parseAndValidateEIP712Message] Error parsing EIP712 message:", parseError);
        return {
            success: false,
            error: parseError instanceof Error ? parseError.message : "Unknown parse error"
        };
    }
}
