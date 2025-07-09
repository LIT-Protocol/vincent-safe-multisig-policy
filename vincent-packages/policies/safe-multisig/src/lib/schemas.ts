import { z } from "zod";

export const toolParamsSchema = z.object({
  safeApiKey: z
    .string()
    .describe("The Safe API key for Transaction Service access"),
  safeNonce: z.string().describe("The nonce value for the Vincent execution"),
  safeExpiry: z
    .string()
    .describe("The expiry timestamp for the Vincent execution"),
  chainId: z
    .string()
    .describe("The chain ID where the Safe contract is deployed"),
});

export type ToolParams = z.infer<typeof toolParamsSchema>;

export const userParamsSchema = z.object({
  safeAddress: z.string().describe("The Safe multisig contract address"),
});

export type UserParams = z.infer<typeof userParamsSchema>;

// EIP712 domain will be created dynamically based on chainId
export const createEIP712Domain = (chainId: number) => ({
  name: "Vincent Safe Policy",
  version: "1",
  chainId,
  verifyingContract: "0x0000000000000000000000000000000000000000", // Placeholder
} as const);

// Legacy domain for backward compatibility
export const EIP712_DOMAIN = {
  name: "Vincent Safe Policy",
  version: "1",
  chainId: 11155111, // Sepolia
  verifyingContract: "0x0000000000000000000000000000000000000000", // Placeholder
} as const;

export const EIP712_MESSAGE_TYPES = {
  VincentToolExecution: [
    { name: "appId", type: "uint256" },
    { name: "appVersion", type: "uint256" },
    { name: "toolIpfsCid", type: "string" },
    { name: "cbor2EncodedParametersHash", type: "string" },
    { name: "agentWalletAddress", type: "string" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export const vincentToolExecutionSchema = z.object({
  appId: z.bigint(),
  appVersion: z.bigint(),
  toolIpfsCid: z.string(),
  cbor2EncodedParametersHash: z.string(),
  agentWalletAddress: z.string(),
  expiry: z.bigint(),
  nonce: z.bigint(),
});

export type VincentToolExecution = z.infer<typeof vincentToolExecutionSchema>;

export const precheckAllowResultSchema = z.object({
  safeAddress: z.string(),
  threshold: z.number(),
  messageHash: z.string(),
  chainId: z.string(),
});

export const precheckDenyResultSchema = z.object({
  reason: z.string(),
  safeAddress: z.string().optional(),
  currentSignatures: z.number().optional(),
  requiredSignatures: z.number().optional(),
  messageHash: z.string().optional(),
});

export const evalAllowResultSchema = z.object({
  safeAddress: z.string(),
  threshold: z.number(),
  messageHash: z.string(),
  isValidSignature: z.boolean(),
});

export const evalDenyResultSchema = z.object({
  reason: z.string(),
  safeAddress: z.string().optional(),
  currentSignatures: z.number().optional(),
  requiredSignatures: z.number().optional(),
});

export const commitAllowResultSchema = z.object({
  message: z.string(),
  txHash: z.string().optional(),
});

export const commitDenyResultSchema = z.object({
  reason: z.string(),
});

export const safeMessageResponseSchema = z.object({
  created: z.string(),
  modified: z.string(),
  safe: z.string(),
  messageHash: z.string(),
  message: z.union([z.string(), z.record(z.any())]),
  proposedBy: z.string(),
  safeAppId: z.number().nullable(),
  confirmations: z.array(
    z.object({
      created: z.string().optional(),
      modified: z.string().optional(),
      owner: z.string().optional(),
      signature: z.string(),
      signatureType: z.string().optional(),
    })
  ),
  preparedSignature: z.string().optional(),
});

export type SafeMessageResponse = z.infer<typeof safeMessageResponseSchema>;

// Chain configuration for Safe Transaction Service
export interface ChainConfig {
  chainId: number;
  name: string;
  transactionServiceUrl: string;
  rpcUrl?: string;
}

// Safe Transaction Service supported networks
export const SAFE_CHAINS: Record<string, ChainConfig> = {
  // Ethereum
  "1": {
    chainId: 1,
    name: "Ethereum Mainnet",
    transactionServiceUrl: "https://safe-transaction-mainnet.safe.global",
  },
  "11155111": {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    transactionServiceUrl: "https://safe-transaction-sepolia.safe.global",
  },
  "5": {
    chainId: 5,
    name: "Ethereum Goerli",
    transactionServiceUrl: "https://safe-transaction-goerli.safe.global",
  },
  // Gnosis Chain
  "100": {
    chainId: 100,
    name: "Gnosis Chain",
    transactionServiceUrl: "https://safe-transaction-gnosis-chain.safe.global",
  },
  // Polygon
  "137": {
    chainId: 137,
    name: "Polygon",
    transactionServiceUrl: "https://safe-transaction-polygon.safe.global",
  },
  "80001": {
    chainId: 80001,
    name: "Polygon Mumbai",
    transactionServiceUrl: "https://safe-transaction-polygon-mumbai.safe.global",
  },
  // Polygon zkEVM
  "1101": {
    chainId: 1101,
    name: "Polygon zkEVM",
    transactionServiceUrl: "https://safe-transaction-zkevm.safe.global",
  },
  // Arbitrum
  "42161": {
    chainId: 42161,
    name: "Arbitrum One",
    transactionServiceUrl: "https://safe-transaction-arbitrum.safe.global",
  },
  "421614": {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    transactionServiceUrl: "https://safe-transaction-arbitrum-sepolia.safe.global",
  },
  // Optimism
  "10": {
    chainId: 10,
    name: "Optimism",
    transactionServiceUrl: "https://safe-transaction-optimism.safe.global",
  },
  "11155420": {
    chainId: 11155420,
    name: "Optimism Sepolia",
    transactionServiceUrl: "https://safe-transaction-optimism-sepolia.safe.global",
  },
  // Base
  "8453": {
    chainId: 8453,
    name: "Base",
    transactionServiceUrl: "https://safe-transaction-base.safe.global",
  },
  "84532": {
    chainId: 84532,
    name: "Base Sepolia",
    transactionServiceUrl: "https://safe-transaction-base-sepolia.safe.global",
  },
  // BNB Chain
  "56": {
    chainId: 56,
    name: "BNB Smart Chain",
    transactionServiceUrl: "https://safe-transaction-bsc.safe.global",
  },
  // Avalanche
  "43114": {
    chainId: 43114,
    name: "Avalanche C-Chain",
    transactionServiceUrl: "https://safe-transaction-avalanche.safe.global",
  },
  // Aurora
  "1313161554": {
    chainId: 1313161554,
    name: "Aurora",
    transactionServiceUrl: "https://safe-transaction-aurora.safe.global",
  },
  // Celo
  "42220": {
    chainId: 42220,
    name: "Celo",
    transactionServiceUrl: "https://safe-transaction-celo.safe.global",
  },
  // Scroll
  "534352": {
    chainId: 534352,
    name: "Scroll",
    transactionServiceUrl: "https://safe-transaction-scroll.safe.global",
  },
  // zkSync Era
  "324": {
    chainId: 324,
    name: "zkSync Era",
    transactionServiceUrl: "https://safe-transaction-zksync.safe.global",
  },
  // Linea
  "59144": {
    chainId: 59144,
    name: "Linea",
    transactionServiceUrl: "https://safe-transaction-linea.safe.global",
  },
};

export const getSafeChainConfig = (chainId: string): ChainConfig => {
  const config = SAFE_CHAINS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(SAFE_CHAINS).join(", ")}`);
  }
  return config;
};

export const getSupportedChainIds = (): string[] => {
  return Object.keys(SAFE_CHAINS);
};

export const isChainSupported = (chainId: string): boolean => {
  return chainId in SAFE_CHAINS;
};
