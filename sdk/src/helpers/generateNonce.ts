/**
 * @fileoverview Universal nonce generation utility for Vincent Safe messages
 * @description This module provides functionality to generate cryptographically secure unique nonces
 * for preventing replay attacks in Vincent tool executions. Works in both Node.js and browser environments.
 */

/**
 * @function generateNonce
 * @description Generates a cryptographically secure unique nonce string for Vincent tool execution messages.
 * The nonce combines the current timestamp with cryptographically secure random bytes to ensure uniqueness
 * and prevent replay attacks in the multisig workflow.
 * 
 * This function automatically detects the environment and uses the appropriate crypto API:
 * - **Browser**: Uses Web Crypto API (window.crypto.getRandomValues)
 * - **Node.js**: Uses Node.js crypto module (crypto.randomBytes)
 * 
 * The nonce format is: (timestamp_in_ms * 2^32) + random_32_bit_number
 * This approach provides both temporal ordering and high-entropy randomness while maintaining
 * a reasonable string length for blockchain operations.
 * 
 * @returns A unique nonce string suitable for use in Vincent tool execution messages
 * 
 * @example
 * ```typescript
 * // Works in both browser and Node.js
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
 * due to the 32-bit random component from secure random number generation.
 * 
 * @throws {Error} When crypto operations fail or are not available in the environment
 * @throws {Error} When neither Web Crypto API nor Node.js crypto is available
 */
export function generateNonce(): string {
  try {
    const timestamp = BigInt(Date.now());
    let randomPart: bigint;

    // Detect environment and use appropriate crypto API
    if (isNodeEnvironment()) {
      // Node.js environment - use crypto.randomBytes
      randomPart = generateRandomInNode();
    } else if (isBrowserEnvironment()) {
      // Browser environment - use Web Crypto API
      randomPart = generateRandomInBrowser();
    } else {
      // Fallback for unknown environments
      throw new Error('No secure random number generator available in this environment');
    }

    // Combine timestamp (shifted left by 32 bits) with random part
    // This ensures temporal ordering while providing cryptographic randomness
    return (timestamp * (2n ** 32n) + randomPart).toString();
  } catch (error) {
    throw new Error(
      `[generateNonce] Failed to generate nonce: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * @function isNodeEnvironment
 * @description Detects if the code is running in a Node.js environment.
 * 
 * @returns True if running in Node.js, false otherwise
 * @internal
 */
function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * @function isBrowserEnvironment
 * @description Detects if the code is running in a browser environment with Web Crypto API support.
 * 
 * @returns True if running in a browser with crypto support, false otherwise
 * @internal
 */
function isBrowserEnvironment(): boolean {
  return (
    // @ts-expect-error - window is defined in the browser
    typeof window !== 'undefined' &&
    // @ts-expect-error - window.crypto is defined in the browser
    window.crypto != null &&
    // @ts-expect-error - window.crypto.getRandomValues is defined in the browser
    typeof window.crypto.getRandomValues === 'function'
  );
}

/**
 * @function generateRandomInNode
 * @description Generates cryptographically secure random number using Node.js crypto module.
 * 
 * @returns A BigInt representing a 32-bit random number
 * @throws {Error} When Node.js crypto module is not available or fails
 * @internal
 */
function generateRandomInNode(): bigint {
  try {
    // Dynamic import to avoid issues in browser environments
    const crypto = require('crypto');
    const randomBuffer = crypto.randomBytes(4);
    return BigInt(randomBuffer.readUInt32BE(0));
  } catch (error) {
    throw new Error(`Node.js crypto module failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * @function generateRandomInBrowser
 * @description Generates cryptographically secure random number using Web Crypto API.
 * 
 * @returns A BigInt representing a 32-bit random number
 * @throws {Error} When Web Crypto API is not available or fails
 * @internal
 */
function generateRandomInBrowser(): bigint {
  try {
    // Use Web Crypto API to generate 4 random bytes (32 bits)
    const randomArray = new Uint32Array(1);
    // @ts-expect-error - window is defined in the browser
    window.crypto.getRandomValues(randomArray);
    return BigInt(randomArray[0]);
  } catch (error) {
    throw new Error(`Web Crypto API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}