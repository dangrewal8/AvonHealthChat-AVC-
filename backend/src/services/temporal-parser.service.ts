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

import * as chrono from 'chrono-node';

/**
 * Temporal filter result
 */
export interface TemporalFilter {
  dateFrom: string; // ISO 8601 format
  dateTo: string; // ISO 8601 format
  timeReference: string; // Original text matched
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
  reference: string; // Original text
}

/**
 * Date range result
 */
export interface DateRange {
  from: Date;
  to: Date;
  reference: string; // Original text
}

/**
 * Temporal Parser Class
 *
 * Parses natural language temporal expressions from medical queries
 */
class TemporalParser {
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
  parseQuery(query: string): TemporalFilter | null {
    if (!query || query.trim().length === 0) {
      return null;
    }

    // Try to parse with chrono-node
    const results = chrono.parse(query);

    if (results.length === 0) {
      return null;
    }

    // Extract relative time info for additional context
    const relativeInfo = this.parseRelativeTime(query);

    // Get the first (most confident) parse result
    const result = results[0];
    const matchedText = result.text;

    // Determine date range
    let dateFrom: Date;
    let dateTo: Date;

    if (result.start && result.end) {
      // Range specified (e.g., "between June and August")
      dateFrom = result.start.date();
      dateTo = result.end.date();

      // Set to end of day for 'to' date
      dateTo.setHours(23, 59, 59, 999);
    } else if (result.start) {
      // Single date or implicit range
      const parsedDate = result.start.date();

      // Check for "last X" or "past X" patterns
      const lastPattern = /\b(?:last|past|previous)\s+(\d+)\s+(day|week|month|year)s?\b/i;
      const lastMatch = query.match(lastPattern);

      if (lastMatch) {
        const amount = parseInt(lastMatch[1], 10);
        const unit = lastMatch[2].toLowerCase() as 'day' | 'week' | 'month' | 'year';

        dateTo = new Date();
        dateTo.setHours(23, 59, 59, 999);

        dateFrom = new Date(dateTo);
        switch (unit) {
          case 'day':
            dateFrom.setDate(dateFrom.getDate() - amount);
            break;
          case 'week':
            dateFrom.setDate(dateFrom.getDate() - amount * 7);
            break;
          case 'month':
            dateFrom.setMonth(dateFrom.getMonth() - amount);
            break;
          case 'year':
            dateFrom.setFullYear(dateFrom.getFullYear() - amount);
            break;
        }
        dateFrom.setHours(0, 0, 0, 0);
      }
      // Check for "since X" pattern
      else if (query.toLowerCase().includes('since')) {
        dateFrom = parsedDate;
        dateFrom.setHours(0, 0, 0, 0);

        dateTo = new Date();
        dateTo.setHours(23, 59, 59, 999);
      }
      // Check for "this year" or "this month" patterns
      else if (query.toLowerCase().includes('this year')) {
        dateFrom = new Date(parsedDate.getFullYear(), 0, 1, 0, 0, 0, 0);
        dateTo = new Date(parsedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else if (query.toLowerCase().includes('this month')) {
        dateFrom = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1, 0, 0, 0, 0);
        dateTo = new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
      }
      // Check for "X ago" pattern
      else if (query.toLowerCase().includes('ago')) {
        dateTo = new Date();
        dateTo.setHours(23, 59, 59, 999);

        // Use the parsed date as the start
        dateFrom = parsedDate;
        dateFrom.setHours(0, 0, 0, 0);
      }
      // Default: single day range
      else {
        dateFrom = new Date(parsedDate);
        dateFrom.setHours(0, 0, 0, 0);

        dateTo = new Date(parsedDate);
        dateTo.setHours(23, 59, 59, 999);
      }
    } else {
      return null;
    }

    // Build temporal filter
    const filter: TemporalFilter = {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      timeReference: matchedText,
    };

    // Add relative time info if available
    if (relativeInfo) {
      filter.relativeType = relativeInfo.type;
      filter.amount = relativeInfo.amount;
    }

    return filter;
  }

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
  extractDateRange(query: string): DateRange | null {
    if (!query || query.trim().length === 0) {
      return null;
    }

    const results = chrono.parse(query);

    if (results.length === 0) {
      return null;
    }

    const result = results[0];

    // Need both start and end for a range
    if (!result.start || !result.end) {
      return null;
    }

    const from = result.start.date();
    from.setHours(0, 0, 0, 0);

    const to = result.end.date();
    to.setHours(23, 59, 59, 999);

    return {
      from,
      to,
      reference: result.text,
    };
  }

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
  parseRelativeTime(query: string): RelativeTimeInfo | null {
    if (!query || query.trim().length === 0) {
      return null;
    }

    const lowerQuery = query.toLowerCase();

    // Pattern: "last|past X days|weeks|months|years"
    const pastPattern =
      /\b(?:last|past|previous|in the (?:last|past))\s+(\d+)\s+(day|week|month|year)s?\b/i;
    const pastMatch = query.match(pastPattern);

    if (pastMatch) {
      const amount = parseInt(pastMatch[1], 10);
      const unit = pastMatch[2].toLowerCase();
      const type = this.normalizeTimeUnit(unit);

      return {
        type,
        amount,
        direction: 'past',
        reference: pastMatch[0],
      };
    }

    // Pattern: "X days|weeks|months|years ago"
    const agoPattern = /\b(\d+)\s+(day|week|month|year)s?\s+ago\b/i;
    const agoMatch = query.match(agoPattern);

    if (agoMatch) {
      const amount = parseInt(agoMatch[1], 10);
      const unit = agoMatch[2].toLowerCase();
      const type = this.normalizeTimeUnit(unit);

      return {
        type,
        amount,
        direction: 'past',
        reference: agoMatch[0],
      };
    }

    // Pattern: "next X days|weeks|months|years"
    const futurePattern = /\b(?:next|coming|following)\s+(\d+)\s+(day|week|month|year)s?\b/i;
    const futureMatch = query.match(futurePattern);

    if (futureMatch) {
      const amount = parseInt(futureMatch[1], 10);
      const unit = futureMatch[2].toLowerCase();
      const type = this.normalizeTimeUnit(unit);

      return {
        type,
        amount,
        direction: 'future',
        reference: futureMatch[0],
      };
    }

    // Pattern: "since X" (implicit to now)
    if (lowerQuery.includes('since')) {
      const sinceResults = chrono.parse(query);
      if (sinceResults.length > 0 && sinceResults[0].start) {
        const sinceDate = sinceResults[0].start.date();
        const now = new Date();
        const diffMs = now.getTime() - sinceDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Determine best unit
        if (diffDays >= 365) {
          return {
            type: 'years',
            amount: Math.floor(diffDays / 365),
            direction: 'past',
            reference: `since ${sinceResults[0].text}`,
          };
        } else if (diffDays >= 30) {
          return {
            type: 'months',
            amount: Math.floor(diffDays / 30),
            direction: 'past',
            reference: `since ${sinceResults[0].text}`,
          };
        } else if (diffDays >= 7) {
          return {
            type: 'weeks',
            amount: Math.floor(diffDays / 7),
            direction: 'past',
            reference: `since ${sinceResults[0].text}`,
          };
        } else {
          return {
            type: 'days',
            amount: diffDays,
            direction: 'past',
            reference: `since ${sinceResults[0].text}`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Normalize time unit to standard format
   *
   * @param unit - Time unit string
   * @returns Normalized time unit
   */
  private normalizeTimeUnit(unit: string): 'days' | 'weeks' | 'months' | 'years' {
    const lower = unit.toLowerCase();

    if (lower.startsWith('day')) return 'days';
    if (lower.startsWith('week')) return 'weeks';
    if (lower.startsWith('month')) return 'months';
    if (lower.startsWith('year')) return 'years';

    return 'days'; // Default
  }

  /**
   * Check if query contains temporal information
   *
   * @param query - Natural language query
   * @returns true if temporal info found
   */
  hasTemporal(query: string): boolean {
    return this.parseQuery(query) !== null;
  }

  /**
   * Extract all temporal references from query
   *
   * @param query - Natural language query
   * @returns Array of temporal filters (may be multiple)
   */
  parseAll(query: string): TemporalFilter[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const results = chrono.parse(query);
    const filters: TemporalFilter[] = [];

    for (const result of results) {
      const matchedText = result.text;

      if (result.start) {
        const dateFrom = result.start.date();
        dateFrom.setHours(0, 0, 0, 0);

        let dateTo: Date;
        if (result.end) {
          dateTo = result.end.date();
        } else {
          dateTo = new Date(dateFrom);
        }
        dateTo.setHours(23, 59, 59, 999);

        filters.push({
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString(),
          timeReference: matchedText,
        });
      }
    }

    return filters;
  }
}

// Export singleton instance
const temporalParser = new TemporalParser();
export default temporalParser;
