export const EIP712_DOMAIN = {
  name: "@lit-protocol/vincent-policy-safe-multisig",
  version: "1",
  chainId: 0, // Placeholder - will be overridden
  verifyingContract: "0x0000000000000000000000000000000000000000", // Placeholder - will be overridden
} as const;

export const EIP712_MESSAGE_TYPES = {
  VincentToolExecution: [
    { name: "appId", type: "uint256" },
    { name: "appVersion", type: "uint256" },
    { name: "toolIpfsCid", type: "string" },
    { name: "toolParametersString", type: "string" },
    { name: "agentWalletAddress", type: "string" },
    { name: "expiry", type: "string" },
    { name: "nonce", type: "string" },
  ],
} as const;