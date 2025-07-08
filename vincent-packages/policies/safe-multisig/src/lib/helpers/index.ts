import { ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import SafeApiKit from "@safe-global/api-kit";
import {
  EIP712_DOMAIN,
  EIP712_MESSAGE_TYPES,
  VincentToolExecution,
  SafeMessageResponse,
} from "../schemas";

const SAFE_MESSAGE_TYPE_HASH =
  "0x60b3cbf8b4a223d68d641b3b6ddf9a298e7f33710cf3d3a9d1146b5a6150fbca";

export function createEIP712Message(params: {
  appId: number | bigint;
  appVersion: number | bigint;
  toolIpfsCid: string;
  cbor2EncodedParametersHash: string;
  agentWalletAddress: string;
  expiry: bigint;
  nonce: bigint;
}) {
  return {
    types: EIP712_MESSAGE_TYPES,
    domain: EIP712_DOMAIN,
    primaryType: "VincentToolExecution",
    message: {
      appId: params.appId.toString(),
      appVersion: params.appVersion.toString(),
      toolIpfsCid: params.toolIpfsCid,
      cbor2EncodedParametersHash: params.cbor2EncodedParametersHash,
      agentWalletAddress: params.agentWalletAddress,
      expiry: params.expiry.toString(),
      nonce: params.nonce.toString(),
    },
  };
}

export function hashToolParameters(params: any): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((obj: any, key) => {
      obj[key] = params[key];
      return obj;
    }, {});

  return keccak256(toUtf8Bytes(JSON.stringify(sortedParams)));
}

export async function checkSafeMessage(
  provider: ethers.providers.Provider,
  safeAddress: string,
  messageHash: string,
  safeApiKey: string
): Promise<SafeMessageResponse | null> {
  try {
    console.log(`🔍 Checking Safe message with hash: ${messageHash}`);
    console.log(`🔍 Using Safe address: ${safeAddress}`);

    // Initialize SafeApiKit with the correct configuration for Sepolia
    const apiKit = new SafeApiKit({
      chainId: 11155111n, // Sepolia
      apiKey: safeApiKey,
    });

    // Use Safe SDK to get the message by hash
    const message = await apiKit.getMessage(messageHash);
    console.log(`✅ Found Safe message:`, message);

    // Transform the response to match our schema expectations
    const transformedMessage: SafeMessageResponse = {
      created: message.created,
      modified: message.modified,
      safe: message.safe,
      messageHash: message.messageHash,
      message: message.message,
      proposedBy: message.proposedBy,
      safeAppId:
        typeof message.safeAppId === "string"
          ? parseInt(message.safeAppId)
          : message.safeAppId,
      confirmations: message.confirmations.map((conf) => ({
        created: conf.created,
        modified: conf.modified,
        owner: conf.owner,
        signature: conf.signature,
        signatureType: conf.signatureType,
      })),
      preparedSignature: message.preparedSignature,
    };

    return transformedMessage;
  } catch (error) {
    console.error("Error checking Safe message:", error);

    // Check if it's a 404-like error (message not found)
    if (
      error instanceof Error &&
      (error.message.includes("404") ||
        error.message.includes("not found") ||
        error.message.includes("Not found"))
    ) {
      console.log(`🔍 Safe message not found for hash: ${messageHash}`);
      return null;
    }

    return null;
  }
}

export async function isValidSafeSignature(
  provider: ethers.providers.Provider,
  safeAddress: string,
  messageHash: string,
  signature: string
): Promise<boolean> {
  try {
    const safeContract = new ethers.Contract(
      safeAddress,
      [
        "function isValidSignature(bytes32 _dataHash, bytes _signature) view returns (bytes4)",
      ],
      provider
    );

    const magicValue = await safeContract.isValidSignature(
      messageHash,
      signature
    );
    return magicValue === "0x1626ba7e";
  } catch (error) {
    console.error("Error validating Safe signature:", error);
    return false;
  }
}

export function generateSafeMessageHash(message: string): string {
  const messageHash = keccak256(toUtf8Bytes(message));
  const safeMessageHash = keccak256(
    ethers.utils.solidityPack(
      ["bytes32", "bytes32"],
      [SAFE_MESSAGE_TYPE_HASH, messageHash]
    )
  );
  return safeMessageHash;
}

export async function generateSafeMessageHashWithSDK(
  rpcUrl: string,
  safeAddress: string,
  message: string
): Promise<string> {
  try {
    console.log(
      `🔏 Generating Safe message hash for: ${message.substring(0, 100)}...`
    );

    // For now, use the original method since Safe SDK has complex type requirements
    // The original method generates the correct Safe message hash format
    const messageHash = generateSafeMessageHash(message);
    console.log(`🔏 Generated Safe message hash: ${messageHash}`);

    return messageHash;
  } catch (error) {
    console.error("Error generating Safe message hash:", error);
    // Fallback to the original method
    return generateSafeMessageHash(message);
  }
}

export function createParametersHash(
  toolIpfsCid: string,
  toolParams: any,
  agentWalletAddress: string
): string {
  const data = {
    toolIpfsCid,
    toolParams,
    agentWalletAddress,
  };

  return keccak256(toUtf8Bytes(JSON.stringify(data)));
}

/**
 * Get Safe threshold from contract
 */
export async function getSafeThreshold(
  provider: ethers.providers.Provider,
  safeAddress: string
): Promise<number> {
  try {
    const safeContract = new ethers.Contract(
      safeAddress,
      ["function getThreshold() view returns (uint256)"],
      provider
    );

    const threshold = await safeContract.getThreshold();
    return threshold.toNumber();
  } catch (error) {
    console.error("Error getting Safe threshold:", error);
    throw new Error(
      `Failed to get Safe threshold: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate a unique nonce based on current timestamp and random value
 */
export function generateNonce(): bigint {
  const timestamp = BigInt(Date.now());
  const random = BigInt(Math.floor(Math.random() * 1000000));
  return timestamp * 1000000n + random;
}

/**
 * Generate expiry timestamp (default: 1 hour from now)
 */
export function generateExpiry(hoursFromNow: number = 1): bigint {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + hoursFromNow * 3600;
  return BigInt(expiry);
}

export function buildEIP712Signature(
  confirmations: Array<{ signature?: string }>
): string {
  const signatures = confirmations
    .filter((conf) => conf.signature)
    .map((conf) => conf.signature!.slice(2))
    .sort()
    .join("");

  return "0x" + signatures;
}
