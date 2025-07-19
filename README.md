# Safe Multisig Vincent Policy

This Policy is apart of the [Vincent ecosystem](https://docs.heyvincent.ai/) and is used to enforce Safe Multisig governance over Vincent Tool executions. When paired with Vincent Tools, this Policy restricts the execution of Vincent Tools to only be permitted when a threshold number of Safe signers have approved the execution with a specific set of parameters.

### Key Features

- **Multi-signature Validation**: Requires a threshold number of signatures from Safe wallet owners
- **EIP-712 Message Signing**: Uses typed structured data to define the Vincent Tool execution request
- **Replay Protection**: Implements nonce-based replay attack prevention and tracks message consumption via the [SafeMessageTracker](./contracts/src/SafeMessageTracker.sol) contract
- **Chain-agnostic**: Supports the blockchain networks that are supported by both Lit and Safe

## How It Works

1. **Message Creation**: An execution of a Vincent Tool is encoded as an EIP-712 message
   - Included in this message are properties such as the Vincent App ID and Version the Tool will be executed for, the Vincent Agent Wallet that will be used for signing transactions, and the parameters that will be used to execute the Vincent Tool
2. **Signature Collection**: Safe owners sign the EIP-712 message using their wallets until the threshold number of signatures is reached as defined by the Safe
3. **Vincent Tool Execution**: A Vincent App executes the Vincent Tool on behalf of the Vincent Agent Wallet, with the approved parameters as defined in the EIP-712 message
4. **Validation**: Before the Tool logic is executed, the Vincent system executes the Multisig Policy which performs the following steps to validate whether the Vincent Tool is permitted to execute by the Safe Multisig:
   1. Queries the `SafeMessageTracker` contract to check if the Safe message hash provided to the Tool as a parameter has been marked as consumed for the Vincent Agent Wallet the Tool is being executed on behalf of
   2. Fetches the Safe message from the Safe Transaction Service using the Safe message hash, validating the message exists for the Safe
   3. Validates the Safe message has reached the threshold number of signatures as defined by the Safe
   4. Re-builds the EIP-712 message that represents the Tool execution request using the parameters given to the Tool and the context of what Vincent App the Tool is being executed for - This happens within the Lit Nodes Trusted Execution Environment, preventing tampering or malicious activity
   5. Validates the signed EIP-712 message retrieved from the Safe Transaction Service matches the EIP-712 message that was built in the previous step, this steps also validates:
      - The Tool parameters signed in the EIP-712 message match what was provided to the Vincent Tool
      - The Tool is being executed for the Vincent App Id, App Version, and Agent Wallet Address as defined in the EIP-712 message
      - The EIP-712 message has not expired
   6. Lastly, each signature retrieved from the Safe Transaction Service is validated against the Safe contract to ensure the signature is valid and for the correct Safe address
5. **Allow the Tool execution**: If all the previous steps pass, the Tool execution is permitted and the Tool logic is executed
6. **Mark the Safe message as consumed**: After the Tool is executed, the Safe message is marked as consumed in the `SafeMessageTracker` contract to prevent replay attacks

## How to Use this Policy

Depending on your role in the Vincent ecosystem, there are different steps to use this Policy. Checkout the following guides depending on your role:

- [Vincent Tool Developer](./docs/Guides/VincentToolDeveloper.md)
- [Vincent App Owner](./docs/Guides/VincentAppOwner.md)
- Vincent App User - Coming Soon!

## Testing and Contributing

If you are a developer, or want to run the end-to-end test for this Policy, checkout the [Testing and Contributing](./docs/Guides/TestingAndContributing.md) guide.

## License

This project is licensed under the [MIT License](./LICENSE).
