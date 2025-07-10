import { ethers } from "ethers";

export function generateSafeMessageHash(
    message: string,
    safeAddress: string,
    chainId: string
): string {
    const messageHash = ethers.utils.hashMessage(
        ethers.utils.toUtf8Bytes(message)
    );

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

    const eip712Payload = ethers.utils._TypedDataEncoder.getPayload(
        domain,
        { SafeMessage: safeMessageTypes.SafeMessage },
        { message: messageHash }
    );
    console.log("eip712Payload: ", eip712Payload);

    return ethers.utils._TypedDataEncoder.hash(
        domain,
        { SafeMessage: safeMessageTypes.SafeMessage },
        { message: messageHash }
    );
}