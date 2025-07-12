import { ethers } from "ethers";
export async function isValidSafeSignature({ provider, safeAddress, dataHash, signature, }) {
    try {
        const safeContract = new ethers.Contract(safeAddress, [
            "function isValidSignature(bytes32 _dataHash, bytes _signature) view returns (bytes4)",
        ], provider);
        const magicValue = await safeContract.isValidSignature(dataHash, signature);
        console.log("[isValidSafeSignature] isValidSafeSignature contract call returned magicValue: ", magicValue);
        return magicValue === "0x1626ba7e";
    }
    catch (error) {
        console.error("[isValidSafeSignature] Error validating Safe signature:", error);
        return false;
    }
}
