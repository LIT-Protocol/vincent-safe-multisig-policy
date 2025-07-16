import { EIP712_DOMAIN, EIP712_MESSAGE_TYPES } from '../constants';
import { VincentToolExecution, EIP712Message, SafeMessageConfig } from '../types';
import { deterministicStringify } from './deterministicStringify';

export function getSafeMessageString({
  vincentToolExecution,
  eip712ChainId,
  eip712VerifyingContract,
}: SafeMessageConfig): string {
  const eip712Message = createEIP712Message(eip712ChainId, eip712VerifyingContract, vincentToolExecution);
  const messageString = deterministicStringify(eip712Message);
  return messageString;
}

function createEIP712Message(
  eip712ChainId: number,
  eip712VerifyingContract: string,
  message: VincentToolExecution
): Omit<EIP712Message, "message"> & { message: VincentToolExecution } {
  return {
    types: {
      VincentToolExecution: [...EIP712_MESSAGE_TYPES.VincentToolExecution]
    },
    domain: {
      ...EIP712_DOMAIN,
      chainId: eip712ChainId,
      verifyingContract: eip712VerifyingContract,
    },
    primaryType: "VincentToolExecution",
    message,
  };
}