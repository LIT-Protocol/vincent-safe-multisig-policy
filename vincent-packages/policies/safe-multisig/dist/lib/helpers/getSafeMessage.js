export async function getSafeMessage({ safeTransactionServiceUrl, safeAddress, messageHash, safeApiKey, }) {
    try {
        console.log(`🔍 Checking Safe message with hash: ${messageHash}`);
        console.log(`🔍 Using Safe address: ${safeAddress}`);
        console.log(`🔍 Using Safe transaction service URL: ${safeTransactionServiceUrl}`);
        const url = `${safeTransactionServiceUrl}/api/v1/messages/${messageHash}/`;
        console.log(`🔍 Fetching from URL: ${url}`);
        const headers = {
            Accept: "application/json",
            "content-type": "application/json",
        };
        // Add API key if provided
        if (safeApiKey) {
            headers["Authorization"] = `Bearer ${safeApiKey}`;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            if (response.status === 404) {
                console.log(`🔍 Safe message not found for hash: ${messageHash}`);
                return null;
            }
            throw new Error(`Failed to fetch Safe message: ${response.status} ${response.statusText}`);
        }
        const message = await response.json();
        console.log(`✅ Found Safe message:`, message);
        // Verify the message is for the correct Safe
        if (message.safe &&
            message.safe.toLowerCase() !== safeAddress.toLowerCase()) {
            console.log(`⚠️ Message found but for different Safe. Expected: ${safeAddress}, Got: ${message.safe}`);
            return null;
        }
        return message;
    }
    catch (error) {
        console.error("Error checking Safe message:", error);
        return null;
    }
}
