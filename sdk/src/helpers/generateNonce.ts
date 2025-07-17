/**
 * @fileoverview Nonce generation utility for Vincent Safe messages
 * @description This module provides functionality to generate cryptographically secure unique nonces
 * for preventing replay attacks in Vincent tool executions.
 */

import { randomBytes } from 'crypto';

/**
 * @function generateNonce
 * @description Generates a cryptographically secure unique nonce string for Vincent tool execution messages.
 * The nonce combines the current timestamp with cryptographically secure random bytes to ensure uniqueness
 * and prevent replay attacks in the multisig workflow.
 * 
 * The nonce format is: (timestamp_in_ms * 2^32) + random_32_bit_number
 * This approach provides both temporal ordering and high-entropy randomness while maintaining
 * a reasonable string length for blockchain operations.
 * 
 * @returns A unique nonce string suitable for use in Vincent tool execution messages
 * 
 * @example
 * ```typescript
 * const nonce1 = generateNonce();
 * const nonce2 = generateNonce();
 * 
 * console.log(nonce1); // '7234567890123456789'
 * console.log(nonce2); // '7234567891987654321'
 * console.log(nonce1 !== nonce2); // true (cryptographically guaranteed to be unique)
 * ```
 * 
 * @note The nonce is guaranteed to be unique for calls made at different milliseconds,
 * and has cryptographically strong uniqueness for calls made within the same millisecond
 * due to the 32-bit random component from crypto.randomBytes().
 * 
 * @throws {Error} When crypto.randomBytes fails to generate random data
 */
export function generateNonce(): string {
  try {
    // Generate a cryptographically secure random nonce using current timestamp and crypto.randomBytes
    const timestamp = BigInt(Date.now());

    // Generate 4 random bytes (32 bits) for high entropy
    const randomBuffer = randomBytes(4);

    // Convert the 4 bytes to a 32-bit unsigned integer
    const randomPart = BigInt(randomBuffer.readUInt32BE(0));

    // Combine timestamp (shifted left by 32 bits) with random part
    // This ensures temporal ordering while providing cryptographic randomness
    return (timestamp * (2n ** 32n) + randomPart).toString();
  } catch (error) {
    throw new Error(
      `[generateNonce] Failed to generate nonce: ${error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}