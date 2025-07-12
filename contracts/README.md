# SafeMessageTracker Contract

A Solidity smart contract for tracking SAFE message consumption per Agent Wallet PKP (Programmable Key Pair). This contract prevents replay attacks by ensuring that message hashes can only be consumed once per consumer address.

## Contract Overview

### Key Features

- **Message Hash Tracking**: Records which message hashes have been consumed by each address
- **Replay Attack Prevention**: Prevents the same message hash from being consumed twice by the same address
- **Timestamp Recording**: Tracks when each message hash was consumed
- **Batch Operations**: Supports consuming multiple message hashes in a single transaction

## Contract Functions

### View Functions

#### `getConsumedAt(address consumer, bytes32 messageHash) → uint64`
Returns the timestamp when a specific message hash was consumed by a given address.

**Parameters:**
- `consumer`: The address of the message consumer
- `messageHash`: The hash of the message to check

**Returns:**
- `uint64`: The timestamp of consumption, or `0` if the message hash has not been consumed

**Example Usage:**
```solidity
uint64 timestamp = tracker.getConsumedAt(0x123..., 0xabc...);
if (timestamp == 0) {
    // Message hash has not been consumed
} else {
    // Message hash was consumed at `timestamp`
}
```

#### `consumedMessages(address consumer, bytes32 messageHash) → uint64`
Public mapping that directly exposes the consumption timestamp for any consumer-messageHash pair.

### State-Changing Functions

#### `consume(bytes32[] calldata messageHashes)`
Marks one or more message hashes as consumed by the calling address (`msg.sender`).

**Parameters:**
- `messageHashes`: An array of message hashes to mark as consumed

**Reverts:**
- `EmptyMessageHashes()`: If an empty array is provided
- `MessageAlreadyConsumed(address consumer, bytes32 messageHash, uint64 consumedAt)`: If any message hash has already been consumed by the caller

**Events Emitted:**
- `MessageConsumed(address indexed consumer, bytes32 indexed messageHash, uint64 indexed consumedAt)`: For each successfully consumed message hash

**Example Usage:**
```solidity
bytes32[] memory hashes = new bytes32[](2);
hashes[0] = 0xabc...;
hashes[1] = 0xdef...;
tracker.consume(hashes);
```

## Events

### `MessageConsumed(address indexed consumer, bytes32 indexed messageHash, uint64 indexed consumedAt)`
Emitted when a message hash is successfully marked as consumed.

**Parameters:**
- `consumer`: The address that consumed the message hash
- `messageHash`: The hash that was consumed
- `consumedAt`: The timestamp when consumption occurred

## Custom Errors

### `MessageAlreadyConsumed(address consumer, bytes32 messageHash, uint64 consumedAt)`
Thrown when attempting to consume a message hash that has already been consumed by the calling address.

### `EmptyMessageHashes()`
Thrown when calling `consume()` with an empty array of message hashes.

## Deployment

### Prerequisites

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your `.env` file:
   ```
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   DEPLOYMENT_RPC_URL=https://your-rpc-endpoint-here
   ```

### Deploy Contract

Deploy using the Makefile:
```bash
make deploy
```

Or deploy manually using Forge:
```bash
forge script script/SafeMessageTracker.s.sol:SafeMessageTrackerScript \
    --rpc-url $DEPLOYMENT_RPC_URL \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --broadcast
```

## Development

### Build
```bash
forge build
```

### Test
```bash
forge test
```

### Format Code
```bash
forge fmt
```

### Gas Snapshots
```bash
forge snapshot
```

## Security Considerations

- The contract uses `block.timestamp` for timestamping, which is manipulable by miners within a small range (~15 seconds)
