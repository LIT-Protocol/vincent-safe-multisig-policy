export function generateNonce(): string {
  // Generate a random nonce using current timestamp and random value
  const timestamp = BigInt(Date.now());
  const randomPart = BigInt(Math.floor(Math.random() * 1000000));
  return (timestamp * 1000000n + randomPart).toString();
}