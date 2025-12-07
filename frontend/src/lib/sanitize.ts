/**
 * Input Sanitization Utilities
 *
 * Prevents XSS attacks by sanitizing user input.
 * Uses browser's built-in DOMParser for HTML sanitization.
 */

/**
 * Sanitize HTML content by removing script tags and dangerous attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.textContent = input; // This escapes all HTML
  return temp.innerHTML;
}

/**
 * Sanitize text input by trimming and removing control characters
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  return input
    .trim()
    // Remove control characters (except newline and tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Sanitize user name input
 */
export function sanitizeName(input: string): string {
  if (!input) return '';

  return sanitizeText(input)
    // Remove any HTML tags
    .replace(/<[^>]*>/g, '')
    // Limit length
    .substring(0, 100);
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .toLowerCase()
    // Remove any characters that aren't valid in email addresses
    .replace(/[^a-z0-9@._+-]/g, '')
    .substring(0, 254); // Max email length per RFC
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: string): string {
  if (!input) return '';

  const trimmed = input.trim();

  // Only allow http(s) protocols
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    return url.toString();
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(input: string | number, options?: { min?: number; max?: number }): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) return 0;

  let result = num;

  if (options?.min !== undefined) {
    result = Math.max(result, options.min);
  }

  if (options?.max !== undefined) {
    result = Math.min(result, options.max);
  }

  return result;
}

/**
 * Sanitize array of strings (e.g., tags, hobbies)
 */
export function sanitizeStringArray(input: string[]): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0)
    // Remove duplicates
    .filter((item, index, self) => self.indexOf(item) === index)
    // Limit array size
    .slice(0, 50);
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const key in obj) {
    // Skip prototype properties and dangerous keys
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      key !== '__proto__' &&
      key !== 'constructor' &&
      key !== 'prototype'
    ) {
      sanitized[key] = obj[key];
    }
  }

  return sanitized as T;
}
