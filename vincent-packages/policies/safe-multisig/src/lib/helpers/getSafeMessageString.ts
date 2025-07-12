import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES } from "../schemas";
import { deterministicStringify } from "./deterministicStringify";

export type VincentToolExecution = {
    appId: bigint,
    appVersion: bigint,
    toolIpfsCid: string,
    toolParametersString: string,
    agentWalletAddress: string,
    expiry: bigint,
    nonce: bigint,
}

export function getSafeMessageString(
    {
        vincentToolExecution,
        eip712VerifyingContract,
    }: {
        vincentToolExecution: VincentToolExecution,
        eip712VerifyingContract: string,
    }
) {
    const eip712Message = createEIP712Message(eip712VerifyingContract, vincentToolExecution);
    console.log("[getSafeMessageString] eip712Message: ", JSON.stringify(eip712Message, null, 2));
    const messageString = deterministicStringify(eip712Message);
    console.log("[getSafeMessageString] messageString: ", messageString);

    return messageString;
}

function createEIP712Message(
    eip712VerifyingContract: string,
    params: VincentToolExecution
) {
    return {
        types: EIP712_MESSAGE_TYPES,
        domain: {
            ...EIP712_DOMAIN,
            verifyingContract: eip712VerifyingContract,
        },
        primaryType: "VincentToolExecution",
        message: {
            appId: params.appId.toString(),
            appVersion: params.appVersion.toString(),
            toolIpfsCid: params.toolIpfsCid,
            toolParametersString: params.toolParametersString,
            agentWalletAddress: params.agentWalletAddress,
            expiry: params.expiry.toString(),
            nonce: params.nonce.toString(),
        },
    };
}
