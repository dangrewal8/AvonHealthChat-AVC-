/**
 * Date Formatter Usage Examples
 *
 * Demonstrates:
 * - Relative date formatting
 * - Absolute date formatting
 * - Time ago strings
 * - Date ranges
 * - Provenance formatting
 * - Integration examples
 */

import dateFormatter from '../services/date-formatter.service';

/**
 * Example 1: Relative dates (< 7 days)
 */
export function exampleRelativeDates() {
  console.log('Example 1: Relative Dates (Last 7 Days)');
  console.log('-'.repeat(80));

  const now = new Date('2025-01-24T12:00:00Z');

  const dates = [
    { label: 'Just now', date: '2025-01-24T11:59:30Z' },
    { label: '5 minutes ago', date: '2025-01-24T11:55:00Z' },
    { label: '2 hours ago', date: '2025-01-24T10:00:00Z' },
    { label: 'Yesterday', date: '2025-01-23T12:00:00Z' },
    { label: '3 days ago', date: '2025-01-21T12:00:00Z' },
    { label: '6 days ago', date: '2025-01-18T12:00:00Z' },
  ];

  console.log('  Relative dates:\n');
  dates.forEach(({ label, date }) => {
    const formatted = dateFormatter.formatRelative(date, now);
    console.log(`    ${label}:`);
    console.log(`      Input: ${date}`);
    console.log(`      Output: "${formatted}"\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Absolute dates (>= 7 days)
 */
export function exampleAbsoluteDates() {
  console.log('Example 2: Absolute Dates (7+ Days Ago)');
  console.log('-'.repeat(80));

  const now = new Date('2025-01-24T12:00:00Z');

  const dates = [
    { label: '7 days ago', date: '2025-01-17T12:00:00Z' },
    { label: '30 days ago', date: '2024-12-25T12:00:00Z' },
    { label: '1 year ago', date: '2024-01-24T12:00:00Z' },
  ];

  console.log('  Absolute dates (automatic fallback):\n');
  dates.forEach(({ label, date }) => {
    const formatted = dateFormatter.formatRelative(date, now);
    console.log(`    ${label}:`);
    console.log(`      Input: ${date}`);
    console.log(`      Output: "${formatted}"\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Absolute date formatting (short vs long)
 */
export function exampleAbsoluteFormats() {
  console.log('Example 3: Absolute Date Formats');
  console.log('-'.repeat(80));

  const date = '2025-01-15T10:30:00Z';

  const shortFormat = dateFormatter.formatAbsolute(date, 'short');
  const longFormat = dateFormatter.formatAbsolute(date, 'long');

  console.log('  Date:', date, '\n');
  console.log('  Short format:', `"${shortFormat}"`);
  console.log('  Long format:', `"${longFormat}"\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Time ago (always relative)
 */
export function exampleTimeAgo() {
  console.log('Example 4: Time Ago (Always Relative)');
  console.log('-'.repeat(80));

  const now = new Date('2025-01-24T12:00:00Z');

  const dates = [
    '2025-01-24T11:59:30Z', // Just now
    '2025-01-24T11:30:00Z', // 30 minutes ago
    '2025-01-24T08:00:00Z', // 4 hours ago
    '2025-01-23T12:00:00Z', // Yesterday
    '2025-01-20T12:00:00Z', // 4 days ago
  ];

  console.log('  Time ago strings:\n');
  dates.forEach(date => {
    const timeAgo = dateFormatter.getTimeAgo(date, now);
    console.log(`    ${date} → "${timeAgo}"`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Date with time
 */
export function exampleDateTime() {
  console.log('Example 5: Date with Time');
  console.log('-'.repeat(80));

  const date = '2025-01-15T14:30:00Z';

  const shortDateTime = dateFormatter.formatDateTime(date, 'short');
  const longDateTime = dateFormatter.formatDateTime(date, 'long');

  console.log('  Date:', date, '\n');
  console.log('  Short format:', `"${shortDateTime}"`);
  console.log('  Long format:', `"${longDateTime}"\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Date range formatting
 */
export function exampleDateRange() {
  console.log('Example 6: Date Range Formatting');
  console.log('-'.repeat(80));

  const ranges = [
    {
      label: 'Different dates',
      start: '2025-01-01T00:00:00Z',
      end: '2025-01-31T23:59:59Z',
    },
    {
      label: 'Same date',
      start: '2025-01-15T08:00:00Z',
      end: '2025-01-15T17:00:00Z',
    },
  ];

  console.log('  Date ranges:\n');
  ranges.forEach(({ label, start, end }) => {
    const shortRange = dateFormatter.formatDateRange(start, end, 'short');
    const longRange = dateFormatter.formatDateRange(start, end, 'long');

    console.log(`    ${label}:`);
    console.log(`      Short: "${shortRange}"`);
    console.log(`      Long: "${longRange}"\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 7: ISO date formatting
 */
export function exampleISODate() {
  console.log('Example 7: ISO Date Formatting (YYYY-MM-DD)');
  console.log('-'.repeat(80));

  const dates = [
    '2025-01-15T14:30:00Z',
    '2024-12-25T10:00:00Z',
    '2025-07-04T00:00:00Z',
  ];

  console.log('  ISO dates:\n');
  dates.forEach(date => {
    const iso = dateFormatter.formatISODate(date);
    console.log(`    ${date} → "${iso}"`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Is today / is yesterday
 */
export function exampleIsToday() {
  console.log('Example 8: Is Today / Is Yesterday');
  console.log('-'.repeat(80));

  const now = new Date('2025-01-24T12:00:00Z');

  const dates = [
    { date: '2025-01-24T08:00:00Z', label: 'Today (morning)' },
    { date: '2025-01-24T20:00:00Z', label: 'Today (evening)' },
    { date: '2025-01-23T12:00:00Z', label: 'Yesterday' },
    { date: '2025-01-22T12:00:00Z', label: '2 days ago' },
  ];

  console.log('  Date checks:\n');
  dates.forEach(({ date, label }) => {
    const isToday = dateFormatter.isToday(date, now);
    const isYesterday = dateFormatter.isYesterday(date, now);

    console.log(`    ${label} (${date}):`);
    console.log(`      Is today: ${isToday}`);
    console.log(`      Is yesterday: ${isYesterday}\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Provenance formatting (ChatGPT use case)
 */
export function exampleProvenanceFormatting() {
  console.log('Example 9: Provenance Formatting (ChatGPT Use Case)');
  console.log('-'.repeat(80));

  // Simulated provenance dates
  const provenances = [
    {
      artifact_id: 'note_001',
      occurred_at: '2025-01-24T10:00:00Z', // 2 hours ago
    },
    {
      artifact_id: 'note_002',
      occurred_at: '2025-01-22T14:30:00Z', // 2 days ago
    },
    {
      artifact_id: 'note_003',
      occurred_at: '2024-12-15T09:00:00Z', // Over a month ago
    },
  ];

  console.log('  Provenance dates:\n');
  provenances.forEach(({ artifact_id, occurred_at }) => {
    const formatted = dateFormatter.formatForProvenance(occurred_at);

    console.log(`    ${artifact_id}:`);
    console.log(`      Display (auto): "${formatted.display}"`);
    console.log(`      Relative: "${formatted.relative}"`);
    console.log(`      Absolute: "${formatted.absolute}"`);
    console.log(`      ISO: "${formatted.iso}"\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Medical record dates
 */
export function exampleMedicalRecords() {
  console.log('Example 10: Medical Record Dates');
  console.log('-'.repeat(80));

  const now = new Date('2025-01-24T12:00:00Z');

  const records = [
    {
      type: 'Progress Note',
      date: '2025-01-24T09:30:00Z', // This morning
    },
    {
      type: 'Care Plan',
      date: '2025-01-21T14:00:00Z', // 3 days ago
    },
    {
      type: 'Lab Results',
      date: '2024-11-15T10:00:00Z', // 2 months ago
    },
  ];

  console.log('  Medical record dates:\n');
  records.forEach(({ type, date }) => {
    const display = dateFormatter.formatRelative(date, now);

    console.log(`    ${type}:`);
    console.log(`      Occurred at: ${date}`);
    console.log(`      Display: "${display}"\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Different time zones (all ISO 8601)
 */
export function exampleTimeZones() {
  console.log('Example 11: Time Zones (ISO 8601)');
  console.log('-'.repeat(80));

  const now = new Date('2025-01-24T12:00:00Z');

  const dates = [
    { tz: 'UTC', date: '2025-01-24T10:00:00Z' },
    { tz: 'EST', date: '2025-01-24T10:00:00-05:00' },
    { tz: 'PST', date: '2025-01-24T10:00:00-08:00' },
  ];

  console.log('  Time zone handling (converts to UTC):\n');
  dates.forEach(({ tz, date }) => {
    const formatted = dateFormatter.formatRelative(date, now);

    console.log(`    ${tz} time:`);
    console.log(`      Input: ${date}`);
    console.log(`      Output: "${formatted}"\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Integration with ProvenanceFormatter
 */
export function exampleProvenanceIntegration() {
  console.log('Example 12: Integration with ProvenanceFormatter');
  console.log('-'.repeat(80));

  // Simulated provenance
  const provenance = {
    artifact_id: 'note_123',
    occurred_at: '2025-01-22T14:30:00Z',
    artifact_type: 'note',
    note_title: 'Progress Note',
  };

  // Format for UI (per ChatGPT spec)
  const formatted = dateFormatter.formatForProvenance(provenance.occurred_at);

  console.log('  Provenance:');
  console.log(`    Artifact: ${provenance.artifact_id}`);
  console.log(`    Type: ${provenance.artifact_type}`);
  console.log(`    Title: ${provenance.note_title}\n`);

  console.log('  Formatted dates:');
  console.log(`    Display (UI): "${formatted.display}"`);
  console.log(`    Relative: "${formatted.relative}"`);
  console.log(`    Absolute: "${formatted.absolute}"`);
  console.log(`    ISO: "${formatted.iso}"\n`);

  console.log('  Use case: Show "2 days ago" in UI for recent notes\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 13: Edge cases
 */
export function exampleEdgeCases() {
  console.log('Example 13: Edge Cases');
  console.log('-'.repeat(80));

  const now = new Date('2025-01-24T12:00:00Z');

  const edgeCases = [
    { label: 'Exactly 7 days ago', date: '2025-01-17T12:00:00Z' },
    { label: 'Exactly 1 minute ago', date: '2025-01-24T11:59:00Z' },
    { label: 'Exactly 1 hour ago', date: '2025-01-24T11:00:00Z' },
    { label: 'Future date', date: '2025-01-25T12:00:00Z' },
  ];

  console.log('  Edge cases:\n');
  edgeCases.forEach(({ label, date }) => {
    const formatted = dateFormatter.formatRelative(date, now);

    console.log(`    ${label}:`);
    console.log(`      Input: ${date}`);
    console.log(`      Output: "${formatted}"\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 14: Real-world medical scenario
 */
export function exampleRealWorld() {
  console.log('Example 14: Real-World Medical Scenario');
  console.log('-'.repeat(80));

  const now = new Date('2025-01-24T15:30:00Z');

  // Patient visited this morning
  const visitDate = '2025-01-24T09:00:00Z';

  // Previous visit was last week
  const previousVisit = '2025-01-17T10:00:00Z';

  // Care plan from 2 months ago
  const carePlanDate = '2024-11-20T14:00:00Z';

  console.log('  Medical record timeline:\n');

  console.log("  Today's visit:");
  console.log(`    Occurred: ${visitDate}`);
  console.log(`    Display: "${dateFormatter.formatRelative(visitDate, now)}"\n`);

  console.log('  Previous visit:');
  console.log(`    Occurred: ${previousVisit}`);
  console.log(
    `    Display: "${dateFormatter.formatRelative(previousVisit, now)}"\n`
  );

  console.log('  Care plan created:');
  console.log(`    Occurred: ${carePlanDate}`);
  console.log(
    `    Display: "${dateFormatter.formatRelative(carePlanDate, now)}"\n`
  );

  console.log('  ✅ Success (shows recent as relative, older as absolute)\n');
}

/**
 * Example 15: Explain date formatter
 */
export function exampleExplain() {
  console.log('Example 15: Explain Date Formatter');
  console.log('-'.repeat(80));

  const explanation = dateFormatter.explain();

  console.log(
    '\n' + explanation.split('\n').map(line => `  ${line}`).join('\n')
  );

  console.log('\n  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('DATE FORMATTER EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleRelativeDates();
    exampleAbsoluteDates();
    exampleAbsoluteFormats();
    exampleTimeAgo();
    exampleDateTime();
    exampleDateRange();
    exampleISODate();
    exampleIsToday();
    exampleProvenanceFormatting();
    exampleMedicalRecords();
    exampleTimeZones();
    exampleProvenanceIntegration();
    exampleEdgeCases();
    exampleRealWorld();
    exampleExplain();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
