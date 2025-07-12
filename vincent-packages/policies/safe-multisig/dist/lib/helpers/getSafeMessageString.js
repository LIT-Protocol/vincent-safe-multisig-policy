import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES } from "../schemas";
import { deterministicStringify } from "./deterministicStringify";
export function getSafeMessageString(vincentToolExecution) {
    const eip712Message = createEIP712Message(vincentToolExecution);
    console.log("[getSafeMessageString] eip712Message: ", JSON.stringify(eip712Message, null, 2));
    const messageString = deterministicStringify(eip712Message);
    console.log("[getSafeMessageString] messageString: ", messageString);
    return messageString;
}
function createEIP712Message(params) {
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
