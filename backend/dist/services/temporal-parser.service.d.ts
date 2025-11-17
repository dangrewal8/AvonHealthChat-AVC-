/**
 * Temporal Query Parser Service
 *
 * Extracts time-related information from natural language queries using chrono-node
 *
 * Features:
 * - Parse temporal phrases from queries
 * - Extract date ranges (from/to dates)
 * - Parse relative time expressions
 * - Handle medical temporal phrases
 *
 */
/**
 * Temporal filter result
 */
export interface TemporalFilter {
    dateFrom: string;
    dateTo: string;
    timeReference: string;
    relativeType?: 'days' | 'weeks' | 'months' | 'years';
    amount?: number;
}
/**
 * Relative time information
 */
export interface RelativeTimeInfo {
    type: 'days' | 'weeks' | 'months' | 'years';
    amount: number;
    direction: 'past' | 'future';
    reference: string;
}
/**
 * Date range result
 */
export interface DateRange {
    from: Date;
    to: Date;
    reference: string;
}
/**
 * Temporal Parser Class
 *
 * Parses natural language temporal expressions from medical queries
 */
declare class TemporalParser {
    /**
     * Parse a query to extract temporal filter
     *
     * @param query - Natural language query
     * @returns Temporal filter or null if no temporal info found
     *
     * @example
     * parseQuery("Show me visits in the last 3 months")
     * // Returns: {
     * //   dateFrom: "2024-07-15T00:00:00.000Z",
     * //   dateTo: "2024-10-15T23:59:59.999Z",
     * //   timeReference: "in the last 3 months",
     * //   relativeType: "months",
     * //   amount: 3
     * // }
     */
    parseQuery(query: string): TemporalFilter | null;
    /**
     * Extract date range from query
     *
     * @param query - Natural language query
     * @returns Date range or null if not found
     *
     * @example
     * extractDateRange("between June and August")
     * // Returns: {
     * //   from: Date("2024-06-01"),
     * //   to: Date("2024-08-31"),
     * //   reference: "between June and August"
     * // }
     */
    extractDateRange(query: string): DateRange | null;
    /**
     * Parse relative time expression
     *
     * @param query - Natural language query
     * @returns Relative time info or null if not found
     *
     * @example
     * parseRelativeTime("in the last 3 months")
     * // Returns: {
     * //   type: "months",
     * //   amount: 3,
     * //   direction: "past",
     * //   reference: "last 3 months"
     * // }
     */
    parseRelativeTime(query: string): RelativeTimeInfo | null;
    /**
     * Normalize time unit to standard format
     *
     * @param unit - Time unit string
     * @returns Normalized time unit
     */
    private normalizeTimeUnit;
    /**
     * Check if query contains temporal information
     *
     * @param query - Natural language query
     * @returns true if temporal info found
     */
    hasTemporal(query: string): boolean;
    /**
     * Extract all temporal references from query
     *
     * @param query - Natural language query
     * @returns Array of temporal filters (may be multiple)
     */
    parseAll(query: string): TemporalFilter[];
}
declare const temporalParser: TemporalParser;
export default temporalParser;
//# sourceMappingURL=temporal-parser.service.d.ts.map