#!/usr/bin/env ts-node
/**
 * Test Multi-Hop Retrieval
 *
 * Tests Phase 5: Multi-Hop Retrieval with relationship expansion
 *
 * Prerequisites:
 * - Run test-enhanced-chunking.ts first to populate chunk_metadata with enriched chunks
 * - PostgreSQL running with enriched chunks
 * - FAISS index populated with chunk embeddings
 *
 * Usage:
 * POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_DB=avon_health_rag POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres npx ts-node scripts/test-multi-hop-retrieval.ts
 */

import multiHopRetrieverService from '../src/services/multi-hop-retriever.service';
import enhancedChunkingService from '../src/services/enhanced-chunking.service';
import { StructuredQuery } from '../src/services/query-understanding-agent.service';

const PATIENT_ID = 'patient-123';
const TEST_QUERY = 'What medications is the patient taking?';

async function testMultiHopRetrieval() {
  console.log('='.repeat(80));
  console.log('MULTI-HOP RETRIEVAL TEST (PHASE 5)');
  console.log('='.repeat(80));
  console.log(`\nPatient ID: ${PATIENT_ID}`);
  console.log(`Test Query: "${TEST_QUERY}"\n`);

  try {
    // Step 1: Verify enriched chunks exist
    console.log('='.repeat(80));
    console.log('STEP 1: Verifying Enriched Chunks');
    console.log('='.repeat(80) + '\n');

    const enrichedChunks = await enhancedChunkingService.getEnrichedChunks(PATIENT_ID);
    const allChunks = await enhancedChunkingService.getChunksByPatient(PATIENT_ID);

    if (allChunks.length === 0) {
      console.error('❌ No chunks found!');
      console.error('Please run: npx ts-node scripts/test-enhanced-chunking.ts first');
      process.exit(1);
    }

    console.log(`✓ Found ${allChunks.length} total chunks`);
    console.log(`✓ ${enrichedChunks.length} chunks have enriched_text`);

    const stats = await enhancedChunkingService.getEnrichmentStats(PATIENT_ID);
    console.log(`✓ Average ${stats.avg_relationships_per_chunk.toFixed(1)} relationships per chunk`);

    // Step 2: Test retrieval WITHOUT multi-hop (baseline)
    console.log('\n' + '='.repeat(80));
    console.log('STEP 2: Baseline Retrieval (NO Multi-Hop)');
    console.log('='.repeat(80) + '\n');

    const structuredQuery: StructuredQuery = {
      query_id: 'test-baseline',
      original_query: TEST_QUERY,
      patient_id: PATIENT_ID,
      intent: 'RETRIEVE_MEDICATIONS',
      entities: [],
      filters: {
        artifact_types: ['medication'],
        date_range: undefined,
      },
      reformulated_query: TEST_QUERY,
    };

    const baselineResult = await multiHopRetrieverService.retrieve(structuredQuery, 5, {
      enableMultiHop: false,
      maxHops: 0,
    });

    console.log('Baseline Results:');
    console.log(`  - Candidates: ${baselineResult.candidates.length}`);
    console.log(`  - Retrieval time: ${baselineResult.retrieval_time_ms}ms`);
    console.log(`  - Initial chunks: ${baselineResult.hop_stats.initial_chunks}`);
    console.log(`  - Enriched chunks: ${baselineResult.enrichment_stats.enriched_chunks}`);

    // Step 3: Test retrieval WITH 1-hop expansion
    console.log('\n' + '='.repeat(80));
    console.log('STEP 3: Multi-Hop Retrieval (1-Hop Expansion)');
    console.log('='.repeat(80) + '\n');

    const hop1Query: StructuredQuery = {
      ...structuredQuery,
      query_id: 'test-1hop',
    };

    const hop1Result = await multiHopRetrieverService.retrieve(hop1Query, 10, {
      enableMultiHop: true,
      maxHops: 1,
      relationshipBoost: 0.3,
      useEnrichedText: true,
    });

    console.log('1-Hop Results:');
    console.log(`  - Total candidates: ${hop1Result.candidates.length}`);
    console.log(`  - Retrieval time: ${hop1Result.retrieval_time_ms}ms`);
    console.log(`  - Initial chunks: ${hop1Result.hop_stats.initial_chunks}`);
    console.log(`  - 1-hop chunks: ${hop1Result.hop_stats.hop_1_chunks}`);
    console.log(`  - Relationships followed: ${hop1Result.hop_stats.total_relationships_followed}`);
    console.log(`  - Enriched chunks: ${hop1Result.enrichment_stats.enriched_chunks}`);
    console.log(
      `  - Avg enrichment score: ${hop1Result.enrichment_stats.avg_enrichment_score.toFixed(2)}`
    );

    // Step 4: Test retrieval WITH 2-hop expansion
    console.log('\n' + '='.repeat(80));
    console.log('STEP 4: Multi-Hop Retrieval (2-Hop Expansion)');
    console.log('='.repeat(80) + '\n');

    const hop2Query: StructuredQuery = {
      ...structuredQuery,
      query_id: 'test-2hop',
    };

    const hop2Result = await multiHopRetrieverService.retrieve(hop2Query, 15, {
      enableMultiHop: true,
      maxHops: 2,
      relationshipBoost: 0.3,
      useEnrichedText: true,
    });

    console.log('2-Hop Results:');
    console.log(`  - Total candidates: ${hop2Result.candidates.length}`);
    console.log(`  - Retrieval time: ${hop2Result.retrieval_time_ms}ms`);
    console.log(`  - Initial chunks: ${hop2Result.hop_stats.initial_chunks}`);
    console.log(`  - 1-hop chunks: ${hop2Result.hop_stats.hop_1_chunks}`);
    console.log(`  - 2-hop chunks: ${hop2Result.hop_stats.hop_2_chunks}`);
    console.log(`  - Relationships followed: ${hop2Result.hop_stats.total_relationships_followed}`);
    console.log(`  - Enriched chunks: ${hop2Result.enrichment_stats.enriched_chunks}`);
    console.log(
      `  - Avg enrichment score: ${hop2Result.enrichment_stats.avg_enrichment_score.toFixed(2)}`
    );

    // Step 5: Compare results
    console.log('\n' + '='.repeat(80));
    console.log('STEP 5: Comparison Analysis');
    console.log('='.repeat(80) + '\n');

    console.log('Result Comparison:');
    console.log(`  Baseline: ${baselineResult.candidates.length} chunks`);
    console.log(`  1-Hop:    ${hop1Result.candidates.length} chunks (+${hop1Result.candidates.length - baselineResult.candidates.length})`);
    console.log(`  2-Hop:    ${hop2Result.candidates.length} chunks (+${hop2Result.candidates.length - baselineResult.candidates.length})`);

    console.log('\nRelationship Expansion:');
    console.log(`  1-Hop: ${hop1Result.hop_stats.total_relationships_followed} relationships followed`);
    console.log(`  2-Hop: ${hop2Result.hop_stats.total_relationships_followed} relationships followed`);

    console.log('\nEnrichment Quality:');
    console.log(
      `  Baseline: ${baselineResult.enrichment_stats.avg_enrichment_score.toFixed(2)} avg score`
    );
    console.log(
      `  1-Hop:    ${hop1Result.enrichment_stats.avg_enrichment_score.toFixed(2)} avg score`
    );
    console.log(
      `  2-Hop:    ${hop2Result.enrichment_stats.avg_enrichment_score.toFixed(2)} avg score`
    );

    // Step 6: Sample enriched candidates
    console.log('\n' + '='.repeat(80));
    console.log('STEP 6: Sample Enriched Candidates');
    console.log('='.repeat(80) + '\n');

    if (hop1Result.candidates.length > 0) {
      const sample = hop1Result.candidates[0];
      console.log('Sample Candidate (1-Hop):');
      console.log('-'.repeat(80));
      console.log(`Chunk ID: ${sample.chunk.chunk_id}`);
      console.log(`Artifact Type: ${sample.metadata.artifact_type}`);
      console.log(`Score: ${sample.score.toFixed(3)}`);
      console.log(`Hop Distance: ${sample.hop_distance}`);
      console.log(`Enrichment Score: ${sample.enrichment_score?.toFixed(2) || 'N/A'}`);
      console.log(`Related Artifacts: ${sample.related_artifacts?.length || 0}`);
      console.log(`\nChunk Text (first 200 chars):`);
      console.log(sample.chunk.content.substring(0, 200) + '...');
      console.log('-'.repeat(80));
    }

    // Step 7: Quality Assessment
    console.log('\n' + '='.repeat(80));
    console.log('STEP 7: Quality Assessment');
    console.log('='.repeat(80) + '\n');

    const passedTests: string[] = [];
    const failedTests: string[] = [];

    if (baselineResult.candidates.length > 0) {
      passedTests.push('✓ Baseline retrieval working');
    } else {
      failedTests.push('✗ Baseline retrieval failed');
    }

    if (hop1Result.hop_stats.hop_1_chunks > 0) {
      passedTests.push(`✓ 1-hop expansion working (${hop1Result.hop_stats.hop_1_chunks} chunks added)`);
    } else {
      failedTests.push('✗ 1-hop expansion produced no results');
    }

    if (hop1Result.hop_stats.total_relationships_followed > 0) {
      passedTests.push(
        `✓ Relationships followed (${hop1Result.hop_stats.total_relationships_followed} total)`
      );
    } else {
      failedTests.push('✗ No relationships followed');
    }

    if (hop1Result.enrichment_stats.avg_enrichment_score >= 0.4) {
      passedTests.push(
        `✓ Good enrichment quality (${hop1Result.enrichment_stats.avg_enrichment_score.toFixed(2)})`
      );
    } else {
      failedTests.push(
        `✗ Low enrichment quality (${hop1Result.enrichment_stats.avg_enrichment_score.toFixed(2)})`
      );
    }

    if (hop1Result.candidates.length > baselineResult.candidates.length) {
      passedTests.push(
        '✓ Multi-hop retrieval expands result set (+' +
          (hop1Result.candidates.length - baselineResult.candidates.length) +
          ' chunks)'
      );
    } else {
      failedTests.push('✗ Multi-hop retrieval did not expand results');
    }

    // Print results
    if (passedTests.length > 0) {
      console.log('Passed Tests:');
      passedTests.forEach((test) => console.log(`  ${test}`));
    }

    if (failedTests.length > 0) {
      console.log('\nFailed Tests:');
      failedTests.forEach((test) => console.log(`  ${test}`));
    }

    const overallSuccess = failedTests.length === 0;
    console.log('\n' + '='.repeat(80));
    if (overallSuccess) {
      console.log('✓ ALL TESTS PASSED!');
    } else {
      console.log(`⚠ ${failedTests.length} TEST(S) FAILED`);
    }
    console.log('='.repeat(80) + '\n');

    // Close connections
    await multiHopRetrieverService.close();
    await enhancedChunkingService.close();

    process.exit(overallSuccess ? 0 : 1);
  } catch (error) {
    console.error('\n✗ Test failed with error:', error);
    await multiHopRetrieverService.close();
    await enhancedChunkingService.close();
    process.exit(1);
  }
}

// Run test
testMultiHopRetrieval();
