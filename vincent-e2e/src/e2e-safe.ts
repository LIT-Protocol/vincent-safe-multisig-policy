import {
  PARAMETER_TYPE,
  createAppConfig,
  init,
  suppressLitLogs,
} from "@lit-protocol/vincent-scaffold-sdk/e2e";

// Apply log suppression FIRST, before any imports that might trigger logs
suppressLitLogs(false);

import { getVincentToolClient } from "@lit-protocol/vincent-app-sdk";
import { ethers } from "ethers";
import { LIT_CHAINS } from '@lit-protocol/constants';
import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { createVincentSafeMessage } from "@lit-protocol/vincent-safe-multisig-sdk";

import { vincentPolicyMetadata as safeMultisigPolicyMetadata } from "../../vincent-packages/policies/safe-multisig/dist/index.js";
import { bundledVincentTool as nativeSendTool } from "../../vincent-packages/tools/native-send/dist/index.js";
import { getRpcUrlFromLitChainIdentifier } from "../../vincent-packages/policies/safe-multisig/dist/lib/helpers/getRpcUrlFromLitChainIdentifier.js";

// Import contract data from built policy (not included in SDK)
import { safeMessageTrackerContractAddress, safeMessageTrackerContractData } from "../../vincent-packages/policies/safe-multisig/dist/lib/safe-message-tracker-contract-data.js";

(async () => {
  /**
   * ====================================
   * Initialise test tracking system
   * ====================================
   */
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
      `\n📈 Overall Results: ${passed}/${total} passed${failed > 0 ? ` (${failed} failed)` : ""
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
  const yellowStoneProvider = new ethers.providers.JsonRpcProvider("https://yellowstone-rpc.litprotocol.com/");

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

  const safeChainLitIdentifier = process.env.SAFE_CHAIN_LIT_IDENTIFIER;
  if (!safeChainLitIdentifier) {
    throw new Error("SAFE_CHAIN_LIT_IDENTIFIER environment variable is required");
  }

  const rpcUrl = getRpcUrlFromLitChainIdentifier({ litChainIdentifier: safeChainLitIdentifier });
  const safeChainId = LIT_CHAINS[safeChainLitIdentifier].chainId;

  console.log("🔐 Using Safe wallet:", safeAddress);
  console.log("🌐 Using Safe chain Lit identifier:", safeChainLitIdentifier);
  console.log("🌐 Using RPC URL:", rpcUrl);
  console.log("🌐 Using Safe chain ID:", safeChainId);

  /**
   * ====================================
   * Setup SafeMessageTracker contract
   * ====================================
   */
  const safeMessageTrackerContract = new ethers.Contract(
    safeMessageTrackerContractAddress,
    safeMessageTrackerContractData[0].SafeMessageTracker,
    yellowStoneProvider
  );

  /**
   * ====================================
   * Set up Safe signing with SAFE_SIGNER_PRIVATE_KEY_1
   * ====================================
   */
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  // Create Safe signer - use SAFE_SIGNER_PRIVATE_KEY_1 as one of the signers on the Safe
  const safeSignerPrivateKey_1 = process.env.SAFE_SIGNER_PRIVATE_KEY_1;
  if (!safeSignerPrivateKey_1) {
    throw new Error("SAFE_SIGNER_PRIVATE_KEY_1 environment variable is required");
  }
  const safeSigner_1 = new ethers.Wallet(safeSignerPrivateKey_1, provider);
  console.log("🔑 Safe signer address:", safeSigner_1.address);

  // Create Safe signer - use SAFE_SIGNER_PRIVATE_KEY_2 as one of the signers on the Safe
  const safeSignerPrivateKey_2 = process.env.SAFE_SIGNER_PRIVATE_KEY_2;
  if (!safeSignerPrivateKey_2) {
    throw new Error("SAFE_SIGNER_PRIVATE_KEY_2 environment variable is required");
  }
  const safeSigner_2 = new ethers.Wallet(safeSignerPrivateKey_2, provider);
  console.log("🔑 Safe signer address:", safeSigner_2.address);

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
   * Set up test funder signing with TEST_FUNDER_PRIVATE_KEY
   * ====================================
   */
  const testFunderPrivateKey = process.env.TEST_FUNDER_PRIVATE_KEY;
  if (!testFunderPrivateKey) {
    throw new Error("TEST_FUNDER_PRIVATE_KEY environment variable is required");
  }
  const testFunder = new ethers.Wallet(testFunderPrivateKey, provider);
  console.log("🔑 Test funder address:", testFunder.address);

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
  const TEST_TOOL_PARAMS = {
    to: accounts.delegatee.ethersWallet.address,
    amount: "0.000001",
    rpcUrl,
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
        ["safeAddress", "litChainIdentifier"], // Policy parameter names for safe multisig
      ],
      toolPolicyParameterTypes: [
        [PARAMETER_TYPE.STRING, PARAMETER_TYPE.STRING], // types for safeAddress and litChainIdentifier
      ],
      toolPolicyParameterValues: [
        [safeAddress, safeChainLitIdentifier], // values for safe multisig policy
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
   * 💰 Fund the PKP wallet with ETH for gas (if needed)
   * ====================================
   */
  // Check PKP balance first
  const pkpBalance = await provider.getBalance(agentWalletAddress);
  // Add 10% gas buffer to the required balance
  const minRequiredBalance = ethers.utils.parseEther(TEST_TOOL_PARAMS.amount)
    .mul(110)
    .div(100);

  console.log("💰 Checking PKP wallet balance...");
  console.log(
    "   Current PKP balance:",
    ethers.utils.formatEther(pkpBalance),
    "ETH"
  );
  console.log(
    "   Required minimum:",
    ethers.utils.formatEther(minRequiredBalance),
    "ETH"
  );

  if (pkpBalance.lte(minRequiredBalance)) {
    console.log("💰 PKP balance is below minimum, funding with ETH for gas...");
    const fundingTx = await testFunder.sendTransaction({
      to: agentWalletAddress,
      value: minRequiredBalance,
    });
    await fundingTx.wait();
    console.log("✅ PKP wallet funded with", ethers.utils.formatEther(minRequiredBalance), "ETH");
    console.log("   Transaction hash:", fundingTx.hash);

    // Check new balance
    const newPkpBalance = await provider.getBalance(agentWalletAddress);
    console.log(
      "   New PKP balance:",
      ethers.utils.formatEther(newPkpBalance),
      "ETH"
    );
  } else {
    console.log("✅ PKP wallet has sufficient balance, skipping funding");
  }

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
  const { vincentToolExecution, safeMessageString, safeMessageHash } = createVincentSafeMessage({
    appId: Number(registeredAppId),
    appVersion: Number(registeredAppVersion),
    toolIpfsCid: nativeSendTool.ipfsCid,
    toolParameters: TEST_TOOL_PARAMS,
    agentWalletAddress,
    expiryUnixTimestamp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
    safeConfig: {
      safeAddress,
      litChainIdentifier: safeChainLitIdentifier,
    },
  });

  console.log("🔏 Vincent execution object:", vincentToolExecution);
  console.log("🔏 Safe message string:", safeMessageString);
  console.log("🔏 Safe message hash:", safeMessageHash);

  /**
   * ====================================
   * Set up Safe SDK for real Safe interaction
   * ====================================
   */
  const protocolKit = await Safe.init({
    provider: rpcUrl,
    signer: safeSignerPrivateKey_1,
    safeAddress,
  });

  const apiKit = new SafeApiKit({
    chainId: BigInt(safeChainId),
    apiKey: safeApiKey,
  });

  console.log("🔗 Safe SDK initialized");
  console.log("📡 Connected to Safe Transaction Service");

  // ----------------------------------------
  // Sign and propose message via Safe SDK using safeSigner_1
  // ----------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("🔐 SIGN AND PROPOSE MESSAGE VIA SAFE SDK USING safeSigner_1");
  console.log("=".repeat(60));

  // Create Safe message using Safe SDK
  const safeMessage = protocolKit.createMessage(safeMessageString);
  console.log("📝 Created Safe message", safeMessage);

  // Sign the message using Safe SDK
  const signedMessage = await protocolKit.signMessage(safeMessage);
  console.log("✍️ Message signed by Safe signer 1:", safeSigner_1.address);

  // Get the signature for the current signer
  const signerSignature = signedMessage.signatures.get(
    safeSigner_1.address.toLowerCase()
  );
  if (!signerSignature) {
    throw new Error("Failed to get signature for signer");
  }

  console.log("📝 Signature data:", signerSignature.data);

  // Propose the message to Safe Transaction Service
  console.log("📤 Proposing message to Safe Transaction Service...");

  try {
    await apiKit.addMessage(safeAddress, {
      message: safeMessageString,
      signature: signerSignature.data,
    });

    console.log("⏳ Waiting for message to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("✅ Message successfully proposed to Safe Transaction Service");
  } catch (error) {
    console.error("❌ Error proposing message:", error);
    throw error;
  }

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

  const precheck = async () => {
    return await nativeSendToolClient.precheck({
      ...TEST_TOOL_PARAMS,
      safeConfig: {
        safeApiKey,
        safeMessageHash,
      },
    }, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });
  };

  const execute = async () => {
    return await nativeSendToolClient.execute({
      ...TEST_TOOL_PARAMS,
      safeConfig: {
        safeApiKey,
        safeMessageHash,
      },
    }, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });
  };

  // ----------------------------------------
  // Test 1: Execute Safe multisig policy Precheck method (1 out of 2 signatures - should fail)
  // ----------------------------------------
  await runTest("(PRECHECK-TEST-1) Execute Safe multisig policy Precheck method (1 out of 2 signatures - should fail)", async () => {
    const safePrecheckRes1 = await precheck();

    console.log("(PRECHECK-RES[1]): ", safePrecheckRes1);
    console.log(
      "(PRECHECK-RES[1].context.policiesContext.evaluatedPolicies): ",
      safePrecheckRes1.context?.policiesContext?.evaluatedPolicies
    );

    if (
      safePrecheckRes1.context?.policiesContext?.allow === false
    ) {
      const deniedPolicy = safePrecheckRes1.context?.policiesContext?.deniedPolicy;
      console.log("📄 (PRECHECK-TEST-1) Denied Policy:", JSON.stringify(deniedPolicy, null, 2));

      if (deniedPolicy?.result?.reason === "Insufficient signatures") {
        console.log("✅ (PRECHECK-TEST-1) Precheck correctly failed (expected - 1 out of 2 valid Safe signatures available):");
      } else {
        throw new Error("❌ (PRECHECK-TEST-1) Precheck unexpectedly failed - it should have failed because it only found 1 out of 2 valid Safe signatures");
      }
    } else {
      throw new Error("❌ (PRECHECK-TEST-1) Precheck unexpectedly succeeded - it should have failed because it only found 1 out of 2 valid Safe signatures");
    }
  });

  // ----------------------------------------
  // Test 2: Execute Safe multisig policy Execute method (1 out of 2 signatures - should fail)
  // ----------------------------------------
  await runTest("(EXECUTE-TEST-1) Execute Safe multisig policy Execute method (1 out of 2 signatures - should fail)", async () => {
    const safeExecuteRes1 = await execute();

    console.log("(EXECUTE-RES[1]): ", safeExecuteRes1);
    console.log(
      "(EXECUTE-RES[1].context.policiesContext.evaluatedPolicies): ",
      safeExecuteRes1.context?.policiesContext?.evaluatedPolicies
    );

    if (
      safeExecuteRes1.context?.policiesContext?.allow === false
    ) {
      const deniedPolicy = safeExecuteRes1.context?.policiesContext?.deniedPolicy;
      console.log("📄 (EXECUTE-TEST-1) Denied Policy:", JSON.stringify(deniedPolicy, null, 2));

      if (deniedPolicy?.result?.reason === "Insufficient signatures") {
        console.log("✅ (EXECUTE-TEST-1) Execute correctly failed (expected - 1 out of 2 valid Safe signatures available):");
      } else {
        throw new Error("❌ (EXECUTE-TEST-1) Execute unexpectedly failed - it should have failed because it only found 1 out of 2 valid Safe signatures");
      }
    } else {
      throw new Error("❌ (EXECUTE-TEST-1) Execute unexpectedly succeeded - it should have failed because it only found 1 out of 2 valid Safe signatures");
    }
  });

  // ----------------------------------------
  // Sign and propose message via Safe SDK using safeSigner_2
  // ----------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("🔐 SIGN AND PROPOSE MESSAGE VIA SAFE SDK USING safeSigner_2");
  console.log("=".repeat(60));

  const protocolKit_2 = await Safe.init({
    provider: rpcUrl,
    signer: safeSignerPrivateKey_2,
    safeAddress,
  });

  // Sign the message using Safe SDK
  const signedMessage_2 = await protocolKit_2.signMessage(safeMessage);
  console.log("✍️ Message signed by Safe signer 2:", safeSigner_2.address);

  // Get the signature for the current signer
  const signerSignature_2 = signedMessage_2.signatures.get(
    safeSigner_2.address.toLowerCase()
  );
  if (!signerSignature_2) {
    throw new Error("Failed to get signature for signer");
  }

  console.log("📝 Signature data:", signerSignature_2!.data);

  // Propose the message to Safe Transaction Service
  console.log("📤 Proposing message to Safe Transaction Service...");

  try {
    await apiKit.addMessageSignature(safeMessageHash, signerSignature_2!.data);

    console.log("⏳ Waiting for message to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("✅ Message successfully proposed to Safe Transaction Service");
  } catch (error) {
    console.error("❌ Error proposing message:", error);
    throw error;
  }

  // ----------------------------------------
  // Test 3: Execute Safe multisig policy Precheck method (2 out of 2 signatures - should succeed)
  // ----------------------------------------
  await runTest("(PRECHECK-TEST-2) Execute Safe multisig policy Precheck method (2 out of 2 signatures - should succeed)", async () => {
    const safePrecheckRes2 = await precheck();

    console.log("(PRECHECK-RES[2]): ", safePrecheckRes2);
    console.log(
      "(PRECHECK-RES[2].context.policiesContext.evaluatedPolicies): ",
      safePrecheckRes2.context?.policiesContext?.evaluatedPolicies
    );

    if (
      safePrecheckRes2.context?.policiesContext?.allow === false
    ) {
      const deniedPolicy = safePrecheckRes2.context?.policiesContext?.deniedPolicy;
      console.log("📄 (PRECHECK-TEST-2) Denied Policy:", JSON.stringify(deniedPolicy, null, 2));
      throw new Error("❌ (PRECHECK-TEST-2) Precheck unexpectedly failed - it should have succeeded because it found 2 out of 2 valid Safe signatures");
    } else {
      console.log(
        "✅ (PRECHECK-TEST-2) Precheck correctly succeeded (expected - 2 out of 2 valid Safe signatures available):"
      );
    }
  });

  // Test 4: Verify Safe message is NOT marked as consumed in SafeMessageTracker contract
  await runTest("Safe message should NOT be marked as consumed in SafeMessageTracker contract", async () => {
    const consumedAtTimestamp = await safeMessageTrackerContract.getConsumedAt(agentWalletPkp.ethAddress, safeMessageHash);
    if (consumedAtTimestamp.gt(ethers.BigNumber.from(0))) {
      throw new Error(`❌ Safe message is marked as consumed in SafeMessageTracker contract. Consumed at block timestamp: ${consumedAtTimestamp}`);
    }

    console.log(`   ✅ Safe message ${safeMessageHash} is NOT marked as consumed in SafeMessageTracker contract. Consumed at block timestamp: ${consumedAtTimestamp}`);
  });

  // ----------------------------------------
  // Test 5: Execute Safe multisig policy Execute method (2 out of 2 signatures - should succeed)
  // ----------------------------------------
  let transactionHashes: { name: string; txHash: string; provider: ethers.providers.JsonRpcProvider }[] = [];
  await runTest("(EXECUTE-TEST-2) Safe multisig execution test - 2 out of 2 signatures (should succeed)", async () => {
    const safeExecuteRes2 = await execute();

    console.log("(EXECUTE-RES[2]): ", safeExecuteRes2);
    console.log(
      "(EXECUTE-RES[2].context.policiesContext.evaluatedPolicies): ",
      safeExecuteRes2.context?.policiesContext?.evaluatedPolicies
    );

    if (
      safeExecuteRes2.context?.policiesContext?.allow === false
    ) {
      const deniedPolicy = safeExecuteRes2.context?.policiesContext?.deniedPolicy;
      console.log("📄 (EXECUTE-TEST-2) Denied Policy:", JSON.stringify(deniedPolicy, null, 2));
      throw new Error("❌ (EXECUTE-TEST-2) Execute unexpectedly failed - it should have succeeded because it found 2 out of 2 valid Safe signatures");
    } else {
      console.log(
        "✅ (EXECUTE-TEST-2) Execute correctly succeeded (expected - 2 out of 2 valid Safe signatures available):"
      );

      if (safeExecuteRes2.result && 'txHash' in safeExecuteRes2.result) {
        transactionHashes.push({
          name: "Native Send Transaction",
          txHash: safeExecuteRes2.result.txHash,
          provider: provider,
        });
      } else {
        throw new Error(
          "Execution succeeded but no transaction hash was returned"
        );
      }

      if (safeExecuteRes2.result && 'safeMultisigPolicyCommitTxHash' in safeExecuteRes2.result) {
        transactionHashes.push({
          name: "Safe Multisig Policy Commit Transaction",
          txHash: safeExecuteRes2.result.safeMultisigPolicyCommitTxHash!,
          provider: yellowStoneProvider,
        });
      } else {
        throw new Error(
          "Execution succeeded but no safe multisig policy commit transaction hash was returned"
        );
      }
    }
  });

  // Test 6: Verify transaction confirmations
  await runTest("Transaction confirmation verification", async () => {
    if (transactionHashes.length === 0) {
      throw new Error("No transaction hashes were collected during the tests");
    }

    console.log(
      `   📋 Verifying ${transactionHashes.length} transaction(s)...`
    );

    for (let i = 0; i < transactionHashes.length; i++) {
      const { name, txHash } = transactionHashes[i];
      console.log(`   ${i + 1}. Transaction (${name}): ${txHash}`);

      // Wait for transaction confirmation and check status
      console.log(`      ⏳ Waiting for confirmation...`);
      const receipt = await transactionHashes[i].provider.waitForTransaction(txHash);

      if (receipt.status === 0) {
        throw new Error(
          `Transaction (${name}) ${txHash} reverted! Check the transaction on Etherscan for details.`
        );
      }

      console.log(`      ✅ Confirmed in block ${receipt.blockNumber}`);
      console.log(`      ⛽ Gas used: ${receipt.gasUsed.toString()}`);
    }

    console.log(
      `   ✅ All ${transactionHashes.length} transaction(s) confirmed successfully`
    );
  });

  // Test 7: Verify Safe message is marked as consumed in SafeMessageTracker contract
  await runTest("Safe message should be marked as consumed in SafeMessageTracker contract", async () => {
    const consumedAtTimestamp = await safeMessageTrackerContract.getConsumedAt(agentWalletPkp.ethAddress, safeMessageHash);
    if (consumedAtTimestamp.eq(ethers.BigNumber.from(0))) {
      throw new Error(`❌ Safe message is not marked as consumed in SafeMessageTracker contract. Consumed at block timestamp: ${consumedAtTimestamp}`);
    }

    console.log(`   ✅ Safe message ${safeMessageHash} is marked as consumed in SafeMessageTracker contract. Consumed at block timestamp: ${consumedAtTimestamp}`);
  });

  printTestSummary();
  process.exit();
})();
