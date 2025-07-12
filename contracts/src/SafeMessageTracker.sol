// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title SafeMessageTracker
/// @notice Tracks SAFE message consumption per Agent Wallet PKP
contract SafeMessageTracker {
    /// @dev Emitted when a SAFE message hash is marked as consumed
    event MessageConsumed(address indexed consumer, bytes32 indexed messageHash, uint64 indexed consumedAt);

    /// @dev Thrown when an msg.sender tries to consume a message hash that has already been marked as consumed by themselves
    error MessageAlreadyConsumed(address consumer, bytes32 messageHash, uint64 consumedAt);

    /// @dev Thrown when an msg.sender tries to consume an empty array of message hashes
    error EmptyMessageHashes();

    /// @notice Maps message consumer => message hash => timestamp of consumption
    mapping(address => mapping(bytes32 => uint64)) public consumedMessages;

    /// @notice Returns the timestamp a given message hash was consumed, or 0 if unused
    /// @param consumer The address of the message consumer
    /// @param messageHash The hash of the message to check
    /// @return The timestamp of consumption, or 0 if unused
    function getConsumedAt(address consumer, bytes32 messageHash) external view returns (uint64) {
        return consumedMessages[consumer][messageHash];
    }

    /// @notice Mark one or more message hashes as consumed by the calling msg.sender
    /// @param messageHashes An array of message hashes to consume
    /// @dev Reverts MessageAlreadyConsumed if any message hash has already been marked as consumed by the calling msg.sender
    /// @dev Emits MessageConsumed for each message hash that was consumed
    function consume(bytes32[] calldata messageHashes) external {
        if (messageHashes.length == 0) {
            revert EmptyMessageHashes();
        }

        uint64 timestamp = uint64(block.timestamp);

        for (uint256 i = 0; i < messageHashes.length; i++) {
            bytes32 messageHash = messageHashes[i];

            if (consumedMessages[msg.sender][messageHash] > 0) {
                revert MessageAlreadyConsumed(msg.sender, messageHash, timestamp);
            }

            consumedMessages[msg.sender][messageHash] = timestamp;
            emit MessageConsumed(msg.sender, messageHash, timestamp);
        }
    }
}