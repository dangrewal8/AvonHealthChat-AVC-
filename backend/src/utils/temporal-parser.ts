/**
 * Temporal Expression Parser
 *
 * Parses natural language temporal expressions in queries and returns
 * date ranges in the format specified by requirements: [start, end]
 */

import { subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

/**
 * Parse temporal expression from query string
 *
 * @param query - User query string
 * @returns [startDate, endDate] tuple or null if no temporal expression found
 *
 * Supported patterns:
 * - "past X months/years/days"
 * - "last X weeks/months/years"
 * - "X months ago"
 * - "three months ago" (natural language numbers)
 * - "current" → last 30 days
 * - "historical" → all time (returns null to indicate no filtering)
 * - "last month" → previous calendar month
 * - "last year" → previous calendar year
 */
export function parseTemporalExpression(query: string): [Date, Date] | null {
  const now = new Date();
  const lowerQuery = query.toLowerCase();

  // Pattern 1: "past X days/weeks/months/years"
  const pastPattern = /past\s+(\d+)\s+(day|week|month|year)s?/i;
  let match = pastPattern.exec(lowerQuery);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];

    let start: Date;
    switch (unit) {
      case 'day':
        start = subDays(now, amount);
        break;
      case 'week':
        start = subDays(now, amount * 7);
        break;
      case 'month':
        start = subMonths(now, amount);
        break;
      case 'year':
        start = subYears(now, amount);
        break;
      default:
        start = now;
    }

    return [start, now];
  }

  // Pattern 2: "last X days/weeks/months/years"
  const lastPattern = /last\s+(\d+)\s+(day|week|month|year)s?/i;
  match = lastPattern.exec(lowerQuery);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];

    let start: Date;
    switch (unit) {
      case 'day':
        start = subDays(now, amount);
        break;
      case 'week':
        start = subDays(now, amount * 7);
        break;
      case 'month':
        start = subMonths(now, amount);
        break;
      case 'year':
        start = subYears(now, amount);
        break;
      default:
        start = now;
    }

    return [start, now];
  }

  // Pattern 3: "X months/years ago" (single point in time, converted to range)
  const agoPattern = /(\d+)\s+(month|year)s?\s+ago/i;
  match = agoPattern.exec(lowerQuery);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'month') {
      const targetMonth = subMonths(now, amount);
      return [startOfMonth(targetMonth), endOfMonth(targetMonth)];
    } else if (unit === 'year') {
      const targetYear = subYears(now, amount);
      return [startOfYear(targetYear), endOfYear(targetYear)];
    }
  }

  // Pattern 4: Natural language numbers "three/six/twelve months ago"
  const naturalNumberMap: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
    'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12
  };

  const naturalPattern = /(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(month|year)s?\s+ago/i;
  match = naturalPattern.exec(lowerQuery);
  if (match) {
    const amount = naturalNumberMap[match[1].toLowerCase()];
    const unit = match[2];

    if (unit === 'month') {
      const targetMonth = subMonths(now, amount);
      return [startOfMonth(targetMonth), endOfMonth(targetMonth)];
    } else if (unit === 'year') {
      const targetYear = subYears(now, amount);
      return [startOfYear(targetYear), endOfYear(targetYear)];
    }
  }

  // Pattern 5: "last month" (previous calendar month)
  if (/last\s+month/i.test(lowerQuery)) {
    const lastMonth = subMonths(now, 1);
    return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
  }

  // Pattern 6: "last year" (previous calendar year)
  if (/last\s+year/i.test(lowerQuery)) {
    const lastYear = subYears(now, 1);
    return [startOfYear(lastYear), endOfYear(lastYear)];
  }

  // Pattern 7: "current" → last 30 days
  if (/\bcurrent\b/i.test(lowerQuery)) {
    return [subDays(now, 30), now];
  }

  // Pattern 8: "recent" → last 7 days
  if (/\brecent\b/i.test(lowerQuery)) {
    return [subDays(now, 7), now];
  }

  // Pattern 9: "this month"
  if (/this\s+month/i.test(lowerQuery)) {
    return [startOfMonth(now), now];
  }

  // Pattern 10: "this year"
  if (/this\s+year/i.test(lowerQuery)) {
    return [startOfYear(now), now];
  }

  // Pattern 11: "historical" → no filtering (return null)
  if (/\bhistorical\b/i.test(lowerQuery)) {
    return null;
  }

  // No temporal expression found
  return null;
}

/**
 * Helper function to check if a date is within a date range
 */
export function isDateInRange(date: Date | string, range: [Date, Date]): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const [start, end] = range;

  return checkDate >= start && checkDate <= end;
}

/**
 * Detect if query is asking about changes/modifications
 */
export function isChangeQuery(query: string): boolean {
  const changeKeywords = [
    'change', 'changed', 'changes',
    'modified', 'modify', 'modification',
    'updated', 'update', 'updates',
    'discontinued', 'discontinue',
    'started', 'start',
    'stopped', 'stop',
    'added', 'add',
    'removed', 'remove',
    'new', 'recent'
  ];

  const lowerQuery = query.toLowerCase();
  return changeKeywords.some(keyword => lowerQuery.includes(keyword));
}
