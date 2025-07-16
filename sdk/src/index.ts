// Export all helper functions
export {
  deterministicStringify,
  generateExpiry,
  generateNonce,
  generateSafeMessageHash,
  getRpcUrlFromLitChainIdentifier,
  getSafeMessageString,
  buildEIP712Signature,
  getSafeMessage,
  getSafeThreshold,
  getSafeTransactionServiceUrl,
  isValidSafeSignature,
  parseAndValidateEIP712Message,
  validateSafeMessage,
} from './helpers';

// Export types
export type {
  VincentToolExecution,
  SafeMessageConfig,
  SafeMessageHashConfig,
  EIP712Domain,
  EIP712Message,
  SafeConfirmation,
  SafeMessageResponse,
  ValidateSafeMessageParams,
  ValidateSafeMessageResult,
  GetSafeMessageParams,
  ParseAndValidateEIP712MessageParams,
  ParseAndValidateEIP712MessageResult,
  IsValidSafeSignatureParams,
} from './types';

// Export constants
export { EIP712_DOMAIN, EIP712_MESSAGE_TYPES } from './constants';

// Re-export LIT_CHAINS for convenience
export { LIT_CHAINS } from '@lit-protocol/constants';