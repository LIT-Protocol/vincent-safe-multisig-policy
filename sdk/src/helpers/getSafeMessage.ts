/**
 * @fileoverview Safe Transaction Service API integration for message retrieval
 * @description This module provides functionality to fetch Safe messages from the
 * Safe Transaction Service API with proper authentication and error handling.
 */

import type { SafeMessageResponse, GetSafeMessageParams } from "../types";

/**
 * @function getSafeMessage
 * @description Retrieves a Safe message from the Safe Transaction Service API by its hash.
 * This function handles authentication, error cases, and validates that the retrieved
 * message belongs to the expected Safe address.
 * 
 * The function performs the following operations:
 * 1. Constructs the API URL for the specific message hash
 * 2. Sets up authentication headers if API key is provided
 * 3. Fetches the message from the Safe Transaction Service
 * 4. Validates the response and message ownership
 * 5. Returns the complete message data including confirmations
 * 
 * @param params - Configuration for retrieving the Safe message
 * @param params.safeTransactionServiceUrl - Base URL of the Safe Transaction Service API
 * @param params.safeAddress - Address of the Safe multisig wallet (for validation)
 * @param params.messageHash - Hash of the message to retrieve
 * @param params.safeApiKey - Optional API key for authenticated requests
 * 
 * @returns Promise resolving to the complete Safe message data
 * 
 * @throws {Error} When the message is not found (404)
 * @throws {Error} When the API request fails with other HTTP errors
 * @throws {Error} When the message belongs to a different Safe address
 * @throws {Error} For network or other fetch-related errors
 * 
 * @example
 * ```typescript
 * const message = await getSafeMessage({
 *   safeTransactionServiceUrl: 'https://safe-transaction-mainnet.safe.global',
 *   safeAddress: '0x123...',
 *   messageHash: '0xabc...',
 *   safeApiKey: 'your-api-key' // Optional
 * });
 * 
 * console.log(message.confirmations.length); // Number of confirmations
 * console.log(message.safe); // Safe address that owns this message
 * ```
 * 
 * @see {@link SafeMessageResponse} for the structure of returned data
 * @see {@link GetSafeMessageParams} for parameter details
 */
export async function getSafeMessage({
    safeTransactionServiceUrl,
    safeAddress,
    messageHash,
    safeApiKey,
}: GetSafeMessageParams): Promise<SafeMessageResponse> {
    try {
        console.log(`[getSafeMessage] Checking Safe message with hash: ${messageHash}`);
        console.log(`[getSafeMessage] Using Safe address: ${safeAddress}`);
        console.log(`[getSafeMessage] Using Safe transaction service URL: ${safeTransactionServiceUrl}`);

        const url = `${safeTransactionServiceUrl}/api/v1/messages/${messageHash}/`;

        console.log(`[getSafeMessage] Fetching from URL: ${url}`);

        const headers: Record<string, string> = {
            Accept: "application/json",
            "content-type": "application/json",
        };

        // Add API key if provided
        if (safeApiKey) {
            headers["Authorization"] = `Bearer ${safeApiKey}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`[getSafeMessage] Safe message not found for hash: ${messageHash}`);
                throw new Error(`[getSafeMessage] Safe message not found for hash: ${messageHash}`);
            }
            throw new Error(
                `[getSafeMessage] Failed to fetch Safe message: ${response.status} ${response.statusText}`
            );
        }

        const message = await response.json() as SafeMessageResponse;
        console.log(`[getSafeMessage] Found Safe message:`, message);

        // Verify the message is for the correct Safe
        if (
            message.safe &&
            message.safe.toLowerCase() !== safeAddress.toLowerCase()
        ) {
            console.log(
                `[getSafeMessage] Message found but for different Safe. Expected: ${safeAddress}, Got: ${message.safe}`
            );
            throw new Error(`[getSafeMessage] Message found but for different Safe. Expected: ${safeAddress}, Got: ${message.safe}`);
        }

        return message;
    } catch (error) {
        console.error("[getSafeMessage] Error checking Safe message:", error);
        throw error;
    }
}