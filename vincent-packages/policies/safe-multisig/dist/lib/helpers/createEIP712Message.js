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
            toolParametersString: params.toolParametersString,
            agentWalletAddress: params.agentWalletAddress,
            expiry: params.expiry.toString(),
            nonce: params.nonce.toString(),
        },
    };
}
