/**
 * Highlight Generator Usage Examples
 *
 * Demonstrates:
 * - Exact match highlighting
 * - Entity highlighting
 * - Fuzzy matching
 * - Overlapping highlight merging
 * - HTML formatting
 * - Snippet generation
 * - Statistics and analysis
 */

import highlightGenerator from '../services/highlight-generator.service';
import { Entity } from '../services/entity-extractor.service';
import { RetrievalCandidate } from '../services/retriever-agent.service';
import { Chunk } from '../services/metadata-filter.service';

/**
 * Generate sample candidate for testing
 */
function generateSampleCandidate(content: string, chunkId: string = 'chunk_001'): RetrievalCandidate {
  const chunk: Chunk = {
    chunk_id: chunkId,
    artifact_id: 'artifact_001',
    patient_id: 'patient_123',
    content,
    metadata: {
      artifact_type: 'clinical_note',
      date: new Date().toISOString(),
      author: 'Dr. Smith',
    },
  };

  return {
    chunk,
    score: 0.85,
    snippet: content.substring(0, 100),
    highlights: [],
    metadata: chunk.metadata,
    rank: 1,
  };
}

/**
 * Example 1: Basic exact match highlighting
 */
export function exampleBasicExactMatch() {
  console.log('Example 1: Basic Exact Match Highlighting');
  console.log('-'.repeat(80));

  const text = 'Patient presents with diabetes mellitus. Managing diabetes with insulin.';
  const query = 'diabetes';

  console.log(`  Text: "${text}"\n`);
  console.log(`  Query: "${query}"\n`);

  const highlights = highlightGenerator.findExactMatches(text, query);

  console.log('  Highlights Found:\n');
  highlights.forEach((h, i) => {
    console.log(`    ${i + 1}. "${h.term}" at position ${h.start}-${h.end} (type: ${h.type})`);
  });

  console.log(`\n  Total: ${highlights.length} matches\n`);
  console.log('  ✅ Success\n');
}

/**
 * Example 2: Case-insensitive matching
 */
export function exampleCaseInsensitive() {
  console.log('Example 2: Case-Insensitive Matching');
  console.log('-'.repeat(80));

  const text = 'HYPERTENSION and hypertension are the same. Hypertension diagnosis confirmed.';
  const query = 'hypertension';

  console.log(`  Text: "${text}"\n`);
  console.log(`  Query: "${query}"\n`);

  const highlights = highlightGenerator.findExactMatches(text, query);

  console.log('  Matched Terms (preserving original casing):\n');
  highlights.forEach((h, i) => {
    console.log(`    ${i + 1}. "${h.term}"`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 3: Entity highlighting
 */
export function exampleEntityHighlighting() {
  console.log('Example 3: Entity Highlighting');
  console.log('-'.repeat(80));

  const text = 'Patient John Doe diagnosed with Type 2 Diabetes. Prescribed Metformin 500mg.';
  const query = 'diabetes treatment';

  const entities: Entity[] = [
    { text: 'John Doe', type: 'person', normalized: 'john doe', confidence: 1.0, position: { start: 8, end: 16 } },
    { text: 'Type 2 Diabetes', type: 'condition', normalized: 'type 2 diabetes', confidence: 0.95, position: { start: 32, end: 47 } },
    { text: 'Metformin', type: 'medication', normalized: 'metformin', confidence: 0.9, position: { start: 59, end: 68 } },
  ];

  console.log(`  Text: "${text}"\n`);
  console.log(`  Query: "${query}"\n`);
  console.log('  Entities:');
  entities.forEach((e) => {
    console.log(`    - "${e.text}" (${e.type})`);
  });
  console.log('');

  const highlights = highlightGenerator.generateHighlights(text, query, entities);

  console.log('  All Highlights:\n');
  highlights.forEach((h, i) => {
    console.log(`    ${i + 1}. "${h.term}" (${h.type}) at position ${h.start}-${h.end}`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 4: Fuzzy matching
 */
export function exampleFuzzyMatching() {
  console.log('Example 4: Fuzzy Matching');
  console.log('-'.repeat(80));

  const text = 'Patient has diabetic neuropathy. Diabetes controlled with diet.';
  const query = 'diabetes';

  console.log(`  Text: "${text}"\n`);
  console.log(`  Query: "${query}"\n`);

  // Find exact matches
  const exactMatches = highlightGenerator.findExactMatches(text, query);

  // Find fuzzy matches (edit distance <= 2)
  const fuzzyMatches = highlightGenerator.findFuzzyMatches(text, query, 2);

  console.log('  Exact Matches:');
  exactMatches.forEach((h) => {
    console.log(`    - "${h.term}"`);
  });

  console.log('\n  Fuzzy Matches (within edit distance 2):');
  fuzzyMatches.forEach((h) => {
    console.log(`    - "${h.term}"`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 5: Merging overlapping highlights
 */
export function exampleMergingOverlaps() {
  console.log('Example 5: Merging Overlapping Highlights');
  console.log('-'.repeat(80));

  const text = 'Type 2 Diabetes Mellitus diagnosis confirmed.';
  const query = 'diabetes mellitus type';

  console.log(`  Text: "${text}"\n`);
  console.log(`  Query: "${query}"\n`);

  // Generate highlights (will have overlaps)
  const queryTerms = query.split(/\s+/);
  let highlights = [];

  for (const term of queryTerms) {
    highlights.push(...highlightGenerator.findExactMatches(text, term));
  }

  console.log(`  Before Merging: ${highlights.length} highlights\n`);
  highlights.forEach((h) => {
    console.log(`    - "${h.term}" at ${h.start}-${h.end}`);
  });

  // Merge overlaps
  const merged = highlightGenerator.mergeOverlappingHighlights(highlights, text);

  console.log(`\n  After Merging: ${merged.length} highlights\n`);
  merged.forEach((h) => {
    console.log(`    - "${h.term}" at ${h.start}-${h.end}`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 6: HTML formatting
 */
export function exampleHTMLFormatting() {
  console.log('Example 6: HTML Formatting');
  console.log('-'.repeat(80));

  const text = 'Patient has diabetes and hypertension.';
  const query = 'diabetes hypertension';

  console.log(`  Text: "${text}"\n`);
  console.log(`  Query: "${query}"\n`);

  const highlights = highlightGenerator.generateHighlights(text, query);
  const html = highlightGenerator.formatHighlightedText(text, highlights);

  console.log('  HTML Output:\n');
  console.log(`    ${html}\n`);

  console.log('  Rendered View (approximation):');
  const rendered = html.replace(/<mark class="[^"]*">/g, '**').replace(/<\/mark>/g, '**');
  console.log(`    ${rendered}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Snippet generation
 */
export function exampleSnippetGeneration() {
  console.log('Example 7: Snippet Generation');
  console.log('-'.repeat(80));

  const text =
    'This is a long clinical note. Patient history includes multiple visits. ' +
    'Current diagnosis is diabetes mellitus type 2. Treatment plan includes lifestyle modifications. ' +
    'Follow-up scheduled in 3 months. Additional notes about patient condition and prognosis.';

  const query = 'diabetes';

  console.log('  Full Text (truncated):');
  console.log(`    ${text.substring(0, 80)}...\n`);
  console.log(`  Query: "${query}"\n`);

  const highlights = highlightGenerator.generateHighlights(text, query);
  const snippet = highlightGenerator.generateSnippet(text, highlights, 100);

  console.log('  Generated Snippet (centered on first match):\n');
  console.log(`    ${snippet}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Add highlights to candidate
 */
export function exampleAddHighlights() {
  console.log('Example 8: Add Highlights to Candidate');
  console.log('-'.repeat(80));

  const content = 'Patient diagnosed with Type 2 Diabetes. Started on Metformin therapy.';
  const candidate = generateSampleCandidate(content);
  const query = 'diabetes metformin';

  const entities: Entity[] = [
    { text: 'Type 2 Diabetes', type: 'condition', normalized: 'type 2 diabetes', confidence: 0.95, position: { start: 23, end: 38 } },
    { text: 'Metformin', type: 'medication', normalized: 'metformin', confidence: 0.9, position: { start: 51, end: 60 } },
  ];

  console.log(`  Candidate: ${candidate.chunk.chunk_id}\n`);
  console.log(`  Content: "${content}"\n`);
  console.log(`  Query: "${query}"\n`);

  const highlighted = highlightGenerator.addHighlights(candidate, query, entities);

  console.log('  Result:\n');
  console.log(`    Highlights: ${highlighted.term_highlights.length}`);
  console.log(`    HTML: ${highlighted.highlighted_html.substring(0, 80)}...`);
  console.log(`    Snippet: ${highlighted.highlighted_snippet}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Batch highlighting
 */
export function exampleBatchHighlighting() {
  console.log('Example 9: Batch Highlighting');
  console.log('-'.repeat(80));

  const candidates = [
    generateSampleCandidate('Patient has diabetes mellitus type 2.', 'chunk_001'),
    generateSampleCandidate('Hypertension controlled with medication.', 'chunk_002'),
    generateSampleCandidate('Diabetes and hypertension comorbidity.', 'chunk_003'),
  ];

  const query = 'diabetes hypertension';

  console.log(`  Processing ${candidates.length} candidates...\n`);
  console.log(`  Query: "${query}"\n`);

  const highlighted = highlightGenerator.batchAddHighlights(candidates, query);

  console.log('  Results:\n');
  highlighted.forEach((c, i) => {
    console.log(`    ${i + 1}. ${c.chunk.chunk_id}:`);
    console.log(`       Highlights: ${c.term_highlights.length}`);
    console.log(`       Terms: ${c.term_highlights.map((h) => `"${h.term}"`).join(', ')}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Highlight statistics
 */
export function exampleHighlightStats() {
  console.log('Example 10: Highlight Statistics');
  console.log('-'.repeat(80));

  const candidates = [
    generateSampleCandidate('Patient has diabetes and hypertension.', 'chunk_001'),
    generateSampleCandidate('Diabetes type 2 diagnosis.', 'chunk_002'),
    generateSampleCandidate('Hypertension treatment ongoing.', 'chunk_003'),
    generateSampleCandidate('No diabetes or hypertension.', 'chunk_004'),
  ];

  const query = 'diabetes hypertension';

  const highlighted = highlightGenerator.batchAddHighlights(candidates, query);
  const stats = highlightGenerator.calculateStats(highlighted);

  console.log(`  Query: "${query}"\n`);
  console.log(`  Candidates: ${candidates.length}\n`);

  console.log('  Statistics:\n');
  console.log(`    Total Highlights: ${stats.total_highlights}`);
  console.log(`    Exact Matches:    ${stats.exact_matches}`);
  console.log(`    Fuzzy Matches:    ${stats.fuzzy_matches}`);
  console.log(`    Entity Matches:   ${stats.entity_matches}`);
  console.log(`    Avg per Candidate: ${stats.avg_highlights_per_candidate.toFixed(2)}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Find most highlighted candidates
 */
export function exampleMostHighlighted() {
  console.log('Example 11: Most Highlighted Candidates');
  console.log('-'.repeat(80));

  const candidates = [
    generateSampleCandidate('Routine checkup. No issues.', 'chunk_001'),
    generateSampleCandidate('Patient has diabetes mellitus.', 'chunk_002'),
    generateSampleCandidate('Diabetes and hypertension comorbidity. Diabetes controlled.', 'chunk_003'),
    generateSampleCandidate('Hypertension medication prescribed.', 'chunk_004'),
  ];

  const query = 'diabetes hypertension';

  const highlighted = highlightGenerator.batchAddHighlights(candidates, query);
  const topHighlighted = highlightGenerator.findMostHighlighted(highlighted, 3);

  console.log(`  Query: "${query}"\n`);
  console.log('  Top 3 Most Highlighted:\n');

  topHighlighted.forEach((c, i) => {
    console.log(`    ${i + 1}. ${c.chunk.chunk_id}: ${c.term_highlights.length} highlights`);
    console.log(`       Content: "${c.chunk.content.substring(0, 50)}..."`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Highlight density
 */
export function exampleHighlightDensity() {
  console.log('Example 12: Highlight Density');
  console.log('-'.repeat(80));

  const text1 = 'diabetes';
  const text2 = 'Patient diagnosed with diabetes mellitus. Managing diabetes effectively.';
  const text3 = 'This is a very long clinical note with lots of text but only one mention of diabetes somewhere in the middle of all this content.';

  const query = 'diabetes';

  console.log(`  Query: "${query}"\n`);

  const texts = [
    { label: 'Short, high density', text: text1 },
    { label: 'Medium density', text: text2 },
    { label: 'Long, low density', text: text3 },
  ];

  texts.forEach(({ label, text }) => {
    const highlights = highlightGenerator.generateHighlights(text, query);
    const density = highlightGenerator.getHighlightDensity(text, highlights);

    console.log(`  ${label}:`);
    console.log(`    Text length: ${text.length} chars`);
    console.log(`    Highlights: ${highlights.length}`);
    console.log(`    Density: ${density.toFixed(2)} highlights per 100 chars`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 13: Explain highlights
 */
export function exampleExplainHighlights() {
  console.log('Example 13: Explain Highlights');
  console.log('-'.repeat(80));

  const content = 'Patient John Smith has Type 2 Diabetes and Hypertension. Diabetes controlled with Metformin.';
  const candidate = generateSampleCandidate(content);
  const query = 'diabetes hypertension';

  const entities: Entity[] = [
    { text: 'John Smith', type: 'person', normalized: 'john smith', confidence: 1.0, position: { start: 8, end: 18 } },
    { text: 'Type 2 Diabetes', type: 'condition', normalized: 'type 2 diabetes', confidence: 0.95, position: { start: 23, end: 38 } },
    { text: 'Hypertension', type: 'condition', normalized: 'hypertension', confidence: 0.95, position: { start: 43, end: 55 } },
    { text: 'Metformin', type: 'medication', normalized: 'metformin', confidence: 0.9, position: { start: 82, end: 91 } },
  ];

  const highlighted = highlightGenerator.addHighlights(candidate, query, entities);

  console.log('\n' + highlightGenerator.explainHighlights(highlighted) + '\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 14: Multiple query terms
 */
export function exampleMultipleQueryTerms() {
  console.log('Example 14: Multiple Query Terms');
  console.log('-'.repeat(80));

  const text = 'Patient presents with chronic diabetes mellitus and essential hypertension. Managing both conditions.';
  const query = 'chronic diabetes hypertension managing conditions';

  console.log(`  Text: "${text}"\n`);
  console.log(`  Query: "${query}"\n`);

  const highlights = highlightGenerator.generateHighlights(text, query);

  console.log('  Matched Terms:\n');
  highlights.forEach((h, i) => {
    console.log(`    ${i + 1}. "${h.term}" at position ${h.start}-${h.end}`);
  });

  const html = highlightGenerator.formatHighlightedText(text, highlights);
  const rendered = html.replace(/<mark class="[^"]*">/g, '**').replace(/<\/mark>/g, '**');

  console.log('\n  Highlighted Text:');
  console.log(`    ${rendered}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 15: No highlights case
 */
export function exampleNoHighlights() {
  console.log('Example 15: No Highlights Case');
  console.log('-'.repeat(80));

  const text = 'Patient presents for routine annual physical examination.';
  const query = 'diabetes hypertension';

  console.log(`  Text: "${text}"\n`);
  console.log(`  Query: "${query}"\n`);

  const highlights = highlightGenerator.generateHighlights(text, query);

  console.log('  Result:');
  console.log(`    Highlights found: ${highlights.length}`);
  console.log(`    HTML: "${highlightGenerator.formatHighlightedText(text, highlights)}"`);
  console.log(`    Snippet: "${highlightGenerator.generateSnippet(text, highlights)}"\n`);

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('HIGHLIGHT GENERATOR EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleBasicExactMatch();
    exampleCaseInsensitive();
    exampleEntityHighlighting();
    exampleFuzzyMatching();
    exampleMergingOverlaps();
    exampleHTMLFormatting();
    exampleSnippetGeneration();
    exampleAddHighlights();
    exampleBatchHighlighting();
    exampleHighlightStats();
    exampleMostHighlighted();
    exampleHighlightDensity();
    exampleExplainHighlights();
    exampleMultipleQueryTerms();
    exampleNoHighlights();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
