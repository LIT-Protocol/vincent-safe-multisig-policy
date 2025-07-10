import { ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { LIT_CHAINS } from '@lit-protocol/constants';
import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES, } from "../schemas";
export function createEIP712Message(params) {
    return {
        types: EIP712_MESSAGE_TYPES,
        domain: EIP712_DOMAIN,
        primaryType: "VincentToolExecution",
        message: {
            appId: params.appId.toString(),
            appVersion: params.appVersion.toString(),
            toolIpfsCid: params.toolIpfsCid,
            toolParametersHash: params.toolParametersHash,
            agentWalletAddress: params.agentWalletAddress,
            expiry: params.expiry.toString(),
            nonce: params.nonce.toString(),
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
export async function getSafeMessage({ safeTransactionServiceUrl, safeAddress, messageHash, safeApiKey, }) {
    try {
        console.log(`🔍 Checking Safe message with hash: ${messageHash}`);
        console.log(`🔍 Using Safe address: ${safeAddress}`);
        console.log(`🔍 Using Safe transaction service URL: ${safeTransactionServiceUrl}`);
        const url = `${safeTransactionServiceUrl}/api/v1/messages/${messageHash}/`;
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
            throw new Error(`Failed to fetch Safe message: ${response.status} ${response.statusText}`);
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
export async function isValidSafeSignature(provider, safeAddress, messageHash, signature) {
    try {
        const safeContract = new ethers.Contract(safeAddress, [
            "function isValidSignature(bytes32 _dataHash, bytes _signature) view returns (bytes4)",
        ], provider);
        const magicValue = await safeContract.isValidSignature(messageHash, signature);
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
    console.log("eip712Payload: ", eip712Payload);
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
export function createParametersHash({ toolIpfsCid, toolParams, agentWalletAddress, }) {
    const data = {
        toolIpfsCid,
        toolParams,
        agentWalletAddress,
    };
    console.log("createParametersHash data: ", data);
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
/**
 * Parse and validate an EIP712 message using ethers.js
 * @param messageString - The stringified EIP712 message
 * @param expectedToolIpfsCid - Expected tool IPFS CID for validation
 * @param expectedAgentAddress - Expected agent wallet address for validation
 * @returns Validation result with parsed data or error
 */
export function parseAndValidateEIP712Message({ messageString, expectedToolIpfsCid, expectedAgentAddress, expectedAppId, expectedAppVersion, expectedToolParametersHash, }) {
    try {
        const parsedMessage = JSON.parse(messageString);
        console.log("[EIP712 Helper] Parsed EIP712 message:", parsedMessage);
        if (!parsedMessage.types || !parsedMessage.domain || !parsedMessage.message) {
            return {
                success: false,
                error: "Invalid EIP712 message structure - missing types, domain, or message"
            };
        }
        const domain = parsedMessage.domain;
        const types = parsedMessage.types;
        const message = parsedMessage.message;
        if (!types.VincentToolExecution) {
            return {
                success: false,
                error: "Missing VincentToolExecution type in EIP712 message"
            };
        }
        const encodedData = ethers.utils._TypedDataEncoder.encode(domain, types, message);
        console.log("[EIP712 Helper] EIP712 encoded data:", encodedData);
        const requiredFields = ['appId', 'appVersion', 'toolIpfsCid', 'toolParametersHash', 'agentWalletAddress', 'expiry', 'nonce'];
        for (const field of requiredFields) {
            if (!(field in message)) {
                return {
                    success: false,
                    error: `Missing required field in EIP712 message: ${field}`
                };
            }
        }
        if (message.appId !== expectedAppId.toString()) {
            return {
                success: false,
                error: "EIP712 message appId does not match expected appId",
                expected: expectedAppId.toString(),
                received: message.appId
            };
        }
        if (message.appVersion !== expectedAppVersion.toString()) {
            return {
                success: false,
                error: "EIP712 message appVersion does not match expected appVersion",
                expected: expectedAppVersion.toString(),
                received: message.appVersion
            };
        }
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const expiry = BigInt(message.expiry);
        if (expiry <= currentTime) {
            return {
                success: false,
                error: "EIP712 message has expired",
                expected: `> ${currentTime.toString()}`,
                received: expiry.toString()
            };
        }
        if (message.toolIpfsCid !== expectedToolIpfsCid) {
            return {
                success: false,
                error: "EIP712 message toolIpfsCid does not match expected tool",
                expected: expectedToolIpfsCid,
                received: message.toolIpfsCid
            };
        }
        if (message.agentWalletAddress !== expectedAgentAddress) {
            return {
                success: false,
                error: "EIP712 message agentWalletAddress does not match expected agent address",
                expected: expectedAgentAddress,
                received: message.agentWalletAddress
            };
        }
        if (message.toolParametersHash !== expectedToolParametersHash) {
            return {
                success: false,
                error: "EIP712 message toolParametersHash does not match expected tool parameters hash",
                expected: expectedToolParametersHash,
                received: message.toolParametersHash
            };
        }
        console.log("[EIP712 Helper] EIP712 message validation passed");
        return {
            success: true,
            domain,
            types,
            message,
            encodedData
        };
    }
    catch (parseError) {
        console.error("[EIP712 Helper] Error parsing EIP712 message:", parseError);
        return {
            success: false,
            error: parseError instanceof Error ? parseError.message : "Unknown parse error"
        };
    }
}
/**
 * Get RPC URL from LIT chain identifier
 * @param litChainIdentifier - The LIT chain identifier (e.g., 'ethereum', 'polygon', 'sepolia')
 * @returns The RPC URL for the chain
 * @throws Error if chain identifier is not found or has no RPC URL
 */
export function getRpcUrlFromLitChainIdentifier(litChainIdentifier) {
    const chain = LIT_CHAINS[litChainIdentifier];
    if (!chain) {
        throw new Error(`Chain identifier '${litChainIdentifier}' not found in LIT_CHAINS`);
    }
    // Check for rpcUrls property (most common in LIT_CHAINS)
    if (chain.rpcUrls && Array.isArray(chain.rpcUrls) && chain.rpcUrls.length > 0) {
        return chain.rpcUrls[0];
    }
    // If no RPC URL found, provide a helpful error message
    throw new Error(`No RPC URL found for chain identifier '${litChainIdentifier}'. Available properties: ${Object.keys(chain).join(', ')}`);
}
/**
 * Get Safe Transaction Service URL from LIT chain identifier
 * @param litChainIdentifier - The LIT chain identifier (must be a valid key from LIT_CHAINS)
 * @returns The Safe Transaction Service URL for the chain
 * @throws Error if chain identifier is not found or Safe doesn't support the chain
 */
export function getSafeTransactionServiceUrl(litChainIdentifier) {
    const chain = LIT_CHAINS[litChainIdentifier];
    if (!chain) {
        throw new Error(`Chain identifier '${litChainIdentifier}' not supported by Lit`);
    }
    switch (litChainIdentifier) {
        case "arbitrum":
            return "https://safe-transaction-arbitrum.safe.global";
        case "aurora":
            return "https://safe-transaction-aurora.safe.global";
        case "avalanche":
            return "https://safe-transaction-avalanche.safe.global";
        case "base":
            return "https://safe-transaction-base.safe.global";
        case "baseSepolia":
            return "https://safe-transaction-base-sepolia.safe.global";
        case "berachain":
            throw new Error("Berachain is not supported by Lit");
        case "bsc":
            return "https://safe-transaction-bsc.safe.global";
        case "celo":
            return "https://safe-transaction-celo.safe.global";
        case "chiado":
            return "https://safe-transaction-chiado.safe.global";
        case "gnosis-chain":
            throw new Error("Gnosis Chain is not supported by Lit");
        case "hemi":
            throw new Error("Hemi is not supported by Lit");
        case "ink":
            throw new Error("Ink is not supported by Lit");
        case "lens":
            throw new Error("Lens is not supported by Lit");
        case "linea":
            throw new Error("Linea is not supported by Lit");
        case "ethereum":
            return "https://safe-transaction-mainnet.safe.global";
        case "mantle":
            return "https://safe-transaction-mantle.safe.global";
        case "optimism":
            return "https://safe-transaction-optimism.safe.global";
        case "polygon":
            return "https://safe-transaction-polygon.safe.global";
        case "scroll":
            return "https://safe-transaction-scroll.safe.global";
        case "sepolia":
            return "https://safe-transaction-sepolia.safe.global";
        case "sonicMainnet":
            return "https://safe-transaction-sonic.safe.global";
        case "unichain":
            throw new Error("Unichain is not supported by Lit");
        case "worldchain":
            throw new Error("Worldchain is not supported by Lit");
        case "xlayer":
            throw new Error("Xlayer is not supported by Lit");
        case "zkEvm":
            return "https://safe-transaction-zkevm.safe.global";
        case "zksync":
            return "https://safe-transaction-zksync.safe.global";
        default:
            throw new Error(`Safe Transaction Service is not supported for chain identifier '${litChainIdentifier}'`);
    }
}
