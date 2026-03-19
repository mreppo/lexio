/**
 * Generate a unique identifier.
 * Uses crypto.randomUUID() which is available in all modern browsers and Node 14.17+.
 * The Math.random() fallback has been removed as it is not cryptographically secure
 * and is unnecessary given the app's modern browser target.
 */
export function generateId(): string {
  return crypto.randomUUID()
}
