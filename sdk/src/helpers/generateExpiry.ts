export function generateExpiry(hoursFromNow: number = 24): string {
  // Generate expiry timestamp (default: 24 hours from now)
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + hoursFromNow);
  return Math.floor(expiryDate.getTime() / 1000).toString();
}