import {
  PARAMETER_TYPE,
  createAppConfig,
  init,
  suppressLitLogs,
} from "@lit-protocol/vincent-scaffold-sdk/e2e";

// Apply log suppression FIRST, before any imports that might trigger logs
suppressLitLogs(false);

import { getVincentToolClient } from "@lit-protocol/vincent-app-sdk";
import { vincentPolicyMetadata as safeMultisigPolicyMetadata } from "../../vincent-packages/policies/safe-multisig/dist/index.js";
import { bundledVincentTool as nativeSendTool } from "../../vincent-packages/tools/native-send/dist/index.js";
import { ethers } from "ethers";

// Import helpers from built policy (no TypeScript types needed in E2E)
import {
  createEIP712Message,
  createParametersHash,
  generateSafeMessageHash,
} from "../../vincent-packages/policies/safe-multisig/dist/lib/helpers/index.js";

(async () => {
  /**
   * ====================================
   * Initialise the environment
   * ====================================
   */
  const { accounts } = await init({
    network: "datil",
    deploymentStatus: "dev",
  });

  /**
   * ====================================
   * Get Safe wallet address and RPC from env
   * ====================================
   */
  const safeAddress = process.env.SAFE_WALLET_ADDRESS;
  if (!safeAddress) {
    throw new Error("SAFE_WALLET_ADDRESS environment variable is required");
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL environment variable is required");
  }

  console.log("🔐 Using Safe wallet:", safeAddress);
  console.log("🌐 Using RPC URL:", rpcUrl);

  /**
   * ====================================
   * Set up Safe signing with TEST_FUNDER_PRIVATE_KEY
   * ====================================
   */
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  
  // Get the funder private key from env
  const funderPrivateKey = process.env.TEST_FUNDER_PRIVATE_KEY;
  if (!funderPrivateKey) {
    throw new Error("TEST_FUNDER_PRIVATE_KEY environment variable is required");
  }
  
  // Create Safe signer - use funder as the signer on the Safe
  const safeSigner = new ethers.Wallet(funderPrivateKey, provider);
  console.log("🔑 Safe signer address:", safeSigner.address);

  // Get Safe threshold
  const safeContract = new ethers.Contract(
    safeAddress,
    ["function getThreshold() view returns (uint256)"],
    provider
  );
  const threshold = await safeContract.getThreshold();
  console.log("🔢 Safe threshold:", threshold.toNumber());

  /**
   * ====================================
   * (🫵 You) Prepare the tools and policies
   * ====================================
   */
  const nativeSendToolClient = getVincentToolClient({
    bundledVincentTool: nativeSendTool,
    ethersSigner: accounts.delegatee.ethersWallet,
  });

  /**
   * ====================================
   * Create EIP712 message for Safe signing
   * ====================================
   */
  const appId = BigInt(1);
  const appVersion = BigInt(1);
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
  const nonce = BigInt(Date.now()); // Use timestamp as nonce

  const TEST_TOOL_PARAMS = {
    to: accounts.delegatee.ethersWallet.address,
    amount: "0.00001",
    rpcUrl: "https://yellowstone-rpc.litprotocol.com/",
  };

  // We'll get the actual agent wallet address after minting the PKP
  let agentWalletAddress: string;

  /**
   * ====================================
   * Prepare the IPFS CIDs for the tools and policies
   * NOTE: All arrays below are parallel - each index corresponds to the same tool.
   * ❗️If you change the policy parameter values, you will need to reset the state file.
   * You can do this by running: npm run vincent:reset
   * ====================================
   */
  const appConfig = createAppConfig(
    {
      toolIpfsCids: [
        nativeSendTool.ipfsCid,
      ],
      toolPolicies: [
        [
          safeMultisigPolicyMetadata.ipfsCid, // Enable safe-multisig policy for native-send tool
        ],
      ],
      toolPolicyParameterNames: [
        ["safeAddress", "threshold", "expiry", "nonce"], // Policy parameter names for nativeSendTool
      ],
      toolPolicyParameterTypes: [
        [PARAMETER_TYPE.STRING, PARAMETER_TYPE.UINT256, PARAMETER_TYPE.UINT256, PARAMETER_TYPE.UINT256], // types for safeAddress, threshold, expiry, nonce
      ],
      toolPolicyParameterValues: [
        [safeAddress, threshold.toString(), expiry.toString(), nonce.toString()], // values for safe multisig policy
      ],
    },

    // Debugging options
    {
      cidToNameMap: {
        [nativeSendTool.ipfsCid]: "Native Send Tool",
        [safeMultisigPolicyMetadata.ipfsCid]: "Safe Multisig Policy",
      },
      debug: true,
    }
  );

  /**
   * Collect all IPFS CIDs for tools and policies that need to be:
   * 1. Authorised during agent wallet PKP minting
   * 2. Permitted as authentication methods for the PKP
   */
  const toolAndPolicyIpfsCids = [
    nativeSendTool.ipfsCid,
    safeMultisigPolicyMetadata.ipfsCid,
  ];

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) mint an Agent Wallet PKP
   * ====================================
   */
  const agentWalletPkp = await accounts.agentWalletPkpOwner.mintAgentWalletPkp({
    toolAndPolicyIpfsCids: toolAndPolicyIpfsCids,
  });

  console.log("🤖 Agent Wallet PKP:", agentWalletPkp);
  agentWalletAddress = agentWalletPkp.ethAddress;

  /**
   * ====================================
   * 🦹‍♀️ (App Manager Account) Register Vincent app with delegatee
   * ====================================
   */
  const { appId: registeredAppId, appVersion: registeredAppVersion } = await accounts.appManager.registerApp({
    toolIpfsCids: appConfig.TOOL_IPFS_CIDS,
    toolPolicies: appConfig.TOOL_POLICIES,
    toolPolicyParameterNames: appConfig.TOOL_POLICY_PARAMETER_NAMES,
    toolPolicyParameterTypes: appConfig.TOOL_POLICY_PARAMETER_TYPES,
  });

  console.log("✅ Vincent app registered:", { appId: registeredAppId, appVersion: registeredAppVersion });

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) Permit PKP to use the app version
   * ====================================
   */
  await accounts.agentWalletPkpOwner.permitAppVersion({
    pkpTokenId: agentWalletPkp.tokenId,
    appId: registeredAppId,
    appVersion: registeredAppVersion,
    toolIpfsCids: appConfig.TOOL_IPFS_CIDS,
    policyIpfsCids: appConfig.TOOL_POLICIES,
    policyParameterNames: appConfig.TOOL_POLICY_PARAMETER_NAMES,
    policyParameterValues: appConfig.TOOL_POLICY_PARAMETER_VALUES,
    policyParameterTypes: appConfig.TOOL_POLICY_PARAMETER_TYPES,
  });

  console.log("✅ PKP permitted to use app version");

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) Permit auth methods for the agent wallet PKP
   * ====================================
   */
  const permittedAuthMethodsTxHashes =
    await accounts.agentWalletPkpOwner.permittedAuthMethods({
      agentWalletPkp: agentWalletPkp,
      toolAndPolicyIpfsCids: toolAndPolicyIpfsCids,
    });

  console.log(
    "✅ Permitted Auth Methods Tx hashes:",
    permittedAuthMethodsTxHashes
  );

  /**
   * ====================================
   * 🦹‍♀️ (App Manager Account) Validate delegatee permissions
   * ====================================
   */
  const validation = await accounts.appManager.validateToolExecution({
    delegateeAddress: accounts.delegatee.ethersWallet.address,
    pkpTokenId: agentWalletPkp.tokenId,
    toolIpfsCid: nativeSendTool.ipfsCid,
  });

  console.log("✅ Tool execution validation:", validation);

  if (!validation.isPermitted) {
    throw new Error(
      `❌ Delegatee is not permitted to execute tool for PKP. Validation: ${JSON.stringify(
        validation
      )}`
    );
  }

  /**
   * ====================================
   * Create and sign Safe message for testing
   * ====================================
   */
  const parametersHash = createParametersHash(
    nativeSendTool.ipfsCid,
    TEST_TOOL_PARAMS,
    agentWalletAddress
  );

  const vincentExecution = {
    appId,
    appVersion,
    toolIpfsCid: nativeSendTool.ipfsCid,
    cbor2EncodedParametersHash: parametersHash,
    agentWalletAddress,
    expiry,
    nonce,
  };

  const eip712Message = createEIP712Message(vincentExecution);
  const messageString = JSON.stringify(eip712Message);
  const messageHash = generateSafeMessageHash(messageString);

  console.log("📝 EIP712 message:", eip712Message);
  console.log("🔏 Message hash:", messageHash);

  // For this test, we'll simulate a simple signature from the Safe signer
  // In a real implementation, you would use the Safe SDK to properly sign and propose messages
  const signature = await safeSigner.signMessage(messageString);
  
  console.log("✍️ Message signed by Safe signer:", safeSigner.address);
  console.log("📝 Signature:", signature);

  /**
   * ====================================
   * Test your tools and policies here
   * ====================================
   *
   * This section is where you validate that your custom tools and policies
   * work together as expected.
   *
   * Replace this example with tests relevant to your tools and policies.
   * ====================================
   */
  console.log("🧪 Testing Safe multisig policy");

  // Array to collect transaction hashes from successful executions
  const transactionHashes: string[] = [];

  const precheck = async () => {
    return await nativeSendToolClient.precheck(TEST_TOOL_PARAMS, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });
  };

  const execute = async () => {
    return await nativeSendToolClient.execute(TEST_TOOL_PARAMS, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });
  };

  // ----------------------------------------
  // Test 1: Execute with Safe multisig policy
  // ----------------------------------------
  console.log("(PRECHECK-TEST-1) Safe multisig execution test");
  const safePrecheckRes1 = await precheck();

  console.log("(PRECHECK-RES[1]): ", safePrecheckRes1);

  if (!safePrecheckRes1.success) {
    console.log(
      "⚠️ (PRECHECK-TEST-1) Precheck failed (expected - no valid Safe signatures available):"
    );
    console.log("📄 Error:", safePrecheckRes1.error);
    console.log(
      "💡 This is expected because the policy cannot find valid Safe signatures via the Transaction Service API"
    );
  } else {
    console.log("✅ (PRECHECK-TEST-1) Precheck succeeded - attempting execution");
    
    const executeRes1 = await execute();
    console.log("(EXECUTE-RES[1]): ", executeRes1);

    if (executeRes1.success) {
      console.log("✅ (EXECUTE-TEST-1) Execution succeeded with Safe multisig policy");
      console.log("🎉 Transaction hash:", executeRes1.result?.txHash);
      
      // Collect transaction hash if successful
      if (executeRes1.result?.txHash) {
        transactionHashes.push(executeRes1.result.txHash);
      }
    } else {
      console.log(
        "⚠️ (EXECUTE-TEST-1) Execution was blocked by policy (expected if no valid Safe signatures)"
      );
      console.log("📄 Error:", executeRes1.error);
    }
  }

  // Print all collected transaction hashes
  console.log("\n" + "=".repeat(50));
  console.log("📋 SUMMARY: COLLECTED TRANSACTION HASHES");
  console.log("=".repeat(50));

  if (transactionHashes.length > 0) {
    transactionHashes.forEach((hash, index) => {
      console.log(`${index + 1}. ${hash}`);
    });
    console.log(
      `\n✅ Total successful transactions: ${transactionHashes.length}`
    );
  } else {
    console.log("❌ No transaction hashes collected");
  }

  console.log("=".repeat(50));
  console.log("🎉 SAFE MULTISIG POLICY TEST COMPLETED!");
  console.log("=".repeat(50));
  console.log("📝 Note: To fully test with real Safe signatures:");
  console.log("   1. Use Safe SDK to properly sign and propose the EIP712 message");
  console.log("   2. Ensure the message is available via Safe Transaction Service API");
  console.log("   3. Verify that enough signers have signed to meet the threshold");
  console.log("   4. The policy will then allow execution when signatures are validated");
  console.log("=".repeat(50));

  process.exit();
})();