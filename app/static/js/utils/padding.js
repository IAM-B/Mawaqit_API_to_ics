// Centralized padding management (before/after delay)

/**
 * Get padding before (with minimum)
 */
export function getPaddingBefore () {
  const paddingBefore = window.currentPaddingBefore || 0;
  const minPaddingBefore = 0;
  return Math.max(paddingBefore, minPaddingBefore);
}

/**
 * Get padding after (with minimum)
 */
export function getPaddingAfter () {
  const paddingAfter = window.currentPaddingAfter || 0;
  const minPaddingAfter = 20;
  return Math.max(paddingAfter, minPaddingAfter);
}
