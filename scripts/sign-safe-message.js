/**
 * This script demonstrates how to properly sign a Safe message using the Safe SDK
 * for real-world usage with the Vincent Safe Multisig Policy.
 * 
 * To use this script:
 * 1. Install dependencies: npm install @safe-global/protocol-kit @safe-global/api-kit ethers
 * 2. Set up your environment variables
 * 3. Run: node scripts/sign-safe-message.js
 */

import Safe from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { ethers } from 'ethers';

// This would come from your Vincent execution context
const sampleVincentExecution = {
  appId: "1",
  appVersion: "1", 
  toolIpfsCid: "QmSampleToolCid",
  cbor2EncodedParametersHash: "0xsamplehash",
  agentWalletAddress: "0xSampleAgentAddress",
  expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  nonce: Date.now().toString(),
};

async function signSafeMessage() {
  // Environment setup
  const safeAddress = process.env.SAFE_WALLET_ADDRESS;
  const signerPrivateKey = process.env.TEST_FUNDER_PRIVATE_KEY;
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  
  if (!safeAddress || !signerPrivateKey || !rpcUrl) {
    throw new Error('Missing required environment variables');
  }

  // Set up ethers and Safe SDK
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(signerPrivateKey, provider);
  
  const protocolKit = await Safe.create({
    ethAdapter: {
      getAddress: () => signer.address,
      signMessage: (message) => signer.signMessage(message),
      // ... other adapter methods
    },
    safeAddress,
  });

  const apiKit = new SafeApiKit({
    txServiceUrl: 'https://safe-transaction-sepolia.safe.global',
    ethAdapter: protocolKit.getEthAdapter(),
  });

  // Create EIP712 message (same structure as in Vincent policy)
  const eip712Message = {
    types: {
      VincentToolExecution: [
        { name: "appId", type: "uint256" },
        { name: "appVersion", type: "uint256" },
        { name: "toolIpfsCid", type: "string" },
        { name: "cbor2EncodedParametersHash", type: "string" },
        { name: "agentWalletAddress", type: "string" },
        { name: "expiry", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    },
    domain: {
      name: "Vincent Safe Policy",
      version: "1",
      chainId: 11155111, // Sepolia
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    primaryType: "VincentToolExecution",
    message: sampleVincentExecution,
  };

  const messageString = JSON.stringify(eip712Message);
  
  // Sign the message
  const safeMessage = protocolKit.createMessage(messageString);
  const signedMessage = await protocolKit.signMessage(safeMessage);
  
  // Propose to Safe Transaction Service
  await apiKit.addMessage(safeAddress, {
    message: messageString,
    signature: signedMessage.signatures.get(signer.address.toLowerCase())?.data || '',
  });

  console.log('✅ Safe message signed and proposed!');
  console.log('Message:', messageString);
  console.log('Signer:', signer.address);
  
  return {
    messageString,
    messageHash: safeMessage.getSignableHash(),
    signer: signer.address,
  };
}

// Export for use in other scripts
export { signSafeMessage };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  signSafeMessage().catch(console.error);
}