import { ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES } from "../schemas";
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
export async function checkSafeMessage(provider, safeAddress, messageHash, serviceUrl) {
    try {
        const response = await fetch(`${serviceUrl}/api/v1/safes/${safeAddress}/messages/${messageHash}/`, {
            headers: {
                "Accept": "application/json",
            },
        });
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch Safe message: ${response.statusText}`);
        }
        return await response.json();
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
export function generateSafeMessageHash(message) {
    const messageHash = keccak256(toUtf8Bytes(message));
    const safeMessageHash = keccak256(ethers.utils.solidityPack(["bytes32", "bytes32"], [SAFE_MESSAGE_TYPE_HASH, messageHash]));
    return safeMessageHash;
}
export function createParametersHash(toolIpfsCid, toolParams, agentWalletAddress) {
    const data = {
        toolIpfsCid,
        toolParams,
        agentWalletAddress,
    };
    return keccak256(toUtf8Bytes(JSON.stringify(data)));
}
export async function verifySafeThreshold(provider, safeAddress, requiredThreshold) {
    try {
        const safeContract = new ethers.Contract(safeAddress, ["function getThreshold() view returns (uint256)"], provider);
        const threshold = await safeContract.getThreshold();
        const actualThreshold = threshold.toNumber();
        return {
            valid: actualThreshold >= requiredThreshold,
            actualThreshold,
        };
    }
    catch (error) {
        console.error("Error verifying Safe threshold:", error);
        return { valid: false };
    }
}
export function buildEIP712Signature(confirmations) {
    const signatures = confirmations
        .filter(conf => conf.signature)
        .map(conf => conf.signature.slice(2))
        .sort()
        .join("");
    return "0x" + signatures;
}
