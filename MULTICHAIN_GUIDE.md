# Safe Multisig Policy - Multichain Support Guide

The Safe multisig policy now supports all chains where Safe Transaction Service is available. This guide explains how to use the policy across different blockchain networks.

## Supported Networks

The policy supports the following networks and their Safe Transaction Service endpoints:

### Ethereum Networks
- **Ethereum Mainnet** (Chain ID: `1`)
  - Service URL: `https://safe-transaction-mainnet.safe.global`
- **Ethereum Sepolia** (Chain ID: `11155111`)
  - Service URL: `https://safe-transaction-sepolia.safe.global`
- **Ethereum Goerli** (Chain ID: `5`)
  - Service URL: `https://safe-transaction-goerli.safe.global`

### Layer 2 Networks
- **Arbitrum One** (Chain ID: `42161`)
- **Arbitrum Sepolia** (Chain ID: `421614`)
- **Optimism** (Chain ID: `10`)
- **Optimism Sepolia** (Chain ID: `11155420`)
- **Base** (Chain ID: `8453`)
- **Base Sepolia** (Chain ID: `84532`)
- **Polygon** (Chain ID: `137`)
- **Polygon Mumbai** (Chain ID: `80001`)
- **Polygon zkEVM** (Chain ID: `1101`)

### Other Networks
- **Gnosis Chain** (Chain ID: `100`)
- **BNB Smart Chain** (Chain ID: `56`)
- **Avalanche C-Chain** (Chain ID: `43114`)
- **Aurora** (Chain ID: `1313161554`)
- **Celo** (Chain ID: `42220`)
- **Scroll** (Chain ID: `534352`)
- **zkSync Era** (Chain ID: `324`)
- **Linea** (Chain ID: `59144`)

## Usage

### Tool Parameters

When using the Safe multisig policy, you must provide the following parameters:

```typescript
const toolParams = {
  safeApiKey: "your-safe-api-key",     // Safe Transaction Service API key
  safeNonce: "123456789",              // Unique nonce for the execution
  safeExpiry: "1704067200",            // Expiry timestamp (Unix)
  chainId: "1",                        // Target blockchain chain ID
};
```

### Policy Parameters

```typescript
const userParams = {
  safeAddress: "0x1234567890123456789012345678901234567890", // Safe contract address
};
```

### Example Usage

#### Ethereum Mainnet Example
```typescript
const mainnetParams = {
  safeApiKey: process.env.SAFE_API_KEY,
  safeNonce: generateNonce().toString(),
  safeExpiry: generateExpiry(1).toString(), // 1 hour from now
  chainId: "1", // Ethereum Mainnet
};
```

#### Polygon Example
```typescript
const polygonParams = {
  safeApiKey: process.env.SAFE_API_KEY,
  safeNonce: generateNonce().toString(),
  safeExpiry: generateExpiry(1).toString(),
  chainId: "137", // Polygon Mainnet
};
```

#### Base Sepolia Example
```typescript
const baseSepoliaParams = {
  safeApiKey: process.env.SAFE_API_KEY,
  safeNonce: generateNonce().toString(),
  safeExpiry: generateExpiry(1).toString(),
  chainId: "84532", // Base Sepolia
};
```

## How It Works

### Chain Configuration
The policy automatically selects the appropriate Safe Transaction Service endpoint based on the provided `chainId`:

1. **Chain Validation**: Validates that the chain ID is supported
2. **Service URL Resolution**: Maps chain ID to the correct Safe Transaction Service URL
3. **EIP712 Domain**: Creates chain-specific EIP712 domain for message signing
4. **Message Verification**: Checks Safe signatures against the correct chain's Transaction Service

### Message Hash Generation
The policy generates chain-specific message hashes using:
- Chain-specific EIP712 domain
- Safe contract address as verifying contract
- Message content with chain context

### Signature Validation
For each chain, the policy:
1. Fetches Safe message from the chain-specific Transaction Service
2. Validates signature count meets the Safe's threshold
3. Verifies signatures using the Safe contract's `isValidSignature` method

## Error Handling

### Unsupported Chain
If an unsupported chain ID is provided, the policy will throw:
```
Error: Unsupported chain ID: 999. Supported chains: 1, 10, 11155111, 5, 100, 137, 80001, 1101, 42161, 421614, 11155420, 8453, 84532, 56, 43114, 1313161554, 42220, 534352, 324, 59144
```

### Network Issues
If the Safe Transaction Service is unavailable:
```
Error: Failed to fetch Safe message: 503 Service Unavailable
```

## Testing

The E2E test has been updated to demonstrate multichain usage. To test with different chains:

1. Update the `chainId` in `TEST_TOOL_PARAMS`
2. Ensure your Safe exists on the target chain
3. Configure the appropriate RPC URL for the chain
4. Set the correct `SAFE_WALLET_ADDRESS` for that chain

```bash
# Test with Polygon
export POLYGON_RPC_URL="https://polygon-rpc.com"
export SAFE_WALLET_ADDRESS="0x..." # Your Safe address on Polygon
npm run vincent:e2e
```

## Migration from Single-Chain

If upgrading from the previous Sepolia-only version:

1. **Add chainId parameter** to your tool parameters
2. **Update message generation** calls to include chainId
3. **Verify Safe addresses** exist on the target chains
4. **Test thoroughly** on testnets before mainnet deployment

## Best Practices

1. **Always validate chain support** before deployment
2. **Use testnets** (Sepolia, Goerli, Mumbai) for development
3. **Monitor Safe Transaction Service status** for your target chains
4. **Implement fallback mechanisms** for network issues
5. **Keep API keys secure** and rotate regularly

## Deployment

The multichain policy has been deployed to IPFS:
- **IPFS CID**: `QmVEe1jfCgTKHUhMGGU24PpxnZg13EfgSLLguLyQDcbBHm`
- **Explorer**: https://explorer.litprotocol.com/ipfs/QmVEe1jfCgTKHUhMGGU24PpxnZg13EfgSLLguLyQDcbBHm

## Support

For additional chain support or issues:
1. Check Safe documentation for new networks
2. Update the `SAFE_CHAINS` configuration in `schemas.ts`
3. Submit a pull request with the new chain configuration