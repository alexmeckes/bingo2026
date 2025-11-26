/**
 * Generate a URL-friendly slug
 */
export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get stored username from localStorage
 */
export function getStoredUsername(): string {
  return localStorage.getItem('bingo2026_username') || '';
}

/**
 * Save username to localStorage
 */
export function saveUsername(username: string): void {
  localStorage.setItem('bingo2026_username', username);
}
