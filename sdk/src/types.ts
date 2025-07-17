import type { ethers } from "ethers";

export interface VincentToolExecution {
  appId: number;
  appVersion: number;
  toolIpfsCid: string;
  toolParametersString: string;
  agentWalletAddress: string;
  expiry: string;
  nonce: string;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface EIP712Message {
  types: {
    VincentToolExecution: Array<{
      name: string;
      type: string;
    }>;
  };
  domain: EIP712Domain;
  primaryType: string;
  message: VincentToolExecution;
}

export interface SafeMessageConfig {
  vincentToolExecution: VincentToolExecution;
  eip712ChainId: number;
  eip712VerifyingContract: string;
}

export interface SafeMessageHashConfig {
  safeMessageString: string;
  safeAddress: string;
  chainId: number;
}

export interface SafeConfirmation {
  created?: string;
  modified?: string;
  owner?: string;
  signature: string;
  signatureType?: string;
}

export interface SafeMessageResponse {
  created: string;
  modified: string;
  safe: string;
  messageHash: string;
  message: string;
  proposedBy: string;
  safeAppId: number | null;
  confirmations: Array<SafeConfirmation>;
  preparedSignature?: string;
}

export interface ValidateSafeMessageParams {
  safeRpcUrl: string;
  safeAddress: string;
  litChainIdentifier: string;
  safeApiKey: string;
  safeMessageHash: string;
  executingToolParams: Record<string, any>;
  toolIpfsCid: string;
  delegatorEthAddress: string;
  appId: number;
  appVersion: number;
  logPrefix?: string;
}

export interface ValidateSafeMessageResult {
  success: boolean;
  error?: string;
  details?: Record<string, any>;
  safeMessage?: SafeMessageResponse;
}

export interface GetSafeMessageParams {
  safeTransactionServiceUrl: string;
  safeAddress: string;
  messageHash: string;
  safeApiKey: string;
}

export interface ParseAndValidateEIP712MessageParams {
  expectedEip712Message: EIP712Message;
  retrievedEip712Message: EIP712Message;
}

export interface ParseAndValidateEIP712MessageResult {
  success: boolean;
  error?: string;
  expected?: string | number;
  received?: string | number;
  validatedEip712Message?: EIP712Message;
}

export interface IsValidSafeSignatureParams {
  provider: ethers.providers.Provider;
  safeAddress: string;
  dataHash: string;
  signature: string;
}

export interface CreateVincentSafeMessageParams {
  appId: number;
  appVersion: number;
  toolIpfsCid: string;
  toolParameters: Record<string, any>;
  agentWalletAddress: string;
  expiryUnixTimestamp: number | string; // Unix timestamp
  safeConfig: {
    safeAddress: string;
    litChainIdentifier: string;
  };
  nonce?: string; // Optional - will be generated if not provided
}

export interface CreateVincentSafeMessageResult {
  vincentToolExecution: VincentToolExecution;
  safeMessageString: string;
  safeMessageHash: string;
}
