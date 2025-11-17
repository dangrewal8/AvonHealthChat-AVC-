/**
 * Date Formatter Service
 *
 * Format dates per ChatGPT specification.
 *
 * ChatGPT Requirements:
 * - "Show relative dates for recent items ('2 days ago')"
 * - "Fall back to absolute dates for older items"
 *
 * Features:
 * - Relative dates for last 7 days
 * - Absolute dates for older items
 * - Built-in Date object only
 * - No external date libraries
 *
 * NO moment.js, date-fns, or other date libraries
 */

/**
 * Date Formatter Class
 *
 * Format dates as relative or absolute per ChatGPT specification
 */
class DateFormatter {
  /**
   * Month names (full)
   */
  private readonly MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  /**
   * Month names (short)
   */
  private readonly SHORT_MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  /**
   * Format date as relative or absolute
   *
   * Per ChatGPT Spec:
   * - Relative for last 7 days ('2 days ago', 'yesterday', etc.)
   * - Absolute for older dates ('January 15, 2025', etc.)
   *
   * @param isoDate - ISO 8601 date string
   * @param referenceDate - Reference date (default: now)
   * @returns Formatted date string
   */
  formatRelative(isoDate: string, referenceDate: Date = new Date()): string {
    const date = new Date(isoDate);
    const diffMs = referenceDate.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Use relative for last 7 days
    if (diffDays < 7 && diffMs >= 0) {
      return this.getRelativeTimeString(diffMs);
    }

    // Use absolute for older dates
    return this.formatAbsolute(isoDate, 'long');
  }

  /**
   * Format date as absolute (month day, year)
   *
   * @param isoDate - ISO 8601 date string
   * @param format - 'short' or 'long'
   * @returns Formatted absolute date
   */
  formatAbsolute(isoDate: string, format: 'short' | 'long' = 'long'): string {
    const date = new Date(isoDate);

    const month =
      format === 'long'
        ? this.MONTHS[date.getMonth()]
        : this.SHORT_MONTHS[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    // Both short and long use same format: "Month Day, Year"
    return `${month} ${day}, ${year}`;
  }

  /**
   * Get relative time string
   *
   * Per ChatGPT Spec:
   * - "just now" (< 1 minute)
   * - "X minute(s) ago" (< 1 hour)
   * - "X hour(s) ago" (< 1 day)
   * - "yesterday" (1 day)
   * - "X days ago" (< 7 days)
   *
   * @param milliseconds - Time difference in milliseconds
   * @returns Relative time string
   */
  getRelativeTimeString(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days === 1) {
      return 'yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    }

    // Fallback (should not reach here in normal usage)
    return '';
  }

  /**
   * Format date with time
   *
   * @param isoDate - ISO 8601 date string
   * @param format - 'short' or 'long'
   * @returns Date with time
   */
  formatDateTime(isoDate: string, format: 'short' | 'long' = 'long'): string {
    const date = new Date(isoDate);

    const dateStr = this.formatAbsolute(isoDate, format);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${dateStr} at ${displayHours}:${minutes} ${ampm}`;
  }

  /**
   * Format date as ISO 8601 date only (YYYY-MM-DD)
   *
   * @param isoDate - ISO 8601 date string
   * @returns ISO date string (YYYY-MM-DD)
   */
  formatISODate(isoDate: string): string {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Format date range
   *
   * @param startDate - Start date (ISO 8601)
   * @param endDate - End date (ISO 8601)
   * @param format - 'short' or 'long'
   * @returns Formatted date range
   */
  formatDateRange(
    startDate: string,
    endDate: string,
    format: 'short' | 'long' = 'long'
  ): string {
    const start = this.formatAbsolute(startDate, format);
    const end = this.formatAbsolute(endDate, format);

    if (start === end) {
      return start;
    }

    return `${start} - ${end}`;
  }

  /**
   * Check if date is today
   *
   * @param isoDate - ISO 8601 date string
   * @param referenceDate - Reference date (default: now)
   * @returns True if date is today
   */
  isToday(isoDate: string, referenceDate: Date = new Date()): boolean {
    const date = new Date(isoDate);

    return (
      date.getFullYear() === referenceDate.getFullYear() &&
      date.getMonth() === referenceDate.getMonth() &&
      date.getDate() === referenceDate.getDate()
    );
  }

  /**
   * Check if date is yesterday
   *
   * @param isoDate - ISO 8601 date string
   * @param referenceDate - Reference date (default: now)
   * @returns True if date is yesterday
   */
  isYesterday(isoDate: string, referenceDate: Date = new Date()): boolean {
    const date = new Date(isoDate);
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);

    return (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    );
  }

  /**
   * Get time ago (human-readable)
   *
   * Similar to formatRelative but always returns relative format
   *
   * @param isoDate - ISO 8601 date string
   * @param referenceDate - Reference date (default: now)
   * @returns Relative time string
   */
  getTimeAgo(isoDate: string, referenceDate: Date = new Date()): string {
    const date = new Date(isoDate);
    const diffMs = referenceDate.getTime() - date.getTime();

    return this.getRelativeTimeString(diffMs);
  }

  /**
   * Format for provenance (ChatGPT use case)
   *
   * Shows relative date for recent items, absolute for older
   *
   * @param isoDate - ISO 8601 date string (occurred_at)
   * @returns Formatted date for UI
   */
  formatForProvenance(isoDate: string): {
    display: string;
    relative: string;
    absolute: string;
    iso: string;
  } {
    return {
      display: this.formatRelative(isoDate),
      relative: this.getTimeAgo(isoDate),
      absolute: this.formatAbsolute(isoDate, 'short'),
      iso: this.formatISODate(isoDate),
    };
  }

  /**
   * Explain date formatter
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Date Formatter:

ChatGPT Requirements:
✓ Show relative dates for recent items ('2 days ago')
✓ Fall back to absolute dates for older items

Features:
- Relative for last 7 days
- Absolute for older dates
- Built-in Date object only
- No external libraries

Relative Formats:
  < 1 minute: "just now"
  < 1 hour: "X minute(s) ago"
  < 1 day: "X hour(s) ago"
  1 day: "yesterday"
  < 7 days: "X days ago"

Absolute Formats:
  Short: "Jan 15, 2025"
  Long: "January 15, 2025"

Usage:
  const formatted = dateFormatter.formatRelative(isoDate);
  const absolute = dateFormatter.formatAbsolute(isoDate, 'short');

Tech Stack: Node.js + TypeScript (built-in Date object ONLY)
NO moment.js, date-fns, or other date libraries`;
  }
}

// Export singleton instance
const dateFormatter = new DateFormatter();
export default dateFormatter;
