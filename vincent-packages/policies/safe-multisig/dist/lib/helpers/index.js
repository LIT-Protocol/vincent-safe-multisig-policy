import { ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES, } from "../schemas";
const SAFE_MESSAGE_TYPE_HASH = "0x60b3cbf8b4a223d68d641b3b6ddf9a298e7f33710cf3d3a9d1146b5a6150fbca";
export function createEIP712Message(params) {
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
            expiry: params.expiry,
            nonce: params.nonce,
        },
    };
}
export function hashToolParameters(params) {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
    }, {});
    return keccak256(toUtf8Bytes(JSON.stringify(sortedParams)));
}
export async function checkSafeMessage(provider, safeAddress, messageHash, safeApiKey) {
    try {
        console.log(`🔍 Checking Safe message with hash: ${messageHash}`);
        console.log(`🔍 Using Safe address: ${safeAddress}`);
        // Use the messages endpoint with just the hash (not safe-specific)
        const serviceUrl = "https://safe-transaction-sepolia.safe.global";
        const url = `${serviceUrl}/api/v1/messages/${messageHash}/`;
        console.log(`🔍 Fetching from URL: ${url}`);
        const headers = {
            Accept: "application/json",
            "content-type": "application/json",
        };
        // Add API key if provided
        if (safeApiKey) {
            headers["Authorization"] = `Bearer ${safeApiKey}`;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            if (response.status === 404) {
                console.log(`🔍 Safe message not found for hash: ${messageHash}`);
                return null;
            }
        }
        const message = await response.json();
        console.log(`✅ Found Safe message:`, message);
        // Verify the message is for the correct Safe
        if (message.safe &&
            message.safe.toLowerCase() !== safeAddress.toLowerCase()) {
            console.log(`⚠️ Message found but for different Safe. Expected: ${safeAddress}, Got: ${message.safe}`);
            return null;
        }
        return message;
    }
    catch (error) {
        console.error("Error checking Safe message:", error);
        return null;
    }
}
export async function isValidSafeSignature(provider, safeAddress, dataHash, signature) {
    try {
        const safeContract = new ethers.Contract(safeAddress, [
            "function isValidSignature(bytes32 _dataHash, bytes _signature) view returns (bytes4)",
        ], provider);
        const magicValue = await safeContract.isValidSignature(dataHash, signature);
        return magicValue === "0x1626ba7e";
    }
    catch (error) {
        console.error("Error validating Safe signature:", error);
        return false;
    }
}
export function generateSafeMessageHash(message, safeAddress, chainId) {
    // just testing with eip191 now.  can switch to eip712 later.
    const messageHash = ethers.utils.hashMessage(ethers.utils.toUtf8Bytes(message));
    const safeMessageTypes = {
        EIP712Domain: [
            {
                type: "uint256",
                name: "chainId",
            },
            {
                type: "address",
                name: "verifyingContract",
            },
        ],
        SafeMessage: [{ type: "bytes", name: "message" }],
    };
    const domain = {
        chainId: Number(chainId),
        verifyingContract: safeAddress,
    };
    const eip712Payload = ethers.utils._TypedDataEncoder.getPayload(domain, { SafeMessage: safeMessageTypes.SafeMessage }, { message: messageHash });
    console.log("eip712Payload: ", JSON.stringify(eip712Payload));
    return ethers.utils._TypedDataEncoder.hash(domain, { SafeMessage: safeMessageTypes.SafeMessage }, { message: messageHash });
    // const messageHash = keccak256(toUtf8Bytes(message));
    // const safeMessageHash = keccak256(
    //   ethers.utils.solidityPack(
    //     ["bytes32", "bytes32"],
    //     [SAFE_MESSAGE_TYPE_HASH, messageHash]
    //   )
    // );
    // return safeMessageHash;
}
export function createParametersHash(toolIpfsCid, toolParams, agentWalletAddress) {
    const data = {
        toolIpfsCid,
        toolParams,
        agentWalletAddress,
    };
    console.log("createParametersHash: ", data);
    return keccak256(toUtf8Bytes(JSON.stringify(data)));
}
/**
 * Get Safe threshold from contract
 */
export async function getSafeThreshold(provider, safeAddress) {
    try {
        const safeContract = new ethers.Contract(safeAddress, ["function getThreshold() view returns (uint256)"], provider);
        const threshold = await safeContract.getThreshold();
        return threshold.toNumber();
    }
    catch (error) {
        console.error("Error getting Safe threshold:", error);
        throw new Error(`Failed to get Safe threshold: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
/**
 * Generate a unique nonce based on current timestamp and random value
 */
export function generateNonce() {
    const timestamp = BigInt(Date.now());
    const random = BigInt(Math.floor(Math.random() * 1000000));
    return timestamp * 1000000n + random;
}
/**
 * Generate expiry timestamp (default: 1 hour from now)
 */
export function generateExpiry(hoursFromNow = 1) {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + hoursFromNow * 3600;
    return BigInt(expiry);
}
export function buildEIP712Signature(confirmations) {
    const signatures = confirmations
        .filter((conf) => conf.signature)
        .map((conf) => conf.signature.slice(2))
        .sort()
        .join("");
    return "0x" + signatures;
}
