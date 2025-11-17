#!/usr/bin/env ts-node
/**
 * Test Enhanced Chunking
 *
 * Tests Phase 4: Enhanced Chunking with enriched text
 *
 * Prerequisites:
 * - Run test-enrichment.ts first to populate enriched_artifacts table
 * - PostgreSQL running with enrichment data
 *
 * Usage:
 * POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_DB=avon_health_rag POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres npx ts-node scripts/test-enhanced-chunking.ts
 */

import enhancedChunkingService from '../src/services/enhanced-chunking.service';
import enrichmentStorageService from '../src/services/enrichment-storage.service';
import emrService from '../src/services/emr.service';
import { Artifact } from '../src/types/artifact.types';

const PATIENT_ID = 'patient-123';

async function testEnhancedChunking() {
  console.log('='.repeat(80));
  console.log('ENHANCED CHUNKING TEST (PHASE 4)');
  console.log('='.repeat(80));
  console.log(`\nPatient ID: ${PATIENT_ID}\n`);

  try {
    // Step 1: Verify enriched artifacts exist
    console.log('='.repeat(80));
    console.log('STEP 1: Verifying Enriched Artifacts');
    console.log('='.repeat(80) + '\n');

    const enrichedArtifacts = await enrichmentStorageService.getEnrichedArtifactsByPatient(
      PATIENT_ID
    );

    if (enrichedArtifacts.length === 0) {
      console.error('❌ No enriched artifacts found!');
      console.error('Please run: npx ts-node scripts/test-enrichment.ts first');
      process.exit(1);
    }

    console.log(`✓ Found ${enrichedArtifacts.length} enriched artifacts`);
    console.log(`  - Medications: ${enrichedArtifacts.filter((a) => a.artifact_type === 'medication').length}`);
    console.log(`  - Conditions: ${enrichedArtifacts.filter((a) => a.artifact_type === 'condition').length}`);
    console.log(`  - Care Plans: ${enrichedArtifacts.filter((a) => a.artifact_type === 'care_plan').length}`);

    // Step 2: Fetch raw artifacts for chunking
    console.log('\n' + '='.repeat(80));
    console.log('STEP 2: Fetching Raw Artifacts');
    console.log('='.repeat(80) + '\n');

    const medicationResult = await emrService.fetchMedications(PATIENT_ID);
    const conditionResult = await emrService.fetchConditions(PATIENT_ID);

    const rawArtifacts: Artifact[] = [
      ...medicationResult.data.slice(0, 5).map((med: any) => ({
        id: med.id,
        patient_id: PATIENT_ID,
        type: 'medication' as const,
        text: `Medication: ${med.name}${med.dosage ? ` ${med.dosage}` : ''}`,
        occurred_at: med.prescribed_at || new Date().toISOString(),
        author: med.prescriber,
        source: 'avon_health_api',
      })),
      ...conditionResult.data.slice(0, 5).map((cond: any) => ({
        id: cond.id,
        patient_id: PATIENT_ID,
        type: 'condition' as const,
        text: `Condition: ${cond.name}${cond.code ? ` (${cond.code})` : ''}`,
        occurred_at: cond.diagnosis_date || cond.created_at || new Date().toISOString(),
        author: undefined,
        source: 'avon_health_api',
      })),
    ];

    console.log(`✓ Fetched ${rawArtifacts.length} raw artifacts for chunking`);

    // Step 3: Chunk with enrichment (uses enriched_text)
    console.log('\n' + '='.repeat(80));
    console.log('STEP 3: Chunking WITH Enrichment');
    console.log('='.repeat(80) + '\n');

    const enrichedResult = await enhancedChunkingService.chunkWithEnrichment(rawArtifacts, {
      useEnrichment: true,
      storeToDatabase: true,
      contextExpansionLevel: 1,
    });

    console.log('Enriched Chunking Results:');
    console.log(`  - Total chunks: ${enrichedResult.total_chunks}`);
    console.log(`  - Enriched chunks: ${enrichedResult.enriched_count}`);
    console.log(`  - Original chunks: ${enrichedResult.original_count}`);
    console.log(`  - Enrichment rate: ${((enrichedResult.enriched_count / enrichedResult.total_chunks) * 100).toFixed(1)}%`);
    console.log(`  - Processing time: ${enrichedResult.processing_time_ms}ms`);

    // Step 4: Compare enriched vs original chunks
    console.log('\n' + '='.repeat(80));
    console.log('STEP 4: Comparing Enriched vs Original Chunks');
    console.log('='.repeat(80) + '\n');

    // Chunk same artifacts WITHOUT enrichment (uses original text)
    const originalResult = await enhancedChunkingService.chunkWithEnrichment(rawArtifacts, {
      useEnrichment: false,
      storeToDatabase: false, // Don't overwrite enriched chunks
      contextExpansionLevel: 0,
    });

    console.log('Original Chunking Results:');
    console.log(`  - Total chunks: ${originalResult.total_chunks}`);
    console.log(`  - Processing time: ${originalResult.processing_time_ms}ms`);

    // Show side-by-side comparison
    const enrichedChunk = enrichedResult.chunks.find((c) => c.enriched_text);
    const originalChunk = originalResult.chunks.find(
      (c) => c.artifact_id === enrichedChunk?.artifact_id
    );

    if (enrichedChunk && originalChunk) {
      console.log('\nSample Comparison (First Enriched Artifact):');
      console.log('-'.repeat(80));
      console.log('ORIGINAL CHUNK:');
      console.log(originalChunk.chunk_text.substring(0, 150) + '...');
      console.log('\nENRICHED CHUNK:');
      console.log(enrichedChunk.enriched_text?.substring(0, 300) + '...');
      console.log('\nEnrichment Metadata:');
      console.log(`  - Relationship IDs: ${enrichedChunk.relationship_ids?.length || 0}`);
      console.log(`  - Context Expansion Level: ${enrichedChunk.context_expansion_level}`);
      console.log(`  - Has Extracted Entities: ${!!enrichedChunk.extracted_entities}`);
      console.log('-'.repeat(80));
    }

    // Step 5: Retrieve and verify stored chunks
    console.log('\n' + '='.repeat(80));
    console.log('STEP 5: Verifying Stored Chunks');
    console.log('='.repeat(80) + '\n');

    const storedChunks = await enhancedChunkingService.getChunksByPatient(PATIENT_ID);
    const enrichedStoredChunks = await enhancedChunkingService.getEnrichedChunks(PATIENT_ID);

    console.log(`✓ Retrieved ${storedChunks.length} total chunks from database`);
    console.log(`✓ ${enrichedStoredChunks.length} chunks have enriched_text`);

    // Show enrichment stats
    const stats = await enhancedChunkingService.getEnrichmentStats(PATIENT_ID);

    console.log('\nEnrichment Statistics:');
    console.log(`  - Total chunks: ${stats.total_chunks}`);
    console.log(`  - Enriched chunks: ${stats.enriched_chunks}`);
    console.log(`  - Original chunks: ${stats.original_chunks}`);
    console.log(`  - Enrichment percentage: ${stats.enrichment_percentage.toFixed(1)}%`);
    console.log(`  - Avg relationships per chunk: ${stats.avg_relationships_per_chunk.toFixed(1)}`);

    // Step 6: Quality Assessment
    console.log('\n' + '='.repeat(80));
    console.log('STEP 6: Quality Assessment');
    console.log('='.repeat(80) + '\n');

    const passedTests: string[] = [];
    const failedTests: string[] = [];

    if (enrichedResult.enriched_count > 0) {
      passedTests.push('✓ Successfully created enriched chunks');
    } else {
      failedTests.push('✗ No enriched chunks created');
    }

    if (stats.enrichment_percentage >= 50) {
      passedTests.push(`✓ Enrichment rate ≥50% (${stats.enrichment_percentage.toFixed(1)}%)`);
    } else {
      failedTests.push(`✗ Enrichment rate <50% (${stats.enrichment_percentage.toFixed(1)}%)`);
    }

    if (stats.avg_relationships_per_chunk > 0) {
      passedTests.push(
        `✓ Chunks have relationships (avg: ${stats.avg_relationships_per_chunk.toFixed(1)})`
      );
    } else {
      failedTests.push('✗ No relationship data in chunks');
    }

    if (storedChunks.length === enrichedResult.total_chunks) {
      passedTests.push('✓ All chunks stored to database successfully');
    } else {
      failedTests.push(
        `✗ Storage mismatch (created: ${enrichedResult.total_chunks}, stored: ${storedChunks.length})`
      );
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
    await enhancedChunkingService.close();
    await enrichmentStorageService.close();

    process.exit(overallSuccess ? 0 : 1);
  } catch (error) {
    console.error('\n✗ Test failed with error:', error);
    await enhancedChunkingService.close();
    await enrichmentStorageService.close();
    process.exit(1);
  }
}

// Run test
testEnhancedChunking();
