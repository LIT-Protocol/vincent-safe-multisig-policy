// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SafeMessageTracker} from "../src/SafeMessageTracker.sol";

contract SafeMessageTrackerTest is Test {
    SafeMessageTracker public tracker;
    
    address public consumer1 = address(0x1);
    address public consumer2 = address(0x2);
    bytes32 public messageHash1 = keccak256("message1");
    bytes32 public messageHash2 = keccak256("message2");
    bytes32 public messageHash3 = keccak256("message3");

    event MessageConsumed(address indexed consumer, bytes32 indexed messageHash, uint64 indexed consumedAt);

    function setUp() public {
        tracker = new SafeMessageTracker();
    }

    // Basic functionality tests
    function test_getConsumedAt_returnsZeroForUnusedMessage() public view {
        uint64 consumedAt = tracker.getConsumedAt(consumer1, messageHash1);
        assertEq(consumedAt, 0);
    }

    function test_consume_singleMessage() public {
        bytes32[] memory messageHashes = new bytes32[](1);
        messageHashes[0] = messageHash1;

        vm.warp(1000);
        vm.prank(consumer1);
        
        vm.expectEmit(true, true, true, true);
        emit MessageConsumed(consumer1, messageHash1, 1000);
        
        tracker.consume(messageHashes);

        assertEq(tracker.getConsumedAt(consumer1, messageHash1), 1000);
    }

    function test_consume_multipleMessages() public {
        bytes32[] memory messageHashes = new bytes32[](3);
        messageHashes[0] = messageHash1;
        messageHashes[1] = messageHash2;
        messageHashes[2] = messageHash3;

        vm.warp(2000);
        vm.prank(consumer1);
        
        vm.expectEmit(true, true, true, true);
        emit MessageConsumed(consumer1, messageHash1, 2000);
        vm.expectEmit(true, true, true, true);
        emit MessageConsumed(consumer1, messageHash2, 2000);
        vm.expectEmit(true, true, true, true);
        emit MessageConsumed(consumer1, messageHash3, 2000);
        
        tracker.consume(messageHashes);
        
        assertEq(tracker.getConsumedAt(consumer1, messageHash1), 2000);
        assertEq(tracker.getConsumedAt(consumer1, messageHash2), 2000);
        assertEq(tracker.getConsumedAt(consumer1, messageHash3), 2000);
    }

    // Multi-consumer tests
    function test_consume_differentConsumersCanUseSameMessageHash() public {
        bytes32[] memory messageHashes = new bytes32[](1);
        messageHashes[0] = messageHash1;

        vm.warp(3000);

        vm.prank(consumer1);
        tracker.consume(messageHashes);

        vm.prank(consumer2);
        vm.expectEmit(true, true, true, true);
        emit MessageConsumed(consumer2, messageHash1, 3000);
        tracker.consume(messageHashes);

        assertTrue(tracker.getConsumedAt(consumer1, messageHash1) > 0);
        assertTrue(tracker.getConsumedAt(consumer2, messageHash1) > 0);
        
        assertEq(tracker.getConsumedAt(consumer1, messageHash1), 3000);
        assertEq(tracker.getConsumedAt(consumer2, messageHash1), 3000);
    }

    // Error condition tests
    function test_consume_revertsOnEmptyArray() public {
        bytes32[] memory messageHashes = new bytes32[](0);
        
        vm.prank(consumer1);
        vm.expectRevert(SafeMessageTracker.EmptyMessageHashes.selector);
        tracker.consume(messageHashes);
    }

    function test_consume_revertsOnAlreadyConsumed() public {
        bytes32[] memory messageHashes = new bytes32[](1);
        messageHashes[0] = messageHash1;

        vm.warp(1500);
        
        vm.prank(consumer1);
        tracker.consume(messageHashes);

        vm.warp(2000);
        vm.prank(consumer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeMessageTracker.MessageAlreadyConsumed.selector,
                consumer1,
                messageHash1,
                2000
            )
        );
        tracker.consume(messageHashes);
    }

    function test_consume_partialFailureRevertsAll() public {
        bytes32[] memory messageHashes = new bytes32[](2);
        messageHashes[0] = messageHash1;
        messageHashes[1] = messageHash2;

        vm.warp(4000);
        
        // First, consume messageHash1
        bytes32[] memory singleMessage = new bytes32[](1);
        singleMessage[0] = messageHash1;
        vm.prank(consumer1);
        tracker.consume(singleMessage);

        // Try to consume both messages (should fail on first one)
        vm.prank(consumer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeMessageTracker.MessageAlreadyConsumed.selector,
                consumer1,
                messageHash1,
                4000
            )
        );
        tracker.consume(messageHashes);

        // Verify messageHash2 was not consumed due to the revert
        assertEq(tracker.getConsumedAt(consumer1, messageHash2), 0);
    }
}