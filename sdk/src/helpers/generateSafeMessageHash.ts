import { ethers } from "ethers";
import { SafeMessageHashConfig } from "../types";

export function generateSafeMessageHash({
  safeMessageString,
  safeAddress,
  chainId,
}: SafeMessageHashConfig): string {
  const messageHash = ethers.utils.hashMessage(
    ethers.utils.toUtf8Bytes(safeMessageString)
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
    chainId,
    verifyingContract: safeAddress,
  };

  const eip712Payload = ethers.utils._TypedDataEncoder.getPayload(
    domain,
    { SafeMessage: safeMessageTypes.SafeMessage },
    { message: messageHash }
  );
  console.log("[generateSafeMessageHash] eip712Payload: ", eip712Payload);

  return ethers.utils._TypedDataEncoder.hash(
    domain,
    { SafeMessage: safeMessageTypes.SafeMessage },
    { message: messageHash }
  );
}
