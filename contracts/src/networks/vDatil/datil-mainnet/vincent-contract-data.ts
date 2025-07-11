/**
 * Generated Contract Data for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentContractAddress = '0xef62643b52b1f2e57a855403c8e1b3641cb94be7';

export const vincentContractData = [
  {
    "SafeMessageTracker": [
      {
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
      {
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
            "type": "uint64",
            "internalType": "uint64"
          }
        ],
        "stateMutability": "view"
      },
      {
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
            "type": "uint64",
            "internalType": "uint64"
          }
        ],
        "stateMutability": "view"
      },
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
            "type": "uint64",
            "indexed": true,
            "internalType": "uint64"
          }
        ],
        "anonymous": false
      },
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
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      }
    ]
  }
] as const;