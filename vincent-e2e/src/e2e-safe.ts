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
  generateNonce,
  generateExpiry,
} from "../../vincent-packages/policies/safe-multisig/dist/lib/helpers/index.js";

// Import Safe SDK for real Safe interaction
import Safe, { hashSafeMessage } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";

(async () => {
  // Test tracking system
  const testResults: {
    name: string;
    status: "passed" | "failed";
    error?: string;
    duration?: number;
  }[] = [];
  const overallStartTime = Date.now();

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    const testStartTime = Date.now();
    console.log(`\n🧪 Running: ${testName}`);
    try {
      await testFn();
      const testDuration = Date.now() - testStartTime;
      testResults.push({
        name: testName,
        status: "passed",
        duration: testDuration,
      });
      console.log(`✅ PASSED: ${testName} (${testDuration}ms)`);
    } catch (error) {
      const testDuration = Date.now() - testStartTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      testResults.push({
        name: testName,
        status: "failed",
        error: errorMessage,
        duration: testDuration,
      });
      console.error(`❌ FAILED: ${testName} (${testDuration}ms)`);
      console.error(`   Error: ${errorMessage}`);

      // Print summary before exiting
      printTestSummary();
      process.exit(1);
    }
  };

  const printTestSummary = () => {
    const overallDuration = Date.now() - overallStartTime;

    console.log("\n" + "=".repeat(70));
    console.log("📊 SAFE MULTISIG POLICY TEST SUMMARY");
    console.log("=".repeat(70));

    const passed = testResults.filter((t) => t.status === "passed").length;
    const failed = testResults.filter((t) => t.status === "failed").length;
    const total = testResults.length;

    console.log(
      `\n📈 Overall Results: ${passed}/${total} passed${
        failed > 0 ? ` (${failed} failed)` : ""
      }`
    );
    console.log(`⏱️  Total Duration: ${(overallDuration / 1000).toFixed(2)}s`);

    console.log("\n📋 Individual Test Results:");
    testResults.forEach((result, index) => {
      const icon = result.status === "passed" ? "✅" : "❌";
      const duration = result.duration ? `${result.duration}ms` : "N/A";
      console.log(`   ${index + 1}. ${icon} ${result.name} (${duration})`);
      if (result.error) {
        console.log(`      └─ Error: ${result.error}`);
      }
    });

    console.log("\n🔍 Features Tested:");
    console.log("   🔐 EIP712 message creation and signing");
    console.log("   📡 Safe Transaction Service API integration");
    console.log("   🔍 Vincent policy signature validation");
    console.log("   🎯 Threshold requirement enforcement");
    console.log("   ⏰ Message expiry validation");
    console.log("   💰 PKP wallet funding and gas management");
    console.log("   🔗 Transaction confirmation verification");

    console.log("\n" + "=".repeat(70));
    if (failed === 0) {
      console.log(
        "🎉 ALL TESTS PASSED! Safe multisig policy is working correctly."
      );
    } else {
      console.log("💥 TEST SUITE FAILED! Check the errors above for details.");
    }
    console.log("=".repeat(70));
  };

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

  const safeApiKey = process.env.SAFE_API_KEY;
  if (!safeApiKey) {
    throw new Error("SAFE_API_KEY environment variable is required");
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
   * Prepare test parameters
   * ====================================
   */
  // Generate nonce and expiry for the test
  const testNonce = generateNonce();
  const testExpiry = generateExpiry(1); // 1 hour from now

  const TEST_TOOL_PARAMS = {
    to: accounts.delegatee.ethersWallet.address,
    amount: "0.000000000000000001", // 1 wei
    rpcUrl,
    safeApiKey,
    safeNonce: testNonce.toString(),
    safeExpiry: testExpiry.toString(),
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
      toolIpfsCids: [nativeSendTool.ipfsCid],
      toolPolicies: [
        [
          safeMultisigPolicyMetadata.ipfsCid, // Enable safe-multisig policy for safe multisig tool
        ],
      ],
      toolPolicyParameterNames: [
        ["safeAddress"], // Policy parameter names for safe multisig
      ],
      toolPolicyParameterTypes: [
        [PARAMETER_TYPE.STRING], // types for safeAddress
      ],
      toolPolicyParameterValues: [
        [safeAddress], // values for safe multisig policy
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
   * 💰 Fund the PKP wallet with ETH for gas
   * ====================================
   */
  console.log("💰 Funding PKP wallet with ETH for gas...");
  const fundingTx = await safeSigner.sendTransaction({
    to: agentWalletAddress,
    value: ethers.utils.parseEther("0.00001"), // 0.00001 ETH
  });
  await fundingTx.wait();
  console.log("✅ PKP wallet funded with 0.00001 ETH");
  console.log("   Transaction hash:", fundingTx.hash);

  // Check PKP balance
  const pkpBalance = await provider.getBalance(agentWalletAddress);
  console.log("   PKP balance:", ethers.utils.formatEther(pkpBalance), "ETH");

  /**
   * ====================================
   * 🦹‍♀️ (App Manager Account) Register Vincent app with delegatee
   * ====================================
   */
  const { appId: registeredAppId, appVersion: registeredAppVersion } =
    await accounts.appManager.registerApp({
      toolIpfsCids: appConfig.TOOL_IPFS_CIDS,
      toolPolicies: appConfig.TOOL_POLICIES,
      toolPolicyParameterNames: appConfig.TOOL_POLICY_PARAMETER_NAMES,
      toolPolicyParameterTypes: appConfig.TOOL_POLICY_PARAMETER_TYPES,
    });

  console.log("✅ Vincent app registered:", {
    appId: registeredAppId,
    appVersion: registeredAppVersion,
  });

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

  // Use the nonce and expiry values we generated for the test
  console.log("📅 Test expiry:", testExpiry);
  console.log("🔢 Test nonce:", testNonce);

  const parametersHash = createParametersHash(
    nativeSendTool.ipfsCid,
    {},
    agentWalletAddress
  );

  console.log(`Parameters hash params: `);

  const vincentExecution = {
    appId: Number(registeredAppId),
    appVersion: Number(registeredAppVersion),
    toolIpfsCid: nativeSendTool.ipfsCid,
    cbor2EncodedParametersHash: parametersHash,
    agentWalletAddress,
    expiry: testExpiry.toString(),
    nonce: testNonce.toString(),
  };

  console.log(`vincentExecution in e2e: ${JSON.stringify(vincentExecution)}`);

  const eip712Message = createEIP712Message(vincentExecution);
  const messageString = JSON.stringify(eip712Message);
  const messageHash = generateSafeMessageHash(
    messageString,
    safeAddress,
    "11155111"
  );

  console.log("📝 EIP712 message:", eip712Message);
  console.log("🔏 Message hash:", messageHash);

  /**
   * ====================================
   * Set up Safe SDK for real Safe interaction
   * ====================================
   */
  const protocolKit = await Safe.init({
    provider: rpcUrl,
    signer: funderPrivateKey,
    safeAddress,
  });

  // calculate the hash using the safe sdk
  const safeMessageHash = await protocolKit.getSafeMessageHash(
    hashSafeMessage(messageString)
  );
  console.log("🔏 Safe message hash:", safeMessageHash);
  if (safeMessageHash !== messageHash) {
    throw new Error("Safe message hash mismatch");
  }

  const apiKit = new SafeApiKit({
    chainId: 11155111n, // Sepolia
    apiKey: process.env.SAFE_API_KEY,
  });

  console.log("🔗 Safe SDK initialized");
  console.log("📡 Connected to Safe Transaction Service");

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

  // Test 1: Execute with Safe multisig policy (no signatures - should fail)
  await runTest("Policy blocks execution without signatures", async () => {
    const safePrecheckRes1 = await precheck();

    console.log(
      "   Precheck result:",
      safePrecheckRes1.success ? "SUCCESS" : "FAILED"
    );
    console.log(
      "   Policy context:",
      safePrecheckRes1.context?.policiesContext?.evaluatedPolicies
    );

    if (
      !safePrecheckRes1.success ||
      safePrecheckRes1.context?.policiesContext?.allow === false
    ) {
      console.log(
        "   ✅ Policy correctly denied execution (no Safe signatures found)"
      );
      console.log("   📄 Expected error:", safePrecheckRes1.error);
    } else {
      console.log("   ⚠️ Precheck unexpectedly succeeded - testing execution");

      const executeRes1 = await execute();
      console.log("   Execute result:", executeRes1);

      if (executeRes1.success) {
        throw new Error(
          "Precheck succeeded erronously and Execution also succeeded! Execution should have failed without Safe signatures but succeeded. This indicates a policy failure."
        );
      } else {
        throw new Error(
          "Precheck succeeded erronously but Execution failed. This indicates an issue with the precheck in the policy"
        );
      }
    }
  });

  // Test 2: Sign and propose message via Safe SDK
  await runTest("Safe SDK message signing and proposal", async () => {
    // Create Safe message using Safe SDK
    const safeMessage = protocolKit.createMessage(messageString);
    console.log("   📝 Created Safe message");

    // Sign the message using Safe SDK
    const signedMessage = await protocolKit.signMessage(safeMessage);
    console.log("   ✍️ Message signed by Safe signer:", safeSigner.address);

    // Get the signature for the current signer
    const signerSignature = signedMessage.signatures.get(
      safeSigner.address.toLowerCase()
    );
    if (!signerSignature) {
      throw new Error("Failed to get signature for signer");
    }

    console.log("   📝 Signature data length:", signerSignature.data.length);

    // Propose the message to Safe Transaction Service
    console.log("   📤 Proposing message to Safe Transaction Service...");

    const proposalResponse = await apiKit.addMessage(safeAddress, {
      message: messageString,
      signature: signerSignature.data,
    });

    console.log(
      "   ✅ Message successfully proposed to Safe Transaction Service"
    );

    // Wait a moment for the message to be processed
    console.log("   ⏳ Waiting for message to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  // Test 3: Execute with real Safe signatures
  await runTest("Policy allows execution with valid signatures", async () => {
    const safePrecheckRes2 = await precheck();

    console.log(
      "   Precheck result:",
      safePrecheckRes2.success ? "SUCCESS" : "FAILED"
    );

    if (!safePrecheckRes2.success) {
      throw new Error(
        `Precheck failed even with signatures: ${safePrecheckRes2.error}. This might be due to threshold not being met or message not being found in Transaction Service.`
      );
    }

    console.log(
      "   ✅ Precheck succeeded with Safe signatures - attempting execution"
    );

    const executeRes2 = await execute();
    console.log(
      "   Execute result:",
      executeRes2.success ? "SUCCESS" : "FAILED"
    );

    if (!executeRes2.success) {
      throw new Error(
        `Execution failed despite valid signatures: ${executeRes2.error}. This might indicate insufficient signatures or other policy constraints.`
      );
    }

    console.log(
      "   🎉 Execution succeeded with Safe multisig policy and real signatures!"
    );
    console.log("   🎉 Transaction hash:", executeRes2.result?.txHash);

    // Collect transaction hash if successful
    if (executeRes2.result?.txHash) {
      transactionHashes.push(executeRes2.result.txHash);
    } else {
      throw new Error(
        "Execution succeeded but no transaction hash was returned"
      );
    }
  });

  // Test 4: Verify transaction confirmations
  await runTest("Transaction confirmation verification", async () => {
    if (transactionHashes.length === 0) {
      throw new Error("No transaction hashes were collected during the tests");
    }

    console.log(
      `   📋 Verifying ${transactionHashes.length} transaction(s)...`
    );

    for (let i = 0; i < transactionHashes.length; i++) {
      const hash = transactionHashes[i];
      console.log(`   ${i + 1}. Transaction: ${hash}`);

      // Wait for transaction confirmation and check status
      console.log(`      ⏳ Waiting for confirmation...`);
      const receipt = await provider.waitForTransaction(hash);

      if (receipt.status === 0) {
        throw new Error(
          `Transaction ${hash} reverted! Check the transaction on Etherscan for details.`
        );
      }

      console.log(`      ✅ Confirmed in block ${receipt.blockNumber}`);
      console.log(`      ⛽ Gas used: ${receipt.gasUsed.toString()}`);
    }

    console.log(
      `   ✅ All ${transactionHashes.length} transaction(s) confirmed successfully`
    );
  });

  // Print final test summary
  printTestSummary();
  process.exit(0);
})();
