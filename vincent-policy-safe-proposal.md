# Vincent Policy: SAFE Multisig Tool Execution

Created by: Wyatt Barnes

GOAL: Create a Vincent Policy that allows a SAFE Multisig to approve the execution of a Vincent Tool with specific parameters

PROPOSAL: Use the [sign message](https://docs.safe.global/sdk-protocol-kit/guides/signatures/messages) flow from SAFE’s Protocol Kit SDK to

1. Create a SAFE Message from an EIP712 typed message ([proposal for structure](https://www.notion.so/Vincent-Policy-SAFE-Multisig-Tool-Execution-2296f449b0418046903dfe5a1e6e6c3f?pvs=21))
2. [Propose](https://docs.safe.global/sdk-protocol-kit/guides/signatures/messages#propose-the-message) the SAFE Message to be signed by the SAFE Owners
   1. We can store the proposed SAFE Message using the [Safe Transaction Service](https://docs.safe.global/core-api/transaction-service-guides/messages)
      1. As far as I can tell, using the SAFE hosted service means the SAFE Messages are available publicly in cleartext for anyone to see. However, the Safe Transaction Service is opensource and deployable, so to support private SAFE Messages we could host the service ourselves connected to a private DB
      2. While the raw SAFE Message is stored and retrievable from the Safe Transaction Service, it [looks like](https://docs.safe.global/core-api/transaction-service-guides/messages#collect-the-missing-signatures) you’re still required to know the raw EIP712 Safe Message in order to request the proposal metadata from and submit a signature to the Safe Transaction Service, so the SAFE owners would need to communicate the raw message amongst themselves before they can sign the proposed message
3. SAFE Owners submit their signature to the Safe Transaction Service, acknowledging their approval of the EIP712 Safe Message
4. Once approval threshold has been met for the SAFE, anyone can execute the Vincent Tool with the parameters as specified by the EIP712 Safe Message
   1. The Vincent Tool will submit it’s given parameters to the SAFE Vincent Policy, and the Policy will take the IPFS CID hash of the Vincent Tool and the rest of the Tool Execution metadata to re-create the EIP712 Safe Message and call the [isValidSignature](https://docs.safe.global/sdk-protocol-kit/guides/signatures/messages#validate-the-signature) method to validate the SAFE Multsig has approved the Vincent Tool to be executed with the given parameters

---

- EIP712 Safe Message Layout Proposal
  ```tsx
  const EIP712_MESSAGE_TYPES = {
    types: {
      VincentToolExecution: [
        { name: "appId", type: "uint256" },
        { name: "appVersion", type: "uint256" },
        { name: "toolIpfsCid", type: "string" },
        { name: "cbor2EncodedParametersHash", type: "string" },
        { name: "agentWalletAddress", type: "string" },
        { name: "expiry", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  ```
  - For the `nonce` I’m not sure how we track consumed EIP712 Safe Messages. Safe’s Transaction Service doesn’t provide a way to mark signed messages as consumed, so it seems like something we might need to track externally in a contract or DB.
    - We could deploy a simple `IsNonceUsed` contract with a mapping: `bytes32 -> bool` that could be used by any Vincent Policy
