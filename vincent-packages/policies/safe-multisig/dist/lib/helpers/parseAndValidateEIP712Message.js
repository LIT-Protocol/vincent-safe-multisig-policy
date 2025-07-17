export function parseAndValidateEIP712Message({ expectedEip712Message, retrievedEip712Message, }) {
    try {
        const requiredEip712Properties = ['types', 'domain', 'message'];
        for (const property of requiredEip712Properties) {
            if (!(property in retrievedEip712Message)) {
                return {
                    success: false,
                    error: `Missing required property in EIP712 message: ${property}`
                };
            }
        }
        const retrievedEip712MessageDomain = retrievedEip712Message.domain;
        const retrievedEip712MessageTypes = retrievedEip712Message.types;
        const retrievedEip712MessageToolExecution = retrievedEip712Message.message;
        if (!retrievedEip712MessageTypes.VincentToolExecution) {
            return {
                success: false,
                error: "Missing VincentToolExecution type in EIP712 message"
            };
        }
        const expectedEip712MessageToolExecution = expectedEip712Message.message;
        const requiredFields = [
            "appId",
            "appVersion",
            "toolIpfsCid",
            "toolParametersString",
            "agentWalletAddress",
            "expiry",
            "nonce"
        ];
        for (const field of requiredFields) {
            // Check for missing field
            if (!(field in retrievedEip712MessageToolExecution)) {
                return {
                    success: false,
                    error: `Missing required field in EIP712 message: ${field}`
                };
            }
            if ([
                "appId",
                "appVersion",
                "toolIpfsCid",
                "agentWalletAddress",
                "toolParametersString"
            ].includes(field)) {
                if (retrievedEip712MessageToolExecution[field] !== expectedEip712MessageToolExecution[field]) {
                    return {
                        success: false,
                        error: `EIP712 message ${field} does not match expected ${field}`,
                        expected: expectedEip712MessageToolExecution[field],
                        received: retrievedEip712MessageToolExecution[field]
                    };
                }
            }
        }
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const expiry = BigInt(retrievedEip712MessageToolExecution.expiry);
        if (expiry <= currentTime) {
            return {
                success: false,
                error: "EIP712 message has expired",
                expected: `> ${currentTime.toString()}`,
                received: expiry.toString()
            };
        }
        console.log("[parseAndValidateEIP712Message] EIP712 message validation passed");
        return {
            success: true,
            validatedEip712Message: retrievedEip712Message
        };
    }
    catch (parseError) {
        console.error("[parseAndValidateEIP712Message] Error parsing EIP712 message:", parseError);
        return {
            success: false,
            error: parseError instanceof Error ? parseError.message : "Unknown parse error"
        };
    }
}
