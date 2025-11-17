/**
 * Temporal Parser Service Usage Examples
 *
 * Demonstrates:
 * - Parsing natural language temporal queries
 * - Extracting date ranges
 * - Parsing relative time expressions
 * - Handling medical temporal phrases
 * - Non-temporal query detection
 */

import temporalParser from '../services/temporal-parser.service';

/**
 * Example 1: Relative time expressions ("last X months/weeks/days")
 */
export function exampleRelativeTime() {
  console.log('Example 1: Relative Time Expressions');
  console.log('-'.repeat(80));

  const queries = [
    'Show me visits in the last 3 months',
    'Lab results from the past 2 weeks',
    'Medications prescribed in the last 30 days',
    'Patient encounters in the last year',
  ];

  queries.forEach((query, i) => {
    console.log(`\n  Query ${i + 1}: "${query}"`);

    const filter = temporalParser.parseQuery(query);
    if (filter) {
      console.log('    ✓ Temporal info detected:');
      console.log(`      From: ${filter.dateFrom}`);
      console.log(`      To: ${filter.dateTo}`);
      console.log(`      Reference: "${filter.timeReference}"`);
      if (filter.relativeType && filter.amount) {
        console.log(`      Relative: ${filter.amount} ${filter.relativeType} ago`);
      }
    } else {
      console.log('    ✗ No temporal info found');
    }
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 2: "Since X" patterns
 */
export function exampleSincePatterns() {
  console.log('Example 2: "Since X" Patterns');
  console.log('-'.repeat(80));

  const queries = [
    'All records since January',
    'Blood pressure readings since last month',
    'Medications since June 2024',
    'Changes since yesterday',
  ];

  queries.forEach((query, i) => {
    console.log(`\n  Query ${i + 1}: "${query}"`);

    const filter = temporalParser.parseQuery(query);
    if (filter) {
      console.log('    ✓ Temporal info detected:');
      console.log(`      From: ${filter.dateFrom}`);
      console.log(`      To: ${filter.dateTo}`);
      console.log(`      Reference: "${filter.timeReference}"`);
    } else {
      console.log('    ✗ No temporal info found');
    }
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 3: Date range patterns ("between X and Y")
 */
export function exampleDateRanges() {
  console.log('Example 3: Date Range Patterns');
  console.log('-'.repeat(80));

  const queries = [
    'Visits between June and August',
    'Lab results from March to May 2024',
    'Between January 1st and February 15th',
    'From Monday to Friday',
  ];

  queries.forEach((query, i) => {
    console.log(`\n  Query ${i + 1}: "${query}"`);

    const dateRange = temporalParser.extractDateRange(query);
    if (dateRange) {
      console.log('    ✓ Date range detected:');
      console.log(`      From: ${dateRange.from.toISOString()}`);
      console.log(`      To: ${dateRange.to.toISOString()}`);
      console.log(`      Reference: "${dateRange.reference}"`);
    } else {
      console.log('    ✗ No date range found');
    }
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 4: Specific dates
 */
export function exampleSpecificDates() {
  console.log('Example 4: Specific Dates');
  console.log('-'.repeat(80));

  const queries = [
    'Blood work from yesterday',
    'Appointment on Monday',
    'Visit on January 15th',
    'Results from last Friday',
  ];

  queries.forEach((query, i) => {
    console.log(`\n  Query ${i + 1}: "${query}"`);

    const filter = temporalParser.parseQuery(query);
    if (filter) {
      console.log('    ✓ Temporal info detected:');
      console.log(`      From: ${filter.dateFrom}`);
      console.log(`      To: ${filter.dateTo}`);
      console.log(`      Reference: "${filter.timeReference}"`);
    } else {
      console.log('    ✗ No temporal info found');
    }
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 5: "This X" patterns
 */
export function exampleThisPatterns() {
  console.log('Example 5: "This X" Patterns');
  console.log('-'.repeat(80));

  const queries = [
    'All visits this year',
    'Lab results this month',
    'Medications prescribed this week',
    'Encounters this quarter',
  ];

  queries.forEach((query, i) => {
    console.log(`\n  Query ${i + 1}: "${query}"`);

    const filter = temporalParser.parseQuery(query);
    if (filter) {
      console.log('    ✓ Temporal info detected:');
      console.log(`      From: ${filter.dateFrom}`);
      console.log(`      To: ${filter.dateTo}`);
      console.log(`      Reference: "${filter.timeReference}"`);
    } else {
      console.log('    ✗ No temporal info found');
    }
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 6: "X ago" patterns
 */
export function exampleAgoPatterns() {
  console.log('Example 6: "X Ago" Patterns');
  console.log('-'.repeat(80));

  const queries = [
    'Visit from 2 weeks ago',
    'Lab results 3 days ago',
    'Medication change 1 month ago',
    'Blood pressure reading 5 days ago',
  ];

  queries.forEach((query, i) => {
    console.log(`\n  Query ${i + 1}: "${query}"`);

    const filter = temporalParser.parseQuery(query);
    if (filter) {
      console.log('    ✓ Temporal info detected:');
      console.log(`      From: ${filter.dateFrom}`);
      console.log(`      To: ${filter.dateTo}`);
      console.log(`      Reference: "${filter.timeReference}"`);
    } else {
      console.log('    ✗ No temporal info found');
    }
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 7: Parsing relative time info
 */
export function exampleRelativeTimeInfo() {
  console.log('Example 7: Relative Time Information');
  console.log('-'.repeat(80));

  const queries = [
    'in the last 3 months',
    'past 2 weeks',
    '6 days ago',
    'next 30 days',
    'since January',
  ];

  queries.forEach((query, i) => {
    console.log(`\n  Query ${i + 1}: "${query}"`);

    const relativeInfo = temporalParser.parseRelativeTime(query);
    if (relativeInfo) {
      console.log('    ✓ Relative time detected:');
      console.log(`      Type: ${relativeInfo.type}`);
      console.log(`      Amount: ${relativeInfo.amount}`);
      console.log(`      Direction: ${relativeInfo.direction}`);
      console.log(`      Reference: "${relativeInfo.reference}"`);
    } else {
      console.log('    ✗ No relative time found');
    }
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 8: Non-temporal queries (should return null)
 */
export function exampleNonTemporal() {
  console.log('Example 8: Non-Temporal Queries');
  console.log('-'.repeat(80));

  const queries = [
    'What medications is the patient on?',
    'Show me all lab results',
    'Patient vital signs',
    'Current diagnoses',
  ];

  console.log('  Testing non-temporal queries (should all return null):\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const filter = temporalParser.parseQuery(query);
    if (filter) {
      console.log('    ✗ Unexpected: Temporal info detected');
      console.log(`      Reference: "${filter.timeReference}"`);
    } else {
      console.log('    ✓ Correctly identified as non-temporal');
    }
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 9: Medical temporal phrases
 */
export function exampleMedicalPhrases() {
  console.log('Example 9: Medical Temporal Phrases');
  console.log('-'.repeat(80));

  const queries = [
    'HbA1c results in the last 3 months',
    'Blood pressure readings since last visit',
    'Medication changes between June and August',
    'Post-operative visits from yesterday',
    'Lab work this year',
    'Imaging studies from two weeks ago',
  ];

  console.log('  Testing medical-specific temporal queries:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const filter = temporalParser.parseQuery(query);
    if (filter) {
      console.log('    ✓ Temporal info detected:');
      console.log(`      From: ${new Date(filter.dateFrom).toLocaleDateString()}`);
      console.log(`      To: ${new Date(filter.dateTo).toLocaleDateString()}`);
      console.log(`      Reference: "${filter.timeReference}"`);
      if (filter.relativeType && filter.amount) {
        console.log(`      Relative: ${filter.amount} ${filter.relativeType}`);
      }
    } else {
      console.log('    ✗ No temporal info found');
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Checking for temporal information
 */
export function exampleHasTemporal() {
  console.log('Example 10: Checking for Temporal Information');
  console.log('-'.repeat(80));

  const queries = [
    { query: 'Visits in the last month', expected: true },
    { query: 'Current medications', expected: false },
    { query: 'Lab results since January', expected: true },
    { query: 'Patient demographics', expected: false },
  ];

  console.log('  Testing hasTemporal() method:\n');

  queries.forEach(({ query, expected }, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const hasTemporal = temporalParser.hasTemporal(query);
    const result = hasTemporal === expected ? '✓' : '✗';

    console.log(`    ${result} hasTemporal: ${hasTemporal} (expected: ${expected})\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Parsing multiple temporal references
 */
export function exampleMultipleTemporal() {
  console.log('Example 11: Multiple Temporal References');
  console.log('-'.repeat(80));

  const queries = [
    'Compare visits from January to March with visits from June to August',
    'Lab results on Monday and Friday',
  ];

  console.log('  Testing parseAll() for multiple temporal references:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const filters = temporalParser.parseAll(query);
    console.log(`    Found ${filters.length} temporal reference(s):\n`);

    filters.forEach((filter, j) => {
      console.log(`    Reference ${j + 1}:`);
      console.log(`      From: ${new Date(filter.dateFrom).toLocaleDateString()}`);
      console.log(`      To: ${new Date(filter.dateTo).toLocaleDateString()}`);
      console.log(`      Text: "${filter.timeReference}"`);
      console.log('');
    });
  });

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('TEMPORAL PARSER SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleRelativeTime();
    exampleSincePatterns();
    exampleDateRanges();
    exampleSpecificDates();
    exampleThisPatterns();
    exampleAgoPatterns();
    exampleRelativeTimeInfo();
    exampleNonTemporal();
    exampleMedicalPhrases();
    exampleHasTemporal();
    exampleMultipleTemporal();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
