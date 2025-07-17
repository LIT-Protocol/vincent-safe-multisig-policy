/**
 * @fileoverview EIP-712 message parsing and validation utility
 * @description This module provides comprehensive validation of EIP-712 messages
 * to ensure they meet Vincent tool execution requirements and are not expired.
 */

import type { ParseAndValidateEIP712MessageParams, ParseAndValidateEIP712MessageResult, VincentToolExecution } from "../types";

/**
 * @function parseAndValidateEIP712Message
 * @description Parses and validates an EIP-712 message against expected Vincent tool execution requirements.
 * This function performs comprehensive validation including structure validation, field comparison,
 * and expiration checking to ensure the message is safe for execution.
 * 
 * The validation process includes:
 * 1. Structural validation of required EIP-712 properties
 * 2. Presence of VincentToolExecution type definition
 * 3. Field-by-field comparison of critical execution parameters
 * 4. Expiration time validation against current timestamp
 * 
 * @param params - Configuration for message validation
 * @param params.expectedEip712Message - The expected EIP-712 message structure
 * @param params.retrievedEip712Message - The actual retrieved EIP-712 message to validate
 * 
 * @returns Validation result with success status and detailed error information
 * @returns returns.success - Whether validation passed completely
 * @returns returns.error - Descriptive error message if validation failed
 * @returns returns.expected - Expected value for failed field (if applicable)
 * @returns returns.received - Actual received value for failed field (if applicable)
 * @returns returns.validatedEip712Message - The validated message (if successful)
 * 
 * @example
 * ```typescript
 * const result = parseAndValidateEIP712Message({
 *   expectedEip712Message: {
 *     types: { VincentToolExecution: [...] },
 *     domain: { name: '...', chainId: 1, ... },
 *     message: { appId: 1, appVersion: 1, ... }
 *   },
 *   retrievedEip712Message: retrievedFromSafe
 * });
 * 
 * if (result.success) {
 *   console.log('Message is valid for execution');
 *   const validMessage = result.validatedEip712Message;
 * } else {
 *   console.error('Validation failed:', result.error);
 *   if (result.expected && result.received) {
 *     console.log(`Expected: ${result.expected}, Got: ${result.received}`);
 *   }
 * }
 * ```
 * 
 * @see {@link VincentToolExecution} for the structure of tool execution data
 * @see {@link ParseAndValidateEIP712MessageResult} for detailed result structure
 * 
 * @note The function validates critical fields (appId, appVersion, toolIpfsCid, agentWalletAddress, toolParametersString)
 * but allows flexibility for non-critical fields like nonce and expiry which are validated separately.
 */
export function parseAndValidateEIP712Message({
    expectedEip712Message,
    retrievedEip712Message,
}: ParseAndValidateEIP712MessageParams): ParseAndValidateEIP712MessageResult {
    try {
        const requiredEip712Properties = ['types', 'domain', 'message'];
        for (const property of requiredEip712Properties) {
            if (!(property in retrievedEip712Message)) {
                return {
                    success: false,
                    error: `Missing required property in EIP712 message: ${property}`
                };
            }
        }

        const retrievedEip712MessageDomain = retrievedEip712Message.domain;
        const retrievedEip712MessageTypes = retrievedEip712Message.types;
        const retrievedEip712MessageToolExecution = retrievedEip712Message.message;

        if (!retrievedEip712MessageTypes.VincentToolExecution) {
            return {
                success: false,
                error: "Missing VincentToolExecution type in EIP712 message"
            };
        }

        const expectedEip712MessageToolExecution = expectedEip712Message.message;
        const requiredFields: (keyof VincentToolExecution)[] = [
            "appId",
            "appVersion",
            "toolIpfsCid",
            "toolParametersString",
            "agentWalletAddress",
            "expiry",
            "nonce"
        ];

        for (const field of requiredFields) {
            // Check for missing field
            if (!(field in retrievedEip712MessageToolExecution)) {
                return {
                    success: false,
                    error: `Missing required field in EIP712 message: ${field}`
                };
            }

            if (
                [
                    "appId",
                    "appVersion",
                    "toolIpfsCid",
                    "agentWalletAddress",
                    "toolParametersString"
                ].includes(field)
            ) {
                if (retrievedEip712MessageToolExecution[field] !== expectedEip712MessageToolExecution[field]) {
                    return {
                        success: false,
                        error: `EIP712 message ${field} does not match expected ${field}`,
                        expected: expectedEip712MessageToolExecution[field],
                        received: retrievedEip712MessageToolExecution[field]
                    };
                }
            }
        }

        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const expiry = BigInt(retrievedEip712MessageToolExecution.expiry);
        if (expiry <= currentTime) {
            return {
                success: false,
                error: "EIP712 message has expired",
                expected: `> ${currentTime.toString()}`,
                received: expiry.toString()
            };
        }

        console.log("[parseAndValidateEIP712Message] EIP712 message validation passed");

        return {
            success: true,
            validatedEip712Message: retrievedEip712Message
        };
    } catch (parseError) {
        console.error("[parseAndValidateEIP712Message] Error parsing EIP712 message:", parseError);
        return {
            success: false,
            error: parseError instanceof Error ? parseError.message : "Unknown parse error"
        };
    }
}