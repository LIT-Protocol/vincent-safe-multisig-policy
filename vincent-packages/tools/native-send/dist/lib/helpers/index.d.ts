/**
 * Helper functions for the native-send tool
 */
/**
 * Creates a personalized greeting message
 * @param message - The base message to include in the greeting
 * @param recipient - Optional recipient name (defaults to 'World')
 * @returns A formatted greeting string
 */
export declare function createHelloWorldGreeting(message: string, recipient?: string): string;
/**
 * Validates if a message is appropriate for greeting
 * @param message - The message to validate
 * @returns True if the message is valid
 */
export declare function isValidGreetingMessage(message: string): boolean;
/**
 * Formats a timestamp for display
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export declare function formatTimestamp(timestamp: number): string;
//# sourceMappingURL=index.d.ts.map