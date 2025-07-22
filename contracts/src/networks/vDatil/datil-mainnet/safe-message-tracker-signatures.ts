/**
 * Generated Contract Method Signatures for SafeMessageTracker
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const safeMessageTrackerContractAddress = '0x74bf9d40a7451bcc2bcbda95edc2c3310f356802';

export const safeMessageTrackerSignatures = {
  "SafeMessageTracker": {
    "address": "0x74bf9d40a7451bcc2bcbda95edc2c3310f356802",
    "methods": {
      "consume": {
        "type": "function",
        "name": "consume",
        "inputs": [
          {
            "name": "messageHashes",
            "type": "bytes32[]",
            "internalType": "bytes32[]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "consumedMessages": {
        "type": "function",
        "name": "consumedMessages",
        "inputs": [
          {
            "name": "",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ],
        "outputs": [
          {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "stateMutability": "view"
      },
      "getConsumedAt": {
        "type": "function",
        "name": "getConsumedAt",
        "inputs": [
          {
            "name": "consumer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "messageHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ],
        "outputs": [
          {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "stateMutability": "view"
      }
    },
    "events": [
      {
        "type": "event",
        "name": "MessageConsumed",
        "inputs": [
          {
            "name": "consumer",
            "type": "address",
            "indexed": true,
            "internalType": "address"
          },
          {
            "name": "messageHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          },
          {
            "name": "consumedAt",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          }
        ],
        "anonymous": false
      }
    ],
    "errors": [
      {
        "type": "error",
        "name": "EmptyMessageHashes",
        "inputs": []
      },
      {
        "type": "error",
        "name": "MessageAlreadyConsumed",
        "inputs": [
          {
            "name": "consumer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "messageHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "consumedAt",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ]
  }
} as const;