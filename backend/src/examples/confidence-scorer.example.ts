/**
 * Confidence Scorer Usage Examples
 *
 * Demonstrates:
 * - Confidence calculation with CORRECT formula (0.6/0.3/0.1)
 * - Component breakdown
 * - Confidence labeling
 * - Recommendations
 * - Edge cases
 */

import confidenceScorer from '../services/confidence-scorer.service';
import { RetrievalResult, RetrievalCandidate } from '../services/retriever-agent.service';
import { Extraction } from '../services/extraction-prompt-builder.service';
import { Chunk } from '../services/metadata-filter.service';

/**
 * Generate high-quality retrieval result
 */
function generateHighQualityRetrieval(): RetrievalResult {
  const chunks: Chunk[] = [
    {
      chunk_id: 'chunk_001',
      artifact_id: 'note_123',
      patient_id: 'patient_456',
      content: 'Patient prescribed Metformin 500mg twice daily.',
      metadata: { artifact_type: 'clinical_note', date: '2024-01-15' },
    },
    {
      chunk_id: 'chunk_002',
      artifact_id: 'note_124',
      patient_id: 'patient_456',
      content: 'Follow up in 2 weeks for monitoring.',
      metadata: { artifact_type: 'care_plan', date: '2024-01-16' },
    },
  ];

  const candidates: RetrievalCandidate[] = chunks.map((chunk, index) => ({
    chunk,
    score: 0.9 - index * 0.1, // High scores: 0.9, 0.8
    snippet: chunk.content.substring(0, 50),
    highlights: [],
    metadata: chunk.metadata,
    rank: index + 1,
  }));

  return {
    query_id: 'query_123',
    candidates,
    total_searched: candidates.length,
    filtered_count: candidates.length,
    retrieval_time_ms: 150,
  };
}

/**
 * Generate medium-quality retrieval result
 */
function generateMediumQualityRetrieval(): RetrievalResult {
  const chunks: Chunk[] = [
    {
      chunk_id: 'chunk_001',
      artifact_id: 'note_123',
      patient_id: 'patient_456',
      content: 'Patient has diabetes.',
      metadata: { artifact_type: 'clinical_note', date: '2024-01-15' },
    },
  ];

  const candidates: RetrievalCandidate[] = chunks.map((chunk, index) => ({
    chunk,
    score: 0.6, // Medium score
    snippet: chunk.content,
    highlights: [],
    metadata: chunk.metadata,
    rank: index + 1,
  }));

  return {
    query_id: 'query_124',
    candidates,
    total_searched: candidates.length,
    filtered_count: candidates.length,
    retrieval_time_ms: 120,
  };
}

/**
 * Generate low-quality retrieval result
 */
function generateLowQualityRetrieval(): RetrievalResult {
  const chunks: Chunk[] = [
    {
      chunk_id: 'chunk_001',
      artifact_id: 'note_123',
      patient_id: 'patient_456',
      content: 'General patient information.',
      metadata: { artifact_type: 'clinical_note', date: '2024-01-15' },
    },
  ];

  const candidates: RetrievalCandidate[] = chunks.map((chunk, index) => ({
    chunk,
    score: 0.3, // Low score
    snippet: chunk.content,
    highlights: [],
    metadata: chunk.metadata,
    rank: index + 1,
  }));

  return {
    query_id: 'query_125',
    candidates,
    total_searched: candidates.length,
    filtered_count: candidates.length,
    retrieval_time_ms: 100,
  };
}

/**
 * Generate high-quality extractions
 */
function generateHighQualityExtractions(): Extraction[] {
  return [
    {
      type: 'medication_recommendation',
      content: { medication: 'Metformin', dosage: '500mg', frequency: 'twice daily' },
      provenance: {
        artifact_id: 'note_123',
        chunk_id: 'chunk_001',
        char_offsets: [18, 47],
        supporting_text: 'Metformin 500mg twice daily',
      },
    },
    {
      type: 'care_plan_note',
      content: { follow_up: '2 weeks' },
      provenance: {
        artifact_id: 'note_124',
        chunk_id: 'chunk_002',
        char_offsets: [0, 30],
        supporting_text: 'Follow up in 2 weeks',
      },
    },
  ];
}

/**
 * Generate medium-quality extractions (missing char_offsets)
 */
function generateMediumQualityExtractions(): Extraction[] {
  return [
    {
      type: 'general_note',
      content: { condition: 'diabetes' },
      provenance: {
        artifact_id: 'note_123',
        chunk_id: 'chunk_001',
        char_offsets: undefined as any,
        supporting_text: 'has diabetes',
      },
    },
  ];
}

/**
 * Generate low-quality extractions (missing provenance)
 */
function generateLowQualityExtractions(): Extraction[] {
  return [
    {
      type: 'general_note',
      content: { note: 'patient information' },
      provenance: undefined as any,
    },
  ];
}

/**
 * Example 1: High confidence scenario
 */
export function exampleHighConfidence() {
  console.log('Example 1: High Confidence Scenario');
  console.log('-'.repeat(80));

  const retrieval = generateHighQualityRetrieval();
  const extractions = generateHighQualityExtractions();

  const confidence = confidenceScorer.calculateConfidence(retrieval, extractions);

  console.log('  Scenario: High retrieval scores + quality extractions + multiple sources\n');
  console.log(`    Overall Score: ${confidence.score.toFixed(3)}`);
  console.log(`    Label: ${confidence.label}`);
  console.log(`    Retrieval Score: ${confidence.components.avg_retrieval_score.toFixed(3)}`);
  console.log(`    Extraction Quality: ${confidence.components.extraction_quality.toFixed(3)}`);
  console.log(`    Support Density: ${confidence.components.support_density.toFixed(3)}`);
  console.log(`    Reason: ${confidence.reason}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Medium confidence scenario
 */
export function exampleMediumConfidence() {
  console.log('Example 2: Medium Confidence Scenario');
  console.log('-'.repeat(80));

  const retrieval = generateMediumQualityRetrieval();
  const extractions = generateMediumQualityExtractions();

  const confidence = confidenceScorer.calculateConfidence(retrieval, extractions);

  console.log('  Scenario: Medium retrieval scores + partial provenance\n');
  console.log(`    Overall Score: ${confidence.score.toFixed(3)}`);
  console.log(`    Label: ${confidence.label}`);
  console.log(`    Retrieval Score: ${confidence.components.avg_retrieval_score.toFixed(3)}`);
  console.log(`    Extraction Quality: ${confidence.components.extraction_quality.toFixed(3)}`);
  console.log(`    Support Density: ${confidence.components.support_density.toFixed(3)}`);
  console.log(`    Reason: ${confidence.reason}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Low confidence scenario
 */
export function exampleLowConfidence() {
  console.log('Example 3: Low Confidence Scenario');
  console.log('-'.repeat(80));

  const retrieval = generateLowQualityRetrieval();
  const extractions = generateLowQualityExtractions();

  const confidence = confidenceScorer.calculateConfidence(retrieval, extractions);

  console.log('  Scenario: Low retrieval scores + poor extraction quality\n');
  console.log(`    Overall Score: ${confidence.score.toFixed(3)}`);
  console.log(`    Label: ${confidence.label}`);
  console.log(`    Retrieval Score: ${confidence.components.avg_retrieval_score.toFixed(3)}`);
  console.log(`    Extraction Quality: ${confidence.components.extraction_quality.toFixed(3)}`);
  console.log(`    Support Density: ${confidence.components.support_density.toFixed(3)}`);
  console.log(`    Reason: ${confidence.reason}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Assess extraction quality
 */
export function exampleAssessExtractionQuality() {
  console.log('Example 4: Assess Extraction Quality');
  console.log('-'.repeat(80));

  console.log('  Testing extraction quality assessment:\n');

  // High quality (has provenance + char_offsets)
  const highQuality = generateHighQualityExtractions();
  const highScore = confidenceScorer.assessExtractionQuality(highQuality);
  console.log(`    High Quality (provenance + offsets): ${highScore.toFixed(3)}`);

  // Medium quality (has provenance, no char_offsets)
  const mediumQuality = generateMediumQualityExtractions();
  const mediumScore = confidenceScorer.assessExtractionQuality(mediumQuality);
  console.log(`    Medium Quality (provenance only): ${mediumScore.toFixed(3)}`);

  // Low quality (no provenance)
  const lowQuality = generateLowQualityExtractions();
  const lowScore = confidenceScorer.assessExtractionQuality(lowQuality);
  console.log(`    Low Quality (no provenance): ${lowScore.toFixed(3)}`);

  // No extractions
  const noExtractions: Extraction[] = [];
  const noScore = confidenceScorer.assessExtractionQuality(noExtractions);
  console.log(`    No Extractions: ${noScore.toFixed(3)}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Calculate support density
 */
export function exampleCalculateSupportDensity() {
  console.log('Example 5: Calculate Support Density');
  console.log('-'.repeat(80));

  const retrieval = generateHighQualityRetrieval();
  const extractions = generateHighQualityExtractions();

  console.log('  Testing support density calculation:\n');

  const density = confidenceScorer.calculateSupportDensity(extractions, retrieval.candidates);

  console.log(`    Total Candidates: ${retrieval.candidates.length}`);
  console.log(`    Unique Supporting Sources: 2 (note_123, note_124)`);
  console.log(`    Support Density: ${density.toFixed(3)}`);
  console.log(`    Calculation: 2 / ${retrieval.candidates.length} = ${density.toFixed(3)}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Get confidence label
 */
export function exampleGetConfidenceLabel() {
  console.log('Example 6: Get Confidence Label');
  console.log('-'.repeat(80));

  console.log('  Testing confidence labeling:\n');

  console.log(`    Score 0.85: ${confidenceScorer.getConfidenceLabel(0.85)}`);
  console.log(`    Score 0.70: ${confidenceScorer.getConfidenceLabel(0.70)}`);
  console.log(`    Score 0.55: ${confidenceScorer.getConfidenceLabel(0.55)}`);
  console.log(`    Score 0.40: ${confidenceScorer.getConfidenceLabel(0.40)}`);
  console.log(`    Score 0.25: ${confidenceScorer.getConfidenceLabel(0.25)}\n`);

  console.log('  Thresholds:');
  const thresholds = confidenceScorer.getThresholds();
  console.log(`    High:   >= ${thresholds.high}`);
  console.log(`    Medium: >= ${thresholds.medium}`);
  console.log(`    Low:    < ${thresholds.medium}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Get confidence breakdown
 */
export function exampleGetConfidenceBreakdown() {
  console.log('Example 7: Get Confidence Breakdown');
  console.log('-'.repeat(80));

  const retrieval = generateHighQualityRetrieval();
  const extractions = generateHighQualityExtractions();

  console.log('  Detailed confidence breakdown:\n');
  const breakdown = confidenceScorer.getConfidenceBreakdown(retrieval, extractions);
  console.log(breakdown.split('\n').map(line => `    ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Example 8: Check if acceptable
 */
export function exampleIsAcceptable() {
  console.log('Example 8: Check if Acceptable');
  console.log('-'.repeat(80));

  console.log('  Testing acceptability check:\n');

  const highRetrieval = generateHighQualityRetrieval();
  const highExtractions = generateHighQualityExtractions();
  const highConfidence = confidenceScorer.calculateConfidence(highRetrieval, highExtractions);
  console.log(`    High Confidence (${highConfidence.score.toFixed(3)}): ${confidenceScorer.isAcceptable(highConfidence) ? '✅ Acceptable' : '❌ Not Acceptable'}`);

  const mediumRetrieval = generateMediumQualityRetrieval();
  const mediumExtractions = generateMediumQualityExtractions();
  const mediumConfidence = confidenceScorer.calculateConfidence(mediumRetrieval, mediumExtractions);
  console.log(`    Medium Confidence (${mediumConfidence.score.toFixed(3)}): ${confidenceScorer.isAcceptable(mediumConfidence) ? '✅ Acceptable' : '❌ Not Acceptable'}`);

  const lowRetrieval = generateLowQualityRetrieval();
  const lowExtractions = generateLowQualityExtractions();
  const lowConfidence = confidenceScorer.calculateConfidence(lowRetrieval, lowExtractions);
  console.log(`    Low Confidence (${lowConfidence.score.toFixed(3)}): ${confidenceScorer.isAcceptable(lowConfidence) ? '✅ Acceptable' : '❌ Not Acceptable'}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Get recommendation
 */
export function exampleGetRecommendation() {
  console.log('Example 9: Get Recommendation');
  console.log('-'.repeat(80));

  console.log('  Testing recommendations:\n');

  const highRetrieval = generateHighQualityRetrieval();
  const highExtractions = generateHighQualityExtractions();
  const highConfidence = confidenceScorer.calculateConfidence(highRetrieval, highExtractions);
  console.log(`    High Confidence:`);
  console.log(`      ${confidenceScorer.getRecommendation(highConfidence)}\n`);

  const mediumRetrieval = generateMediumQualityRetrieval();
  const mediumExtractions = generateMediumQualityExtractions();
  const mediumConfidence = confidenceScorer.calculateConfidence(mediumRetrieval, mediumExtractions);
  console.log(`    Medium Confidence:`);
  console.log(`      ${confidenceScorer.getRecommendation(mediumConfidence)}\n`);

  const lowRetrieval = generateLowQualityRetrieval();
  const lowExtractions = generateLowQualityExtractions();
  const lowConfidence = confidenceScorer.calculateConfidence(lowRetrieval, lowExtractions);
  console.log(`    Low Confidence:`);
  console.log(`      ${confidenceScorer.getRecommendation(lowConfidence)}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Explain formula
 */
export function exampleExplainFormula() {
  console.log('Example 10: Explain Formula');
  console.log('-'.repeat(80));

  const explanation = confidenceScorer.explainFormula();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Example 11: Get weights
 */
export function exampleGetWeights() {
  console.log('Example 11: Get Weights');
  console.log('-'.repeat(80));

  const weights = confidenceScorer.getWeights();

  console.log('  CORRECT Formula Weights (per ChatGPT spec):\n');
  console.log(`    Retrieval:  ${weights.retrieval} (60%)`);
  console.log(`    Extraction: ${weights.extraction} (30%)`);
  console.log(`    Support:    ${weights.support} (10%)`);
  console.log(`    Total:      ${weights.retrieval + weights.extraction + weights.support} (100%)\n`);

  console.log('  ⚠️  Note: Original prompt had WRONG weights (0.4/0.3/0.2/0.1)');
  console.log('  ✅  This implementation uses CORRECT weights (0.6/0.3/0.1)\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Edge cases
 */
export function exampleEdgeCases() {
  console.log('Example 12: Edge Cases');
  console.log('-'.repeat(80));

  console.log('  Testing edge cases:\n');

  // No candidates
  const noCandidates: RetrievalResult = {
    query_id: 'query_edge1',
    candidates: [],
    total_searched: 0,
    filtered_count: 0,
    retrieval_time_ms: 50,
  };
  const noExtractions: Extraction[] = [];
  const noDataConfidence = confidenceScorer.calculateConfidence(noCandidates, noExtractions);
  console.log(`    No Candidates + No Extractions:`);
  console.log(`      Score: ${noDataConfidence.score.toFixed(3)} (${noDataConfidence.label})\n`);

  // High retrieval but no extractions
  const highRetrieval = generateHighQualityRetrieval();
  const noExtractionsConfidence = confidenceScorer.calculateConfidence(highRetrieval, []);
  console.log(`    High Retrieval + No Extractions:`);
  console.log(`      Score: ${noExtractionsConfidence.score.toFixed(3)} (${noExtractionsConfidence.label})\n`);

  // Low retrieval but high extractions
  const lowRetrieval = generateLowQualityRetrieval();
  const highExtractions = generateHighQualityExtractions();
  const mixedConfidence = confidenceScorer.calculateConfidence(lowRetrieval, highExtractions);
  console.log(`    Low Retrieval + High Extractions:`);
  console.log(`      Score: ${mixedConfidence.score.toFixed(3)} (${mixedConfidence.label})\n`);

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('CONFIDENCE SCORER EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleHighConfidence();
    exampleMediumConfidence();
    exampleLowConfidence();
    exampleAssessExtractionQuality();
    exampleCalculateSupportDensity();
    exampleGetConfidenceLabel();
    exampleGetConfidenceBreakdown();
    exampleIsAcceptable();
    exampleGetRecommendation();
    exampleExplainFormula();
    exampleGetWeights();
    exampleEdgeCases();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
    console.log('\n⚠️  Using CORRECT formula: 0.6 × retrieval + 0.3 × extraction + 0.1 × support');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
