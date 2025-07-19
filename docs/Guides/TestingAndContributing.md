# Testing and Contributing Guide

## Prerequisites

- Node.js `^20.11.1` and npm `10.7.0`
- Access to a blockchain RPC endpoint (Sepolia testnet recommended)
- Pinata account for IPFS pinning (required for deployment)
- Safe multisig wallet deployed on your target chain

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vincent-safe-multisig-policy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the sample environment file and configure it with your values:

```bash
cp .env.vincent-sample .env
```

Edit `.env` with the following required variables:

#### Core Configuration
```bash
# Vincent contract address (do not change unless using different deployment)
VINCENT_ADDRESS=0x78Cd1d270Ff12Ba55e98BDff1f3646426E25D932

# Pinata JWT token for IPFS deployment
PINATA_JWT=your_pinata_jwt_token
```

#### Safe Multisig Configuration
```bash
# Your Safe multisig wallet address
SAFE_WALLET_ADDRESS=0x...

# Safe Transaction Service API key
SAFE_API_KEY=your_safe_api_key

# Chain identifier where Safe is deployed (e.g., "sepolia", "ethereum")
SAFE_CHAIN_LIT_IDENTIFIER=sepolia

# Private keys of Safe signers (at least 2 required for testing)
SAFE_SIGNER_PRIVATE_KEY_1=0x...
SAFE_SIGNER_PRIVATE_KEY_2=0x...
```

#### Testing Configuration
```bash
# Private key with funds for test transactions
TEST_FUNDER_PRIVATE_KEY=0x...
```

### 4. Build the Project

Build all components:

```bash
npm run vincent:build
```

## Running Tests

### E2E Test Suite

The project includes comprehensive end-to-end tests that validate the Safe multisig policy integration.

#### Run Safe Multisig Tests

```bash
npm run vincent:e2e:safe
```

This test suite validates:
- Signature threshold enforcement
- Multi-signature approval workflow
- Replay attack prevention
- Transaction execution on blockchain
- Message consumption tracking

#### Reset Test State

If tests fail due to state issues:

```bash
npm run vincent:e2e:reset
```

or perform a hard reset which removes all `node_modules` and `dist` folders:

```bash
npm run vincent:hardreset
```

### Understanding Test Flow

1. **Setup Phase**: Initializes test accounts and deploys SafeMessageTracker contract
2. **Message Creation**: Generates EIP-712 typed messages for Safe signatures
3. **Signature Collection**: Collects signatures from Safe owners
4. **Policy Validation**: Submits signatures to Safe Transaction Service
5. **Execution**: Vincent Tool executes with policy validation
6. **Verification**: Confirms transaction success and replay protection

## Development Workflow

### Project Structure

```bash
vincent-safe-multisig-policy/
    sdk/
        src/
            index.ts             # SDK entry point
    vincent-packages/
        tools/
            native-send/         # Tool for native token transfers
        policies/
            safe-multisig/       # Safe multisig policy implementation
    vincent-e2e/
        src/
            e2e-safe.ts          # Safe multisig E2E tests
    contracts/
        SafeMessageTracker.sol   # Replay protection contract
    vincent-scripts/             # Build and utility scripts
```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Set
**Error**: "Missing required environment variable"
**Solution**: Ensure all variables in `.env.vincent-sample` are set in your `.env` file

#### 2. Insufficient Test Funds
**Error**: "Insufficient balance for transaction"
**Solution**: Fund your `TEST_FUNDER_PRIVATE_KEY` account with test tokens
