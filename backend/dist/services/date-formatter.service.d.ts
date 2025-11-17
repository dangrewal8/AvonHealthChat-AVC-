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
declare class DateFormatter {
    /**
     * Month names (full)
     */
    private readonly MONTHS;
    /**
     * Month names (short)
     */
    private readonly SHORT_MONTHS;
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
    formatRelative(isoDate: string, referenceDate?: Date): string;
    /**
     * Format date as absolute (month day, year)
     *
     * @param isoDate - ISO 8601 date string
     * @param format - 'short' or 'long'
     * @returns Formatted absolute date
     */
    formatAbsolute(isoDate: string, format?: 'short' | 'long'): string;
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
    getRelativeTimeString(milliseconds: number): string;
    /**
     * Format date with time
     *
     * @param isoDate - ISO 8601 date string
     * @param format - 'short' or 'long'
     * @returns Date with time
     */
    formatDateTime(isoDate: string, format?: 'short' | 'long'): string;
    /**
     * Format date as ISO 8601 date only (YYYY-MM-DD)
     *
     * @param isoDate - ISO 8601 date string
     * @returns ISO date string (YYYY-MM-DD)
     */
    formatISODate(isoDate: string): string;
    /**
     * Format date range
     *
     * @param startDate - Start date (ISO 8601)
     * @param endDate - End date (ISO 8601)
     * @param format - 'short' or 'long'
     * @returns Formatted date range
     */
    formatDateRange(startDate: string, endDate: string, format?: 'short' | 'long'): string;
    /**
     * Check if date is today
     *
     * @param isoDate - ISO 8601 date string
     * @param referenceDate - Reference date (default: now)
     * @returns True if date is today
     */
    isToday(isoDate: string, referenceDate?: Date): boolean;
    /**
     * Check if date is yesterday
     *
     * @param isoDate - ISO 8601 date string
     * @param referenceDate - Reference date (default: now)
     * @returns True if date is yesterday
     */
    isYesterday(isoDate: string, referenceDate?: Date): boolean;
    /**
     * Get time ago (human-readable)
     *
     * Similar to formatRelative but always returns relative format
     *
     * @param isoDate - ISO 8601 date string
     * @param referenceDate - Reference date (default: now)
     * @returns Relative time string
     */
    getTimeAgo(isoDate: string, referenceDate?: Date): string;
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
    };
    /**
     * Explain date formatter
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const dateFormatter: DateFormatter;
export default dateFormatter;
//# sourceMappingURL=date-formatter.service.d.ts.map