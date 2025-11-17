/**
 * Re-Ranker Service Usage Examples
 *
 * Demonstrates:
 * - Basic re-ranking
 * - Entity coverage scoring
 * - Query overlap calculation
 * - Type match bonuses
 * - Ranking comparisons
 * - Detailed re-ranking analysis
 * - Batch re-ranking
 */

import reranker from '../services/reranker.service';
import { RetrievalCandidate } from '../services/retriever-agent.service';
import { Chunk } from '../services/metadata-filter.service';
import { StructuredQuery } from '../services/query-understanding-agent.service';
import { QueryIntent } from '../services/intent-classifier.service';
import { Entity } from '../services/entity-extractor.service';

/**
 * Generate sample candidates for re-ranking
 */
function generateSampleCandidates(): RetrievalCandidate[] {
  const chunks: Chunk[] = [
    {
      chunk_id: 'chunk_001',
      artifact_id: 'artifact_001',
      patient_id: 'patient_123',
      content:
        'Patient prescribed metformin 500mg twice daily for type 2 diabetes management. ' +
        'Blood glucose levels monitored regularly.',
      metadata: {
        artifact_type: 'medication_order',
        date: '2024-10-20T10:00:00Z',
        author: 'Dr. Smith',
      },
    },
    {
      chunk_id: 'chunk_002',
      artifact_id: 'artifact_002',
      patient_id: 'patient_123',
      content:
        'Progress note: Patient continues diabetes treatment. No medication changes. ' +
        'Metformin therapy effective.',
      metadata: {
        artifact_type: 'progress_note',
        date: '2024-09-15T14:00:00Z',
        author: 'Nurse Johnson',
      },
    },
    {
      chunk_id: 'chunk_003',
      artifact_id: 'artifact_003',
      patient_id: 'patient_123',
      content:
        'A1C level: 6.8%. Improved diabetes control with current medication regimen. ' +
        'Continue metformin as prescribed.',
      metadata: {
        artifact_type: 'lab_result',
        date: '2024-08-01T09:00:00Z',
        author: 'Lab Tech',
      },
    },
    {
      chunk_id: 'chunk_004',
      artifact_id: 'artifact_004',
      patient_id: 'patient_123',
      content:
        'Patient education provided on medication adherence and glucose monitoring.',
      metadata: {
        artifact_type: 'progress_note',
        date: '2024-07-15T10:00:00Z',
        author: 'Nurse Williams',
      },
    },
    {
      chunk_id: 'chunk_005',
      artifact_id: 'artifact_005',
      patient_id: 'patient_123',
      content:
        'Care plan: Continue metformin 500mg BID. Schedule follow-up for diabetes management.',
      metadata: {
        artifact_type: 'care_plan',
        date: '2024-10-01T11:00:00Z',
        author: 'Dr. Smith',
      },
    },
  ];

  // Simulate initial retrieval scores
  return chunks.map((chunk, index) => ({
    chunk,
    score: 0.8 - index * 0.1, // Descending scores
    snippet: chunk.content.substring(0, 100) + '...',
    highlights: [],
    metadata: chunk.metadata,
    rank: index + 1,
  }));
}

/**
 * Generate sample structured query
 */
function generateSampleQuery(): StructuredQuery {
  return {
    original_query: 'metformin for diabetes',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_MEDICATIONS,
    entities: [
      {
        text: 'metformin',
        type: 'medication',
        normalized: 'metformin',
        confidence: 0.95,
      },
      {
        text: 'diabetes',
        type: 'condition',
        normalized: 'diabetes',
        confidence: 0.90,
      },
    ] as Entity[],
    temporal_filter: null,
    filters: {
      artifact_types: ['medication_order', 'prescription'],
    },
    detail_level: 3,
    query_id: 'query_001',
  };
}

/**
 * Example 1: Basic re-ranking
 */
export function exampleBasicReRanking() {
  console.log('Example 1: Basic Re-Ranking');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const query = generateSampleQuery();

  console.log('  Original Rankings:\n');
  candidates.forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id} - Score: ${c.score.toFixed(3)}`);
    console.log(`       Type: ${c.metadata.artifact_type}`);
  });

  console.log('\n  Re-ranking candidates...\n');

  const reranked = reranker.rerank(candidates, query);

  console.log('  Re-Ranked Results:\n');
  reranked.forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id} - Score: ${c.score.toFixed(3)}`);
    console.log(`       Type: ${c.metadata.artifact_type}`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 2: Query relevance calculation
 */
export function exampleQueryRelevance() {
  console.log('Example 2: Query Relevance Calculation');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const query = 'metformin for diabetes management';

  console.log(`  Query: "${query}"\n`);

  candidates.forEach((candidate) => {
    const relevance = reranker.calculateQueryRelevance(candidate.chunk, query);

    console.log(`  ${candidate.chunk.chunk_id}:`);
    console.log(`    Relevance: ${relevance.toFixed(3)}`);
    console.log(`    Content: ${candidate.chunk.content.substring(0, 80)}...`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Entity coverage scoring
 */
export function exampleEntityCoverage() {
  console.log('Example 3: Entity Coverage Scoring');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const entities: Entity[] = [
    {
      text: 'metformin',
      type: 'medication',
      normalized: 'metformin',
      confidence: 0.95,
    },
    {
      text: 'diabetes',
      type: 'condition',
      normalized: 'diabetes',
      confidence: 0.90,
    },
  ];

  console.log('  Query Entities:');
  entities.forEach((e) => {
    console.log(`    - ${e.text} (${e.type})`);
  });
  console.log('');

  candidates.forEach((candidate) => {
    const coverage = reranker.boostByEntityMatch(candidate.chunk, entities);

    console.log(`  ${candidate.chunk.chunk_id}:`);
    console.log(`    Entity Coverage: ${coverage.toFixed(3)} (${(coverage * 100).toFixed(0)}%)`);
    console.log(`    Content: ${candidate.chunk.content.substring(0, 80)}...`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Re-ranking with detailed analysis
 */
export function exampleDetailedReRanking() {
  console.log('Example 4: Detailed Re-Ranking Analysis');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const query = generateSampleQuery();

  const results = reranker.rerankWithDetails(candidates, query);

  console.log('  Detailed Re-Ranking Results:\n');

  results.slice(0, 3).forEach((result, i) => {
    console.log(`  === Rank ${i + 1} ===`);
    console.log(reranker.explainReRanking(result));
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Ranking comparison
 */
export function exampleRankingComparison() {
  console.log('Example 5: Ranking Comparison');
  console.log('-'.repeat(80));

  const originalCandidates = generateSampleCandidates();
  const query = generateSampleQuery();

  const reranked = reranker.rerank(originalCandidates, query);

  const comparison = reranker.compareRankings(originalCandidates, reranked);

  console.log('  Ranking Changes:\n');
  console.log(`    Improved: ${comparison.improved} candidates`);
  console.log(`    Degraded: ${comparison.degraded} candidates`);
  console.log(`    Unchanged: ${comparison.unchanged} candidates\n`);

  if (comparison.top_changes.length > 0) {
    console.log('  Significant Changes (≥3 positions):\n');
    comparison.top_changes.forEach((change) => {
      const direction = change.old_rank > change.new_rank ? '↑' : '↓';
      const magnitude = Math.abs(change.old_rank - change.new_rank);
      console.log(`    ${change.chunk_id}: Rank ${change.old_rank} → ${change.new_rank} ${direction} (${magnitude})`);
    });
  }

  console.log('\n  ✅ Success\n');
}

/**
 * Example 6: Type match bonus demonstration
 */
export function exampleTypeMatchBonus() {
  console.log('Example 6: Type Match Bonus');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();

  const intents = [
    QueryIntent.RETRIEVE_MEDICATIONS,
    QueryIntent.RETRIEVE_NOTES,
    QueryIntent.RETRIEVE_CARE_PLANS,
  ];

  intents.forEach((intent) => {
    const query: StructuredQuery = {
      original_query: 'patient information',
      patient_id: 'patient_123',
      intent,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: `intent_${intent}`,
    };

    console.log(`  Intent: ${intent}\n`);

    const reranked = reranker.rerank(candidates, query, 5);

    reranked.slice(0, 3).forEach((c) => {
      console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
      console.log(`       Type: ${c.metadata.artifact_type}`);
      console.log(`       Score: ${c.score.toFixed(3)}`);
    });

    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Top-K re-ranking
 */
export function exampleTopKReRanking() {
  console.log('Example 7: Top-K Re-Ranking');
  console.log('-'.repeat(80));

  // Generate more candidates
  const candidates = generateSampleCandidates();
  const query = generateSampleQuery();

  const topKValues = [3, 5, 10];

  topKValues.forEach((k) => {
    console.log(`  Re-ranking top ${k} candidates:\n`);

    // Re-rank with different top-K values
    reranker.rerank(candidates, query, k);

    console.log(`    Total candidates: ${candidates.length}`);
    console.log(`    Re-ranked: ${Math.min(k, candidates.length)}`);
    console.log(`    Not re-ranked: ${Math.max(0, candidates.length - k)}\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Batch re-ranking
 */
export function exampleBatchReRanking() {
  console.log('Example 8: Batch Re-Ranking');
  console.log('-'.repeat(80));

  const candidateLists = [
    generateSampleCandidates(),
    generateSampleCandidates(),
    generateSampleCandidates(),
  ];

  const queries: StructuredQuery[] = [
    {
      original_query: 'medications',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_MEDICATIONS,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: 'batch_001',
    },
    {
      original_query: 'clinical notes',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_NOTES,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: 'batch_002',
    },
    {
      original_query: 'care plans',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_CARE_PLANS,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: 'batch_003',
    },
  ];

  console.log(`  Batch re-ranking ${candidateLists.length} queries...\n`);

  const reranked = reranker.batchRerank(candidateLists, queries);

  reranked.forEach((candidates, i) => {
    console.log(`  Query ${i + 1}: "${queries[i].original_query}"`);
    console.log(`    Top result: ${candidates[0].chunk.chunk_id}`);
    console.log(`    Score: ${candidates[0].score.toFixed(3)}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Re-ranking weights
 */
export function exampleReRankingWeights() {
  console.log('Example 9: Re-Ranking Weights');
  console.log('-'.repeat(80));

  const weights = reranker.getDefaultWeights();

  console.log('  Default Re-Ranking Weights:\n');
  console.log(`    Original Score:   ${(weights.original_score * 100).toFixed(0)}%`);
  console.log(`    Entity Coverage:  ${(weights.entity_coverage * 100).toFixed(0)}%`);
  console.log(`    Query Overlap:    ${(weights.query_overlap * 100).toFixed(0)}%`);
  console.log(`    Type Match Bonus: ${(weights.type_match_bonus * 100).toFixed(0)}%\n`);

  const sum =
    weights.original_score +
    weights.entity_coverage +
    weights.query_overlap +
    weights.type_match_bonus;

  console.log(`  Total: ${(sum * 100).toFixed(0)}%`);
  console.log(`  Valid: ${Math.abs(sum - 1.0) < 0.01 ? 'Yes ✓' : 'No ✗'}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Impact of entity matches
 */
export function exampleEntityImpact() {
  console.log('Example 10: Impact of Entity Matches');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();

  // Scenario 1: No entities
  const query1: StructuredQuery = {
    original_query: 'patient information',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_ALL,
    entities: [],
    temporal_filter: null,
    filters: {},
    detail_level: 3,
    query_id: 'scenario_1',
  };

  // Scenario 2: With entities
  const query2: StructuredQuery = {
    original_query: 'metformin for diabetes',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_MEDICATIONS,
    entities: [
      {
        text: 'metformin',
        type: 'medication',
        normalized: 'metformin',
        confidence: 0.95,
      },
      {
        text: 'diabetes',
        type: 'condition',
        normalized: 'diabetes',
        confidence: 0.90,
      },
    ] as Entity[],
    temporal_filter: null,
    filters: {},
    detail_level: 3,
    query_id: 'scenario_2',
  };

  console.log('  Scenario 1: No Entities\n');
  const reranked1 = reranker.rerank(candidates, query1, 3);
  reranked1.forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id} - ${c.score.toFixed(3)}`);
  });

  console.log('\n  Scenario 2: With Entities (metformin, diabetes)\n');
  const reranked2 = reranker.rerank(candidates, query2, 3);
  reranked2.forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id} - ${c.score.toFixed(3)}`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 11: Before/After comparison
 */
export function exampleBeforeAfter() {
  console.log('Example 11: Before/After Re-Ranking');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const query = generateSampleQuery();

  console.log('  BEFORE Re-Ranking:\n');
  candidates.slice(0, 5).forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
    console.log(`       Score: ${c.score.toFixed(3)}`);
    console.log(`       Type: ${c.metadata.artifact_type}`);
    console.log(`       Snippet: ${c.chunk.content.substring(0, 60)}...`);
    console.log('');
  });

  const reranked = reranker.rerank(candidates, query);

  console.log('  AFTER Re-Ranking:\n');
  reranked.slice(0, 5).forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
    console.log(`       Score: ${c.score.toFixed(3)}`);
    console.log(`       Type: ${c.metadata.artifact_type}`);
    console.log(`       Snippet: ${c.chunk.content.substring(0, 60)}...`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('RE-RANKER SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleBasicReRanking();
    exampleQueryRelevance();
    exampleEntityCoverage();
    exampleDetailedReRanking();
    exampleRankingComparison();
    exampleTypeMatchBonus();
    exampleTopKReRanking();
    exampleBatchReRanking();
    exampleReRankingWeights();
    exampleEntityImpact();
    exampleBeforeAfter();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
