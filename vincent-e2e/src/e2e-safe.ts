import {
  PARAMETER_TYPE,
  createAppConfig,
  init,
  suppressLitLogs,
} from "@lit-protocol/vincent-scaffold-sdk/e2e";

// Apply log suppression FIRST, before any imports that might trigger logs
suppressLitLogs(true);

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
   * (🫵 You) Prepare the tools and policies
   * ====================================
   */
  const nativeSendToolClient = getVincentToolClient({
    // @ts-expect-error - TODO: Property '[__bundledToolBrand]' is missing in type
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
    safeApiKey,
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
  const parametersHash = createParametersHash(
    nativeSendTool.ipfsCid,
    {},
    agentWalletAddress
  );

  console.log(`Parameters hash params: `);

  const vincentExecution = {
    appId: BigInt(registeredAppId),
    appVersion: BigInt(registeredAppVersion),
    toolIpfsCid: nativeSendTool.ipfsCid,
    cbor2EncodedParametersHash: parametersHash,
    agentWalletAddress,
    expiry: generateExpiry(),
    nonce: generateNonce(),
  };

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
    signer: safeSignerPrivateKey_1,
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

  // ----------------------------------------
  // Sign and propose message via Safe SDK using safeSigner_1
  // ----------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("🔐 SIGN AND PROPOSE MESSAGE VIA SAFE SDK USING safeSigner_1");
  console.log("=".repeat(60));

  // Create Safe message using Safe SDK
  const safeMessage = protocolKit.createMessage(messageString);
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
      message: messageString,
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
      safeMessageHash,
    }, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });
  };

  const execute = async () => {
    return await nativeSendToolClient.execute({
      ...TEST_TOOL_PARAMS,
      safeMessageHash,
    }, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });
  };

  // ----------------------------------------
  // Test 1: Execute Safe multisig policy Precheck method (1 out of 2 signatures - should fail)
  // ----------------------------------------
  console.log(
    "(PRECHECK-TEST-1) Execute Safe multisig policy Precheck method (1 out of 2 signatures - should fail)"
  );
  const safePrecheckRes1 = await precheck();

  console.log("(PRECHECK-RES[1]): ", safePrecheckRes1);
  console.log(
    "(PRECHECK-RES[1].context.policiesContext.evaluatedPolicies): ",
    safePrecheckRes1.context?.policiesContext?.evaluatedPolicies
  );

  if (
    safePrecheckRes1.context?.policiesContext?.allow === false
  ) {
    console.log(
      "✅ (PRECHECK-TEST-1) Precheck correctly failed (expected - 1 out of 2 valid Safe signatures available):"
    );
    console.log("📄 Error:", safePrecheckRes1.error!);
    console.log(
      "💡 This is expected because the policy only found 1 out of 2 valid Safe signatures via the Transaction Service API"
    );
  } else {
    console.log(
      "❌ (PRECHECK-TEST-1) Precheck unexpectedly succeeded - it should have failed because it only found 1 out of 2 valid Safe signatures"
    );
  }

  // ----------------------------------------
  // Test 2: Execute Safe multisig policy Execute method (1 out of 2 signatures - should fail)
  // ----------------------------------------
  console.log(
    "(EXECUTE-TEST-1) Execute Safe multisig policy Execute method (1 out of 2 signatures - should fail)"
  );
  const safeExecuteRes1 = await execute();

  console.log("(EXECUTE-RES[1]): ", safeExecuteRes1);
  console.log(
    "(EXECUTE-RES[1].context.policiesContext.evaluatedPolicies): ",
    safeExecuteRes1.context?.policiesContext?.evaluatedPolicies
  );

  if (
    safeExecuteRes1.context?.policiesContext?.allow === false
  ) {
    console.log(
      "✅ (EXECUTE-TEST-1) Execute correctly failed (expected - 1 out of 2 valid Safe signatures available):"
    );
    console.log("📄 Error:", safeExecuteRes1.error!);
    console.log(
      "💡 This is expected because the policy only found 1 out of 2 valid Safe signatures via the Transaction Service API"
    );
  } else {
    console.log(
      "❌ (EXECUTE-TEST-1) Execute unexpectedly succeeded - it should have failed because it only found 1 out of 2 valid Safe signatures"
    );
  }

  // ----------------------------------------
  // Sign and propose message via Safe SDK using safeSigner_2
  // ----------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("🔐 SIGN AND PROPOSE MESSAGE VIA SAFE SDK USING safeSigner_2");
  console.log("=".repeat(60));

  // Sign the message using Safe SDK
  const signedMessage_2 = await protocolKit.signMessage(safeMessage);
  console.log("✍️ Message signed by Safe signer 2:", safeSigner_2.address);

  // Get the signature for the current signer
  const signerSignature_2 = signedMessage_2.signatures.get(
    safeSigner_2.address.toLowerCase()
  );
  if (!signerSignature) {
    throw new Error("Failed to get signature for signer");
  }

  console.log("📝 Signature data:", signerSignature_2!.data);

  // Propose the message to Safe Transaction Service
  console.log("📤 Proposing message to Safe Transaction Service...");

  try {
    await apiKit.addMessage(safeAddress, {
      message: messageString,
      signature: signerSignature_2!.data,
    });

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
  console.log(
    "(PRECHECK-TEST-2) Execute Safe multisig policy Precheck method (2 out of 2 signatures - should succeed)"
  );
  const safePrecheckRes2 = await precheck();

  console.log("(PRECHECK-RES[2]): ", safePrecheckRes2);
  console.log(
    "(PRECHECK-RES[2].context.policiesContext.evaluatedPolicies): ",
    safePrecheckRes2.context?.policiesContext?.evaluatedPolicies
  );

  if (
    safePrecheckRes2.context?.policiesContext?.allow === false
  ) {
    console.log(
      "❌ (PRECHECK-TEST-2) Precheck unexpectedly failed - it should have succeeded because it found 2 out of 2 valid Safe signatures"
    );
  } else {
    console.log(
      "✅ (PRECHECK-TEST-2) Precheck correctly succeeded (expected - 2 out of 2 valid Safe signatures available):"
    );
    console.log("📄 Error:", safePrecheckRes2.error!);
    console.log(
      "💡 This is expected because the policy found 2 out of 2 valid Safe signatures via the Transaction Service API"
    );
  }

  // ----------------------------------------
  // Test 4: Execute Safe multisig policy Execute method (2 out of 2 signatures - should succeed)
  // ----------------------------------------
  // console.log(
  //   "(EXECUTE-TEST-2) Safe multisig execution test - 2 out of 2 signatures (should succeed)"
  // );
  // const safeExecuteRes2 = await execute();

  // console.log("(EXECUTE-RES[2]): ", safeExecuteRes2);
  // console.log(
  //   "(EXECUTE-RES[2].context.policiesContext.evaluatedPolicies): ",
  //   safeExecuteRes2.context?.policiesContext?.evaluatedPolicies
  // );

  // if (
  //   safeExecuteRes2.context?.policiesContext?.allow === false
  // ) {
  //   console.log(
  //     "✅ (EXECUTE-TEST-2) Execute correctly failed (expected - 1 out of 2 valid Safe signatures available):"
  //   );
  //   console.log("📄 Error:", safeExecuteRes2.error!);
  //   console.log(
  //     "💡 This is expected because the policy only found 1 out of 2 valid Safe signatures via the Transaction Service API"
  //   );
  // } else {
  //   console.log(
  //     "❌ (EXECUTE-TEST-2) Execute unexpectedly succeeded - it should have failed because it only found 1 out of 2 valid Safe signatures"
  //   );
  // }

  // console.log("=".repeat(50));
  // console.log("🎉 SAFE MULTISIG POLICY TEST COMPLETED!");
  // console.log("=".repeat(50));
  // console.log("📝 Test Summary:");
  // console.log(
  //   "   ✅ Test 1: Policy correctly blocks execution without signatures"
  // );
  // console.log(
  //   "   ✅ Test 2: Safe SDK integration - message signing and proposal"
  // );
  // console.log("   ✅ Test 3: Policy validation with real Safe signatures");
  // console.log("");
  // console.log("📋 Features Tested:");
  // console.log("   🔐 EIP712 message creation and signing");
  // console.log("   📡 Safe Transaction Service API integration");
  // console.log("   🔍 Vincent policy signature validation");
  // console.log("   🎯 Threshold requirement enforcement");
  // console.log("   ⏰ Message expiry validation");
  // console.log("=".repeat(50));

  process.exit();
})();
