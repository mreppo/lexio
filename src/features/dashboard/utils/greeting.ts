/**
 * Greeting utilities - returns a time-of-day greeting string.
 *
 * Time buckets (local time):
 *   00:00–11:59  → "Good morning!"
 *   12:00–17:59  → "Good afternoon!"
 *   18:00–23:59  → "Good evening!"
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Hour (0–23) at which the greeting switches from morning to afternoon. */
const AFTERNOON_START_HOUR = 12

/** Hour (0–23) at which the greeting switches from afternoon to evening. */
const EVENING_START_HOUR = 18

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Returns a greeting string based on the provided hour (0–23).
 * Injectable for testing without real clock access.
 *
 * @param hour - The current hour in local time (0–23).
 * @returns A greeting string.
 */
export function getGreetingForHour(hour: number): string {
  if (hour < AFTERNOON_START_HOUR) return 'Good morning!'
  if (hour < EVENING_START_HOUR) return 'Good afternoon!'
  return 'Good evening!'
}

/**
 * Returns a greeting string based on the current local time.
 */
export function getCurrentGreeting(): string {
  return getGreetingForHour(new Date().getHours())
}
