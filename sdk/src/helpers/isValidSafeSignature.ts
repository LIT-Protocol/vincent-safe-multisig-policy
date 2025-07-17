/**
 * @fileoverview Safe signature validation using ERC-1271 standard
 * @description This module provides functionality to validate signatures against Safe multisig contracts
 * using the ERC-1271 isValidSignature standard.
 */

import { ethers } from "ethers";
import type { IsValidSafeSignatureParams } from "../types";

/**
 * @function isValidSafeSignature
 * @description Validates a signature against a Safe multisig contract using the ERC-1271 standard.
 * This function calls the Safe contract's isValidSignature method to verify that the provided
 * signature is valid for the given data hash according to the Safe's current owner configuration.
 * 
 * The function implements the ERC-1271 standard, which returns a magic value (0x1626ba7e)
 * when the signature is valid. This allows Smart Contracts like Safe to validate signatures
 * even when they don't directly control the signing keys.
 * 
 * @param params - Configuration for signature validation
 * @param params.provider - Ethers.js provider for blockchain interaction
 * @param params.safeAddress - Address of the Safe multisig contract
 * @param params.dataHash - Hash of the data that was signed (32 bytes)
 * @param params.signature - The signature to validate (combined multisig signature)
 * 
 * @returns Promise resolving to true if signature is valid, false otherwise
 * 
 * @throws {Error} When the contract call fails or network issues occur
 * @throws {Error} When the Safe address is invalid or not a contract
 * 
 * @example
 * ```typescript
 * const provider = new ethers.providers.JsonRpcProvider('https://...');
 * 
 * const isValid = await isValidSafeSignature({
 *   provider,
 *   safeAddress: '0x123...',
 *   dataHash: '0xabc...', // 32-byte hash
 *   signature: '0xdef...' // Combined signature from Safe owners
 * });
 * 
 * if (isValid) {
 *   console.log('Signature is valid - execute transaction');
 * } else {
 *   console.log('Invalid signature - reject transaction');
 * }
 * ```
 * 
 * @see {@link https://eips.ethereum.org/EIPS/eip-1271} ERC-1271 standard
 * @see {@link https://docs.safe.global/safe-core-protocol/signatures} Safe signature documentation
 * 
 * @note The magic value 0x1626ba7e corresponds to the bytes4 hash of "isValidSignature(bytes32,bytes)"
 */
export async function isValidSafeSignature({
    provider,
    safeAddress,
    dataHash,
    signature,
}: IsValidSafeSignatureParams): Promise<boolean> {
    try {
        const safeContract = new ethers.Contract(
            safeAddress,
            [
                "function isValidSignature(bytes32 _dataHash, bytes _signature) view returns (bytes4)",
            ],
            provider
        );

        const magicValue = await safeContract.isValidSignature(dataHash, signature);
        console.log("[isValidSafeSignature] isValidSafeSignature contract call returned magicValue: ", magicValue);
        return magicValue === "0x1626ba7e";
    } catch (error) {
        console.error("[isValidSafeSignature] Error validating Safe signature:", error);
        throw error;
    }
}