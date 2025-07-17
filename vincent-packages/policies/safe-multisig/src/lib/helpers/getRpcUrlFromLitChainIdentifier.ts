import { LIT_CHAINS } from '@lit-protocol/constants';

/**
 * Get RPC URL from LIT chain identifier
 * @param litChainIdentifier - The LIT chain identifier (e.g., 'ethereum', 'polygon', 'sepolia')
 * @returns The RPC URL for the chain
 * @throws Error if chain identifier is not found or has no RPC URL
 */
export function getRpcUrlFromLitChainIdentifier({ litChainIdentifier }: { litChainIdentifier: string }): string {
  const chain = LIT_CHAINS[litChainIdentifier];

  if (!chain) {
    throw new Error(`[getRpcUrlFromLitChainIdentifier] Chain identifier '${litChainIdentifier}' not found in LIT_CHAINS`);
  }

  if (chain.rpcUrls && Array.isArray(chain.rpcUrls) && chain.rpcUrls.length > 0) {
    return chain.rpcUrls[0];
  }

  // If no RPC URL found, provide a helpful error message
  throw new Error(`[getRpcUrlFromLitChainIdentifier] No RPC URL found for chain identifier '${litChainIdentifier}'`);
}