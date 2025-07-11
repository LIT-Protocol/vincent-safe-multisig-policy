// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SafeMessageTracker} from "../src/SafeMessageTracker.sol";

contract SafeMessageTrackerScript is Script {
    SafeMessageTracker public tracker;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        tracker = new SafeMessageTracker();
        
        console.log("SafeMessageTracker deployed at:", address(tracker));

        vm.stopBroadcast();
    }
}
