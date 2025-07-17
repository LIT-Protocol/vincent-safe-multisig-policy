/**
 * @fileoverview Nonce generation utility for Vincent Safe messages
 * @description This module provides functionality to generate unique nonces
 * for preventing replay attacks in Vincent tool executions.
 */

/**
 * @function generateNonce
 * @description Generates a unique nonce string for Vincent tool execution messages.
 * The nonce combines the current timestamp with a random component to ensure uniqueness
 * and prevent replay attacks in the multisig workflow.
 * 
 * The nonce format is: (timestamp_in_ms * 1000000) + random_6_digit_number
 * This approach provides both temporal ordering and randomness while maintaining
 * a reasonable string length for blockchain operations.
 * 
 * @returns A unique nonce string suitable for use in Vincent tool execution messages
 * 
 * @example
 * ```typescript
 * const nonce1 = generateNonce();
 * const nonce2 = generateNonce();
 * 
 * console.log(nonce1); // '1672531200000123456'
 * console.log(nonce2); // '1672531200000789012'
 * console.log(nonce1 !== nonce2); // true (highly unlikely to be equal)
 * ```
 * 
 * @note The nonce is guaranteed to be unique for calls made at different milliseconds,
 * and has a very high probability of being unique for calls made within the same millisecond
 * due to the random component.
 */
export function generateNonce(): string {
  // Generate a random nonce using current timestamp and random value
  const timestamp = BigInt(Date.now());
  const randomPart = BigInt(Math.floor(Math.random() * 1000000));
  return (timestamp * 1000000n + randomPart).toString();
}