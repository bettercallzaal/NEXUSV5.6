/**
 * Link Utilities
 * 
 * Helper functions for working with links.
 */

/**
 * Generate a unique ID for a link
 */
export function generateLinkId(): string {
  return 'link_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Normalize a URL (remove trailing slashes, etc.)
 */
export function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.toString().replace(/\/$/, '');
  } catch (error) {
    // If URL parsing fails, return the original
    return url;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}
