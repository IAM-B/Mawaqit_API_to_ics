// Utility functions for date formatting and time conversion

/**
 * Format a date for display (e.g.: "Mon 15 Jan")
 */
export function formatDateForDisplay(date) {
  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  };
  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Convert HH:MM time to minutes since midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes to HH:MM time
 */
export function minutesToTime(minutes) {
  if (minutes < 0) {
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    return `-${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
} 