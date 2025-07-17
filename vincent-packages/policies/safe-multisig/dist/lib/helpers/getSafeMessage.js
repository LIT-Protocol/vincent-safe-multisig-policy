export async function getSafeMessage({ safeTransactionServiceUrl, safeAddress, messageHash, safeApiKey, }) {
    try {
        console.log(`[getSafeMessage] Checking Safe message with hash: ${messageHash}`);
        console.log(`[getSafeMessage] Using Safe address: ${safeAddress}`);
        console.log(`[getSafeMessage] Using Safe transaction service URL: ${safeTransactionServiceUrl}`);
        const url = `${safeTransactionServiceUrl}/api/v1/messages/${messageHash}/`;
        console.log(`[getSafeMessage] Fetching from URL: ${url}`);
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
                console.log(`[getSafeMessage] Safe message not found for hash: ${messageHash}`);
                throw new Error(`[getSafeMessage] Safe message not found for hash: ${messageHash}`);
            }
            throw new Error(`[getSafeMessage] Failed to fetch Safe message: ${response.status} ${response.statusText}`);
        }
        const message = await response.json();
        console.log(`[getSafeMessage] Found Safe message:`, message);
        // Verify the message is for the correct Safe
        if (message.safe &&
            message.safe.toLowerCase() !== safeAddress.toLowerCase()) {
            console.log(`[getSafeMessage] Message found but for different Safe. Expected: ${safeAddress}, Got: ${message.safe}`);
            throw new Error(`[getSafeMessage] Message found but for different Safe. Expected: ${safeAddress}, Got: ${message.safe}`);
        }
        return message;
    }
    catch (error) {
        console.error("[getSafeMessage] Error checking Safe message:", error);
        throw error;
    }
}
