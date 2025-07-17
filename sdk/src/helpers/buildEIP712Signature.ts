/**
 * @fileoverview Utility for building EIP-712 compliant signatures from Safe confirmations
 * @description This module provides functionality to combine multiple Safe owner signatures
 * into a single formatted signature string suitable for on-chain verification.
 */

import type { SafeConfirmation } from "../types";

/**
 * @function buildEIP712Signature
 * @description Builds a combined EIP-712 signature from multiple Safe owner confirmations.
 * This function concatenates individual signatures from Safe owners into a single signature
 * string that can be used for on-chain verification of the multisig message.
 * 
 * The function performs the following operations:
 * 1. Filters out confirmations that don't have signatures
 * 2. Removes the '0x' prefix from each signature
 * 3. Sorts the signatures alphabetically for deterministic ordering
 * 4. Concatenates all signatures and adds back the '0x' prefix
 * 
 * @param confirmations - Array of Safe owner confirmations containing signatures
 * @param confirmations[].signature - The cryptographic signature from a Safe owner
 * 
 * @returns A concatenated signature string with '0x' prefix, ready for on-chain use
 * 
 * @example
 * ```typescript
 * const confirmations = [
 *   { signature: '0xabc123...', owner: '0x123...' },
 *   { signature: '0xdef456...', owner: '0x456...' },
 *   { signature: '', owner: '0x789...' } // This will be filtered out
 * ];
 * 
 * const combinedSignature = buildEIP712Signature(confirmations);
 * console.log(combinedSignature); // '0xabc123...def456...' (sorted)
 * ```
 * 
 * @see {@link SafeConfirmation} for the structure of confirmation objects
 * 
 * @note The sorting ensures deterministic signature ordering regardless of the input order,
 * which is important for consistent on-chain verification.
 */
export function buildEIP712Signature(
    confirmations: Array<SafeConfirmation>
): string {
    const signatures = confirmations
        .filter((conf) => conf.signature)
        .map((conf) => conf.signature!.slice(2))
        .sort()
        .join("");

    return "0x" + signatures;
}