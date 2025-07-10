import { ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

export function createParametersHash({
    toolIpfsCid,
    toolParams,
    agentWalletAddress,
}: {
    toolIpfsCid: string;
    toolParams: any;
    agentWalletAddress: string;
}): string {
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
            `Failed to get Safe threshold: ${error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}