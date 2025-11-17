/**
 * Answer Generation Agent Usage Examples
 *
 * Demonstrates:
 * - Complete answer generation
 * - Validation errors and handling
 * - Performance monitoring
 * - Integration with retriever
 * - Error handling
 */

import answerGenerationAgent from '../services/answer-generation-agent.service';
import { RetrievalCandidate } from '../services/retriever-agent.service';
import { StructuredQuery } from '../services/query-understanding-agent.service';
import { QueryIntent } from '../services/intent-classifier.service';
import { Extraction } from '../services/extraction-prompt-builder.service';
import { Chunk } from '../services/metadata-filter.service';

/**
 * Generate sample candidates for testing
 */
function generateSampleCandidates(): RetrievalCandidate[] {
  const chunks: Chunk[] = [
    {
      chunk_id: 'chunk_001',
      artifact_id: 'note_123',
      patient_id: 'patient_456',
      content:
        'Patient prescribed Metformin 500mg twice daily for Type 2 Diabetes management. Blood glucose levels improving with current regimen.',
      metadata: {
        artifact_type: 'clinical_note',
        date: '2024-01-15T10:30:00Z',
        author: 'Dr. Smith',
      },
    },
    {
      chunk_id: 'chunk_002',
      artifact_id: 'note_124',
      patient_id: 'patient_456',
      content:
        'Follow up scheduled in 2 weeks for blood pressure monitoring. Continue Metformin as prescribed. Monitor for hypoglycemia.',
      metadata: {
        artifact_type: 'care_plan',
        date: '2024-01-16T14:00:00Z',
        author: 'Dr. Johnson',
      },
    },
  ];

  return chunks.map((chunk, index) => ({
    chunk,
    score: 0.9 - index * 0.1,
    snippet: chunk.content.substring(0, 100),
    highlights: [],
    metadata: chunk.metadata,
    rank: index + 1,
  }));
}

/**
 * Generate sample query
 */
function generateSampleQuery(queryText: string): StructuredQuery {
  return {
    original_query: queryText,
    patient_id: 'patient_456',
    intent: QueryIntent.RETRIEVE_MEDICATIONS,
    entities: [],
    temporal_filter: null,
    filters: {},
    detail_level: 'standard' as any,
    query_id: `query_${Date.now()}`,
  };
}

/**
 * Example 1: Complete answer generation
 */
export async function exampleGenerateAnswer() {
  console.log('Example 1: Complete Answer Generation');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const query = generateSampleQuery('What medications is the patient currently taking?');

  console.log(`  Query: "${query.original_query}"`);
  console.log(`  Candidates: ${candidates.length}\n`);

  try {
    // Note: Uses Ollama provider (ensure ollama serve is running)
    // const answer = await answerGenerationAgent.generate(candidates, query);

    // console.log('  Generated Answer:\n');
    // console.log(`    Short Answer: ${answer.short_answer}`);
    // console.log(`    Detailed Summary: ${answer.detailed_summary}`);
    // console.log(`    Extractions: ${answer.structured_extractions.length}`);
    // console.log(`    Model: ${answer.model}`);
    // console.log(`    Total Tokens: ${answer.total_tokens}`);
    // console.log(`    Generation Time: ${answer.generation_time_ms}ms`);

    console.log('  ⚠️  Requires Ollama to be running');
    console.log('  Example structure shown in documentation\n');
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Validate extractions
 */
export function exampleValidateExtractions() {
  console.log('Example 2: Validate Extractions');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();

  // Valid extraction
  const validExtraction: Extraction = {
    type: 'medication_recommendation',
    content: {
      medication: 'Metformin',
      dosage: '500mg',
      frequency: 'twice daily',
    },
    provenance: {
      artifact_id: 'note_123',
      chunk_id: 'chunk_001',
      char_offsets: [18, 71],
      supporting_text: 'prescribed Metformin 500mg twice daily for Type 2 Diabetes',
    },
  };

  // Invalid extraction (bad offsets)
  const invalidExtraction: Extraction = {
    type: 'medication_recommendation',
    content: {
      medication: 'Lisinopril',
    },
    provenance: {
      artifact_id: 'note_123',
      chunk_id: 'chunk_001',
      char_offsets: [500, 600], // Exceeds chunk length!
      supporting_text: 'prescribed Lisinopril 10mg',
    },
  };

  console.log('  Validating valid extraction:\n');
  const result1 = answerGenerationAgent.validateExtractions([validExtraction], candidates);
  console.log(`    Valid: ${result1.valid}`);
  console.log(`    Errors: ${result1.errors.length}`);
  console.log(`    Warnings: ${result1.warnings.length}`);

  console.log('\n  Validating invalid extraction:\n');
  const result2 = answerGenerationAgent.validateExtractions([invalidExtraction], candidates);
  console.log(`    Valid: ${result2.valid}`);
  console.log(`    Errors: ${result2.errors.length}`);
  if (result2.errors.length > 0) {
    console.log(`    Error messages:`);
    result2.errors.forEach(err => console.log(`      - ${err}`));
  }

  console.log('\n  ✅ Success\n');
}

/**
 * Example 3: Validate provenance
 */
export function exampleValidateProvenance() {
  console.log('Example 3: Validate Provenance');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();

  const extraction: Extraction = {
    type: 'medication_recommendation',
    content: {
      medication: 'Metformin',
    },
    provenance: {
      artifact_id: 'note_123',
      chunk_id: 'chunk_001',
      char_offsets: [18, 71],
      supporting_text: 'prescribed Metformin 500mg twice daily',
    },
  };

  console.log('  Checking provenance validity:\n');
  const isValid = answerGenerationAgent.validateProvenance(extraction, candidates);
  console.log(`    Valid: ${isValid ? '✅' : '❌'}`);

  console.log('\n  ✅ Success\n');
}

/**
 * Example 4: Check char offsets
 */
export function exampleCheckCharOffsets() {
  console.log('Example 4: Check Char Offsets');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();

  console.log('  Testing char offset validation:\n');

  // Valid offsets
  console.log('    Valid offsets [18, 71]:');
  const valid = answerGenerationAgent.checkCharOffsets('chunk_001', [18, 71], candidates);
  console.log(`      Result: ${valid ? '✅ Valid' : '❌ Invalid'}`);

  // Invalid offsets (exceeds length)
  console.log('\n    Invalid offsets [500, 600]:');
  const invalid = answerGenerationAgent.checkCharOffsets('chunk_001', [500, 600], candidates);
  console.log(`      Result: ${invalid ? '✅ Valid' : '❌ Invalid'}`);

  // Invalid offsets (start > end)
  console.log('\n    Invalid offsets [100, 50]:');
  const invalid2 = answerGenerationAgent.checkCharOffsets('chunk_001', [100, 50], candidates);
  console.log(`      Result: ${invalid2 ? '✅ Valid' : '❌ Invalid'}`);

  console.log('\n  ✅ Success\n');
}

/**
 * Example 5: Verify artifact exists
 */
export function exampleVerifyArtifactExists() {
  console.log('Example 5: Verify Artifact Exists');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();

  console.log('  Checking artifact existence:\n');

  // Existing artifact
  console.log('    Artifact "note_123":');
  const exists = answerGenerationAgent.verifyArtifactExists('note_123', candidates);
  console.log(`      Result: ${exists ? '✅ Exists' : '❌ Not Found'}`);

  // Non-existing artifact
  console.log('\n    Artifact "note_999":');
  const notExists = answerGenerationAgent.verifyArtifactExists('note_999', candidates);
  console.log(`      Result: ${notExists ? '✅ Exists' : '❌ Not Found'}`);

  console.log('\n  ✅ Success\n');
}

/**
 * Example 6: Get extraction statistics
 */
export function exampleGetExtractionStats() {
  console.log('Example 6: Get Extraction Statistics');
  console.log('-'.repeat(80));

  const extractions: Extraction[] = [
    {
      type: 'medication_recommendation',
      content: { medication: 'Metformin' },
      provenance: {
        artifact_id: 'note_123',
        chunk_id: 'chunk_001',
        char_offsets: [18, 71],
        supporting_text: 'prescribed Metformin 500mg twice daily',
      },
    },
    {
      type: 'care_plan_note',
      content: { follow_up: '2 weeks' },
      provenance: {
        artifact_id: 'note_124',
        chunk_id: 'chunk_002',
        char_offsets: [0, 50],
        supporting_text: 'Follow up scheduled in 2 weeks for blood pressure',
      },
    },
    {
      type: 'medication_recommendation',
      content: { medication: 'Lisinopril' },
      provenance: {
        artifact_id: 'note_123',
        chunk_id: 'chunk_001',
        char_offsets: [100, 130],
        supporting_text: 'Lisinopril 10mg once daily',
      },
    },
  ];

  console.log('  Extraction Statistics:\n');
  const stats = answerGenerationAgent.getExtractionStats(extractions);

  console.log(`    Total: ${stats.total}`);
  console.log(`    With Provenance: ${stats.with_provenance}`);
  console.log(`    Avg Supporting Text Length: ${stats.avg_supporting_text_length}`);
  console.log(`    By Type:`);
  Object.entries(stats.by_type).forEach(([type, count]) => {
    console.log(`      - ${type}: ${count}`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 7: Format answer for display
 */
export function exampleFormatAnswer() {
  console.log('Example 7: Format Answer for Display');
  console.log('-'.repeat(80));

  const mockAnswer = {
    short_answer: 'Patient is taking Metformin 500mg twice daily for diabetes.',
    detailed_summary:
      'Patient is currently taking Metformin 500mg twice daily for Type 2 Diabetes management (note_123). Blood glucose levels are improving with the current regimen. A follow-up appointment is scheduled in 2 weeks for blood pressure monitoring (note_124).',
    structured_extractions: [
      {
        type: 'medication_recommendation',
        content: {
          medication: 'Metformin',
          dosage: '500mg',
          frequency: 'twice daily',
        },
        provenance: {
          artifact_id: 'note_123',
          chunk_id: 'chunk_001',
          char_offsets: [18, 71],
          supporting_text: 'prescribed Metformin 500mg twice daily',
        },
      },
    ] as Extraction[],
    model: 'meditron',
    total_tokens: 1050,
    generation_time_ms: 3200,
  };

  console.log('  Formatted Answer:\n');
  const formatted = answerGenerationAgent.formatAnswer(mockAnswer);
  console.log(formatted.split('\n').map(line => `    ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Example 8: Explain answer generation process
 */
export function exampleExplain() {
  console.log('Example 8: Explain Answer Generation Process');
  console.log('-'.repeat(80));

  const explanation = answerGenerationAgent.explain();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Example 9: Error handling - no candidates
 */
export async function exampleErrorNoCandidates() {
  console.log('Example 9: Error Handling - No Candidates');
  console.log('-'.repeat(80));

  const query = generateSampleQuery('What medications is the patient taking?');

  console.log('  Attempting to generate answer with no candidates:\n');

  try {
    await answerGenerationAgent.generate([], query);
    console.log('    ❌ Should have thrown error');
  } catch (error) {
    console.log(`    ✅ Caught error: ${(error as Error).message}`);
  }

  console.log('\n  ✅ Success\n');
}

/**
 * Example 10: Error handling - invalid query
 */
export async function exampleErrorInvalidQuery() {
  console.log('Example 10: Error Handling - Invalid Query');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const invalidQuery = {} as StructuredQuery;

  console.log('  Attempting to generate answer with invalid query:\n');

  try {
    await answerGenerationAgent.generate(candidates, invalidQuery);
    console.log('    ❌ Should have thrown error');
  } catch (error) {
    console.log(`    ✅ Caught error: ${(error as Error).message}`);
  }

  console.log('\n  ✅ Success\n');
}

/**
 * Example 11: Validation - missing provenance
 */
export function exampleValidationMissingProvenance() {
  console.log('Example 11: Validation - Missing Provenance');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();

  // Extraction without provenance (intentionally invalid for testing)
  const extractionWithoutProvenance = {
    type: 'medication_recommendation',
    content: { medication: 'Aspirin' },
  } as any as Extraction;

  console.log('  Validating extraction without provenance:\n');
  const result = answerGenerationAgent.validateExtractions(
    [extractionWithoutProvenance],
    candidates
  );

  console.log(`    Valid: ${result.valid}`);
  console.log(`    Errors: ${result.errors.length}`);
  if (result.errors.length > 0) {
    console.log(`    Error messages:`);
    result.errors.forEach(err => console.log(`      - ${err}`));
  }

  console.log('\n  ✅ Success\n');
}

/**
 * Example 12: Performance monitoring
 */
export async function examplePerformanceMonitoring() {
  console.log('Example 12: Performance Monitoring');
  console.log('-'.repeat(80));

  console.log('  Metrics Tracked:\n');
  console.log('    - Total generation time (ms)');
  console.log('    - Token usage (pass1 + pass2)');
  console.log('    - Extraction count');
  console.log('    - Validation time');
  console.log('    - Model used\n');

  console.log('  Example Metrics:\n');
  console.log('    Generation Time: 3,200ms');
  console.log('    Total Tokens: 1,050');
  console.log('    Extractions: 3');
  console.log('    Model: meditron\n');

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('ANSWER GENERATION AGENT EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    await exampleGenerateAnswer();
    exampleValidateExtractions();
    exampleValidateProvenance();
    exampleCheckCharOffsets();
    exampleVerifyArtifactExists();
    exampleGetExtractionStats();
    exampleFormatAnswer();
    exampleExplain();
    await exampleErrorNoCandidates();
    await exampleErrorInvalidQuery();
    exampleValidationMissingProvenance();
    await examplePerformanceMonitoring();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
    console.log('\nNote: Live API examples require Ollama to be running (ollama serve)');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
