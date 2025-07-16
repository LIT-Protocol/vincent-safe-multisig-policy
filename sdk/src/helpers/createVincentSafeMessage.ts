import { LIT_CHAINS } from '@lit-protocol/constants';

import type { VincentToolExecution } from '../types';
import { deterministicStringify } from './deterministicStringify';
import { generateNonce } from './generateNonce';
import { getSafeMessageString } from './getSafeMessageString';
import { generateSafeMessageHash } from './generateSafeMessageHash';

export interface CreateVincentSafeMessageParams {
  appId: number;
  appVersion: number;
  toolIpfsCid: string;
  toolParameters: Record<string, any>;
  agentWalletAddress: string;
  expiryUnixTimestamp: number; // Unix timestamp
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

/**
 * Creates a Vincent Safe message with all necessary components for Safe multisig execution.
 * This is a high-level convenience function that combines all the individual steps.
 * 
 * @param params - Configuration for creating the Vincent Safe message
 * @returns Object containing the Vincent execution data, Safe message string, and Safe message hash
 */
export function createVincentSafeMessage(params: CreateVincentSafeMessageParams): CreateVincentSafeMessageResult {
  const {
    appId,
    appVersion,
    toolIpfsCid,
    toolParameters,
    agentWalletAddress,
    expiryUnixTimestamp,
    safeConfig,
    nonce = generateNonce(),
  } = params;

  // Serialize tool parameters
  const toolParametersString = deterministicStringify(toolParameters);

  // Create Vincent execution object
  const vincentToolExecution: VincentToolExecution = {
    appId,
    appVersion,
    toolIpfsCid,
    toolParametersString,
    agentWalletAddress,
    expiry: expiryUnixTimestamp.toString(),
    nonce,
  };

  // Generate Safe message string
  const safeMessageString = getSafeMessageString({
    vincentToolExecution,
    eip712ChainId: LIT_CHAINS[safeConfig.litChainIdentifier].chainId,
    eip712VerifyingContract: safeConfig.safeAddress,
  });

  // Generate Safe message hash
  const safeMessageHash = generateSafeMessageHash({
    safeMessageString,
    safeAddress: safeConfig.safeAddress,
    chainId: LIT_CHAINS[safeConfig.litChainIdentifier].chainId,
  });

  return {
    vincentToolExecution,
    safeMessageString,
    safeMessageHash,
  };
}