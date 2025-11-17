/**
 * Query Expander Service Usage Examples
 *
 * Demonstrates:
 * - Basic query expansion
 * - Entity-based expansion
 * - Synonym lookup
 * - Expanded search terms
 * - Integration with entity extractor
 * - Batch expansion
 * - Retrieval optimization
 */

import queryExpander from '../services/query-expander.service';
import entityExtractor from '../services/entity-extractor.service';

/**
 * Example 1: Basic query expansion
 */
export function exampleBasicExpansion() {
  console.log('Example 1: Basic Query Expansion');
  console.log('-'.repeat(80));

  const queries = [
    'Patient with hypertension',
    'Diabetes treatment',
    'Chest pain symptoms',
    'Prescribed ibuprofen',
  ];

  console.log('  Expanding basic queries:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    // Extract entities
    const entities = entityExtractor.extractEntities(query);

    // Expand query
    const expanded = queryExpander.expandQuery(query, entities);

    console.log(`    Expanded to ${expanded.expanded_terms.length} variations:`);
    expanded.expanded_terms.slice(0, 5).forEach((term, j) => {
      console.log(`      ${j + 1}. "${term}"`);
    });

    if (expanded.expanded_terms.length > 5) {
      console.log(`      ... and ${expanded.expanded_terms.length - 5} more`);
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Synonym lookup
 */
export function exampleSynonymLookup() {
  console.log('Example 2: Synonym Lookup');
  console.log('-'.repeat(80));

  const terms = [
    'hypertension',
    'diabetes',
    'ibuprofen',
    'heart attack',
    'shortness of breath',
    'htn',
    'mi',
  ];

  console.log('  Looking up synonyms for medical terms:\n');

  terms.forEach((term, i) => {
    console.log(`  Term ${i + 1}: "${term}"`);

    const synonyms = queryExpander.getMedicalSynonyms(term);

    if (synonyms.length > 0) {
      console.log(`    Synonyms (${synonyms.length}):`);
      synonyms.slice(0, 5).forEach((syn) => {
        console.log(`      - ${syn}`);
      });

      if (synonyms.length > 5) {
        console.log(`      ... and ${synonyms.length - 5} more`);
      }
    } else {
      console.log('    No synonyms found');
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Entity-based expansion
 */
export function exampleEntityBasedExpansion() {
  console.log('Example 3: Entity-Based Expansion');
  console.log('-'.repeat(80));

  const query = 'Patient with diabetes on metformin 500mg twice daily';

  console.log(`  Query: "${query}"\n`);

  // Extract entities
  const entities = entityExtractor.extractEntities(query);

  console.log(`  Extracted ${entities.length} entities:`);
  entities.forEach((entity) => {
    console.log(`    - [${entity.type}] ${entity.text} (normalized: ${entity.normalized})`);
  });
  console.log('');

  // Expand query
  const expanded = queryExpander.expandQuery(query, entities);

  console.log(`  Expanded to ${expanded.expanded_terms.length} variations:`);
  expanded.expanded_terms.forEach((term, i) => {
    console.log(`    ${i + 1}. "${term}"`);
  });
  console.log('');

  console.log('  Synonym map:');
  Object.entries(expanded.synonym_map).forEach(([original, synonyms]) => {
    console.log(`    "${original}" →`);
    synonyms.slice(0, 3).forEach((syn) => {
      console.log(`      - ${syn}`);
    });
    if (synonyms.length > 3) {
      console.log(`      ... and ${synonyms.length - 3} more`);
    }
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Medication query expansion
 */
export function exampleMedicationExpansion() {
  console.log('Example 4: Medication Query Expansion');
  console.log('-'.repeat(80));

  const queries = [
    'Prescribed ibuprofen for pain',
    'Patient on statin therapy',
    'Taking ace inhibitor for hypertension',
    'Started on beta blocker',
  ];

  console.log('  Expanding medication queries:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const entities = entityExtractor.extractEntities(query);
    const expanded = queryExpander.expandQuery(query, entities);

    console.log(`    Original: ${query}`);
    console.log(`    Expansions (${expanded.expanded_terms.length - 1}):`);

    // Show first few expansions (skip original)
    expanded.expanded_terms.slice(1, 4).forEach((term) => {
      console.log(`      - ${term}`);
    });
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Condition query expansion
 */
export function exampleConditionExpansion() {
  console.log('Example 5: Condition Query Expansion');
  console.log('-'.repeat(80));

  const queries = [
    'History of hypertension and diabetes',
    'Patient with CHF and COPD',
    'Recent MI with chest pain',
    'Diagnosed with atrial fibrillation',
  ];

  console.log('  Expanding condition queries:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const entities = entityExtractor.extractEntities(query);
    const expanded = queryExpander.expandQuery(query, entities);

    console.log(`    Entities found: ${entities.length}`);
    console.log(`    Expanded to: ${expanded.expanded_terms.length} variations`);

    if (Object.keys(expanded.synonym_map).length > 0) {
      console.log('    Synonyms used:');
      Object.entries(expanded.synonym_map).forEach(([term, synonyms]) => {
        console.log(`      ${term}: ${synonyms.slice(0, 3).join(', ')}`);
      });
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Expanded search terms with boosting
 */
export function exampleExpandedSearchTerms() {
  console.log('Example 6: Expanded Search Terms with Boosting');
  console.log('-'.repeat(80));

  const terms = [
    'hypertension',
    'diabetes',
    'ibuprofen',
    'chest pain',
    'heart attack',
  ];

  console.log('  Building expanded search terms with query boosting:\n');

  terms.forEach((term, i) => {
    console.log(`  Term ${i + 1}: "${term}"`);

    const synonyms = queryExpander.getMedicalSynonyms(term);
    const searchTerms = queryExpander.buildExpandedSearchTerms(term, synonyms);

    console.log('    Search terms (with boosting):');
    searchTerms.slice(0, 5).forEach((searchTerm) => {
      console.log(`      - ${searchTerm}`);
    });

    if (searchTerms.length > 5) {
      console.log(`      ... and ${searchTerms.length - 5} more`);
    }
    console.log('');
  });

  console.log('  Note: ^2 indicates 2x boost for original term\n');
  console.log('  ✅ Success\n');
}

/**
 * Example 7: Abbreviation expansion
 */
export function exampleAbbreviationExpansion() {
  console.log('Example 7: Abbreviation Expansion');
  console.log('-'.repeat(80));

  const queries = [
    'Patient with HTN and DM',
    'History of MI and CHF',
    'SOB and chest pain',
    'Prescribed NSAID for pain',
  ];

  console.log('  Expanding queries with medical abbreviations:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const entities = entityExtractor.extractEntities(query);
    const expanded = queryExpander.expandQuery(query, entities);

    console.log('    Abbreviations expanded:');
    Object.entries(expanded.synonym_map).forEach(([abbr, full]) => {
      console.log(`      ${abbr} → ${full.slice(0, 2).join(', ')}`);
    });

    console.log(`    Total variations: ${expanded.expanded_terms.length}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Synonym availability check
 */
export function exampleSynonymAvailability() {
  console.log('Example 8: Synonym Availability Check');
  console.log('-'.repeat(80));

  const terms = [
    { term: 'hypertension', expectSynonyms: true },
    { term: 'unusual term', expectSynonyms: false },
    { term: 'diabetes', expectSynonyms: true },
    { term: 'xyz123', expectSynonyms: false },
  ];

  console.log('  Checking synonym availability:\n');

  terms.forEach(({ term, expectSynonyms }, i) => {
    console.log(`  Term ${i + 1}: "${term}"`);

    const hasSynonyms = queryExpander.hasSynonyms(term);
    const synonymCount = queryExpander.getSynonymCount(term);

    console.log(`    Has synonyms: ${hasSynonyms ? 'Yes' : 'No'}`);
    console.log(`    Synonym count: ${synonymCount}`);
    console.log(`    Expected: ${expectSynonyms ? 'Has synonyms' : 'No synonyms'}`);
    console.log(`    Match: ${hasSynonyms === expectSynonyms ? '✓' : '✗'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Batch expansion
 */
export function exampleBatchExpansion() {
  console.log('Example 9: Batch Expansion');
  console.log('-'.repeat(80));

  const queries = [
    'Patient with hypertension',
    'Diabetes management',
    'Prescribed ibuprofen',
    'Recent MI',
  ];

  console.log(`  Expanding ${queries.length} queries in batch:\n`);

  // Prepare batch input
  const batchInput = queries.map((query) => ({
    query,
    entities: entityExtractor.extractEntities(query),
  }));

  // Expand in batch
  const results = queryExpander.expandBatch(batchInput);

  results.forEach((expanded, i) => {
    console.log(`  Result ${i + 1}:`);
    console.log(`    Original: "${expanded.original}"`);
    console.log(`    Expanded to: ${expanded.expanded_terms.length} variations`);
    console.log(`    Synonyms used: ${Object.keys(expanded.synonym_map).length}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Dictionary inspection
 */
export function exampleDictionaryInspection() {
  console.log('Example 10: Dictionary Inspection');
  console.log('-'.repeat(80));

  const allTerms = queryExpander.getAllMedicalTerms();

  console.log(`  Medical synonym dictionary contains ${allTerms.length} terms\n`);

  // Show sample terms
  console.log('  Sample medications:');
  const medications = allTerms.filter(
    (t) => t === 'ibuprofen' || t === 'metformin' || t === 'lisinopril'
  );
  medications.forEach((term) => {
    console.log(`    - ${term} (${queryExpander.getSynonymCount(term)} synonyms)`);
  });
  console.log('');

  console.log('  Sample conditions:');
  const conditions = allTerms.filter(
    (t) => t === 'hypertension' || t === 'diabetes' || t === 'heart failure'
  );
  conditions.forEach((term) => {
    console.log(`    - ${term} (${queryExpander.getSynonymCount(term)} synonyms)`);
  });
  console.log('');

  console.log('  Sample abbreviations:');
  const abbreviations = allTerms.filter((t) => t === 'htn' || t === 'dm' || t === 'mi');
  abbreviations.forEach((term) => {
    console.log(`    - ${term} (${queryExpander.getSynonymCount(term)} synonyms)`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Integration with retrieval
 */
export function exampleRetrievalIntegration() {
  console.log('Example 11: Integration with Retrieval');
  console.log('-'.repeat(80));

  const query = 'Medications for hypertension';

  console.log(`  Query: "${query}"\n`);

  // Extract entities
  const entities = entityExtractor.extractEntities(query);

  // Expand query
  const expanded = queryExpander.expandQuery(query, entities);

  console.log('  Retrieval strategy:');
  console.log(`    1. Generate embeddings for ${expanded.expanded_terms.length} query variations`);
  console.log('    2. Search with each variation');
  console.log('    3. Combine and deduplicate results');
  console.log('    4. Boost results matching original query\n');

  console.log('  Query variations:');
  expanded.expanded_terms.forEach((term, i) => {
    const boost = i === 0 ? ' (original, 2x boost)' : '';
    console.log(`    ${i + 1}. "${term}"${boost}`);
  });
  console.log('');

  console.log('  Benefits:');
  console.log('    - Improved recall (find more relevant results)');
  console.log('    - Handle terminology variations');
  console.log('    - Cover brand names and generic names');
  console.log('    - Expand abbreviations automatically\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Complex medical query expansion
 */
export function exampleComplexQueryExpansion() {
  console.log('Example 12: Complex Medical Query Expansion');
  console.log('-'.repeat(80));

  const query =
    'Patient with type 2 diabetes and hypertension on metformin and lisinopril, ' +
    'presenting with chest pain and shortness of breath';

  console.log(`  Query: "${query}"\n`);

  // Extract entities
  const entities = entityExtractor.extractEntities(query);

  console.log(`  Extracted ${entities.length} entities:`);
  entities.forEach((entity) => {
    console.log(`    - [${entity.type}] ${entity.text}`);
  });
  console.log('');

  // Expand query
  const expanded = queryExpander.expandQuery(query, entities);

  console.log(`  Expanded to ${expanded.expanded_terms.length} variations\n`);

  console.log('  Synonym map:');
  Object.entries(expanded.synonym_map).forEach(([term, synonyms]) => {
    console.log(`    "${term}":`);
    synonyms.slice(0, 3).forEach((syn) => {
      console.log(`      - ${syn}`);
    });
    if (synonyms.length > 3) {
      console.log(`      (${synonyms.length - 3} more...)`);
    }
  });
  console.log('');

  console.log('  Sample expanded queries:');
  expanded.expanded_terms.slice(0, 5).forEach((term, i) => {
    console.log(`    ${i + 1}. "${term.substring(0, 80)}..."`);
  });
  console.log('');

  console.log('  Coverage improvement:');
  console.log(
    `    - Original: 1 query → ${expanded.expanded_terms.length} variations`
  );
  console.log(
    `    - Synonyms: ${Object.keys(expanded.synonym_map).length} terms expanded`
  );
  console.log('    - Expected: 3-5x better recall\n');

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('QUERY EXPANDER SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleBasicExpansion();
    exampleSynonymLookup();
    exampleEntityBasedExpansion();
    exampleMedicationExpansion();
    exampleConditionExpansion();
    exampleExpandedSearchTerms();
    exampleAbbreviationExpansion();
    exampleSynonymAvailability();
    exampleBatchExpansion();
    exampleDictionaryInspection();
    exampleRetrievalIntegration();
    exampleComplexQueryExpansion();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
